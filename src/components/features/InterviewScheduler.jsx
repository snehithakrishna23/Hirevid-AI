import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Phone, Users, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, MoreVertical, CalendarDays } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Pre-seeded local time slots (9AM to 6PM)
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function InterviewScheduler({ currentUser, candidates = [], jobs = [], showToast }) {
  // Navigation & Date calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [interviewType, setInterviewType] = useState('video'); // 'video', 'in_person', 'phone'
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(45); // 30, 45, 60
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dropdown states
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Fetch interviews from Supabase
  const loadInterviews = async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      if (supabase) {
        // Query interviews table joined with candidate users
        const { data, error } = await supabase
          .from('interviews')
          .select(`
            *,
            candidate:candidate_id(name, email),
            job:job_id(title)
          `)
          .eq('recruiter_id', userId)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at');

        if (error) {
          console.warn("Supabase load interviews failed, falling back to local mocks: ", error.message);
          useMocksFallback();
        } else if (data) {
          const mapped = data.map(item => {
            const candidateData = Array.isArray(item.candidate) ? item.candidate[0] : item.candidate;
            const jobData = Array.isArray(item.job) ? item.job[0] : item.job;

            return {
              id: item.id,
              candidateId: item.candidate_id,
              candidateName: candidateData?.name || 'Anonymous',
              candidateEmail: candidateData?.email || '',
              jobId: item.job_id,
              jobTitle: jobData?.title || 'Software Developer',
              scheduledAt: new Date(item.scheduled_at),
              duration: item.duration_minutes || 45,
              type: item.interview_type || 'video',
              notes: item.notes || '',
              status: item.status || 'scheduled'
            };
          });
          setInterviews(mapped);
        } else {
          useMocksFallback();
        }
      } else {
        useMocksFallback();
      }
    } catch (err) {
      console.error("Error loading interviews:", err);
      useMocksFallback();
    } finally {
      setLoading(false);
    }
  };

  const useMocksFallback = () => {
    // Retrieve mocks from localStorage
    const saved = localStorage.getItem(`interviews_${currentUser?.id || 'demo'}`);
    if (saved) {
      const parsed = JSON.parse(saved).map(item => ({
        ...item,
        scheduledAt: new Date(item.scheduledAt)
      }));
      setInterviews(parsed);
    } else {
      // Seed default mockup interview
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const defaultMock = [
        {
          id: 'int-mock-1',
          candidateId: candidates[0]?.id || 'cand-1',
          candidateName: candidates[0]?.name || 'Sarah Jenkins',
          candidateEmail: candidates[0]?.email || 'sarah.j@devmail.com',
          jobId: jobs[0]?.id || 'job-1',
          jobTitle: jobs[0]?.title || 'Senior Frontend Engineer (React & Tailwind)',
          scheduledAt: tomorrow,
          duration: 45,
          type: 'video',
          notes: 'Discuss WebRTC module scaling and responsive styling hooks.',
          status: 'scheduled'
        }
      ];
      setInterviews(defaultMock);
      localStorage.setItem(`interviews_${currentUser?.id || 'demo'}`, JSON.stringify(defaultMock));
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [currentUser, candidates]);

  // Calendar parameters calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate complete calendar grid array [padding cells... days 1-N]
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime(''); // clear selected time when shifting dates
    }
  };

  // Compare dates helper
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Check if a day has any scheduled bookings
  const hasInterviewsOnDay = (date) => {
    return interviews.some(int => isSameDay(int.scheduledAt, date));
  };

  // Find booked slots on selected day
  const getBookedSlotsForSelectedDay = () => {
    return interviews
      .filter(int => isSameDay(int.scheduledAt, selectedDate) && int.status !== 'cancelled')
      .map(int => {
        const hours = int.scheduledAt.getHours();
        const mins = int.scheduledAt.getMinutes();
        return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}`;
      });
  };

  const bookedSlots = getBookedSlotsForSelectedDay();

  // Handle Form Submission
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      showToast("Please select a candidate.", "error");
      return;
    }
    if (!selectedJobId) {
      showToast("Please select a target job opening.", "error");
      return;
    }
    if (!selectedTime) {
      showToast("Please choose an interview time slot.", "error");
      return;
    }

    // Assemble scheduled date object
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const targetCand = candidates.find(c => c.id === selectedCandidateId);
    const targetJob = jobs.find(j => j.id === selectedJobId);

    const payload = {
      recruiter_id: currentUser?.id,
      candidate_id: selectedCandidateId,
      job_id: selectedJobId,
      scheduled_at: scheduledDateTime.toISOString(),
      duration_minutes: duration,
      interview_type: interviewType,
      notes: notes.trim(),
      status: 'scheduled'
    };

    try {
      setSubmitting(true);
      if (supabase) {
        const { error } = await supabase
          .from('interviews')
          .insert(payload);

        if (error) {
          console.warn("Interviews table missing, fallback saving to localStorage:", error.message);
          saveMockLocally(scheduledDateTime, targetCand, targetJob);
        } else {
          showToast(`Interview successfully booked with ${targetCand?.name || 'Candidate'}!`, "success");
          loadInterviews();
          resetForm();
        }
      } else {
        saveMockLocally(scheduledDateTime, targetCand, targetJob);
      }
    } catch (err) {
      console.error("Scheduling submission error:", err);
      showToast("Failed to record interview.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const saveMockLocally = (dateTime, targetCand, targetJob) => {
    const newMock = {
      id: 'int-' + Date.now(),
      candidateId: selectedCandidateId,
      candidateName: targetCand?.name || 'Anonymous',
      candidateEmail: targetCand?.email || 'cand@hirevid.ai',
      jobId: selectedJobId,
      jobTitle: targetJob?.title || 'Software Engineer',
      scheduledAt: dateTime,
      duration: duration,
      type: interviewType,
      notes: notes.trim(),
      status: 'scheduled'
    };

    const updated = [...interviews, newMock].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    setInterviews(updated);
    localStorage.setItem(`interviews_${currentUser?.id || 'demo'}`, JSON.stringify(updated));
    showToast(`Interview booked successfully with ${targetCand?.name || 'Candidate'} (Local Mode)!`, "success");
    resetForm();
  };

  const resetForm = () => {
    setSelectedCandidateId('');
    setSelectedJobId('');
    setSelectedTime('');
    setNotes('');
  };

  // Actions handlers
  const handleCancelInterview = async (id) => {
    try {
      if (supabase && typeof id === 'number') {
        const { error } = await supabase
          .from('interviews')
          .update({ status: 'cancelled' })
          .eq('id', id);

        if (!error) {
          showToast("Interview session cancelled.", "success");
          loadInterviews();
        } else {
          cancelLocally(id);
        }
      } else {
        cancelLocally(id);
      }
    } catch (err) {
      console.error("Cancel err:", err);
      cancelLocally(id);
    } finally {
      setActiveMenuId(null);
    }
  };

  const cancelLocally = (id) => {
    const updated = interviews.map(item => item.id === id ? { ...item, status: 'cancelled' } : item);
    setInterviews(updated);
    localStorage.setItem(`interviews_${currentUser?.id || 'demo'}`, JSON.stringify(updated));
    showToast("Interview session cancelled (Mock).", "success");
  };

  // Human friendly countdown triggers
  const getCountdownText = (scheduledDate) => {
    const now = new Date();
    const diffTime = scheduledDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isSameDay(scheduledDate, now)) {
      const hours = scheduledDate.getHours();
      const mins = scheduledDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHr = hours % 12 || 12;
      return `Today at ${formattedHr}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    if (isSameDay(scheduledDate, tomorrow)) {
      return 'Tomorrow';
    }

    if (diffDays <= 0) return 'Passed';
    if (diffDays === 1) return 'In 1 day';
    return `In ${diffDays} days`;
  };

  const getInterviewTypeIcon = (type) => {
    if (type === 'phone') return <Phone className="w-3.5 h-3.5" />;
    if (type === 'in_person') return <MapPin className="w-3.5 h-3.5" />;
    return <Video className="w-3.5 h-3.5" />;
  };

  const getFormattedTypeLabel = (type) => {
    if (type === 'phone') return 'Phone Call';
    if (type === 'in_person') return 'In Person';
    return 'Video Interview';
  };

  return (
    <div className="flex flex-col gap-6 w-full animation-fade-in">
      
      {/* SECTION 1: HEADER */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 font-jakarta">
          <CalendarIcon className="w-5 h-5 text-purple-400" />
          Interactive Interview Scheduler
        </h2>
        <p className="text-slate-400 text-xs font-sans">
          Coordinate video rooms, block time reservation slots, and audit schedules with verified calendar views.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SECTION 2: LEFT COLUMN - CALENDAR GRID (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-sm text-white font-jakarta">
                {monthNames[month]} {year}
              </h3>
              
              <div className="flex gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-[#11182D] rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-[#11182D] rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Headings Grid */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-slate-500 tracking-wider font-jakarta py-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-y-3.5 gap-x-1.5 text-center mt-1">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />;
                }

                const day = cell.getDate();
                const isSelected = isSameDay(cell, selectedDate);
                const isToday = isSameDay(cell, new Date());
                const hasBookings = hasInterviewsOnDay(cell);

                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => handleDayClick(cell)}
                    className="aspect-square flex flex-col items-center justify-between py-1.5 cursor-pointer relative group rounded-xl transition-all"
                  >
                    {/* Highlight Box layer */}
                    <div className={`absolute inset-0 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-500/10' 
                        : isToday 
                        ? 'border border-purple-500/30 bg-[#050816]/40' 
                        : 'bg-transparent hover:bg-[#11182D]/40'
                    }`}></div>

                    {/* Numeric Day label */}
                    <span className={`text-xs font-bold relative z-10 ${
                      isSelected ? 'text-white font-black' : isToday ? 'text-purple-400 font-extrabold' : 'text-slate-300'
                    }`}>
                      {day}
                    </span>

                    {/* Has booking indicators dot */}
                    {hasBookings && (
                      <span className={`w-1.5 h-1.5 rounded-full relative z-10 ${
                        isSelected ? 'bg-white' : 'bg-purple-500 animate-pulse'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* SECTION 3: RIGHT COLUMN - SCHEDULE FORM (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <form onSubmit={handleScheduleSubmit} className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-3 font-jakarta">
              Schedule New Interview
            </h3>

            {/* Candidate Selector */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Candidate Application</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold font-sans cursor-pointer"
                required
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map(cand => (
                  <option key={cand.id} value={cand.id}>
                    👤 {cand.name} ({cand.title || 'Applicant'})
                  </option>
                ))}
              </select>
            </div>

            {/* Job Selector */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Target Opening</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold font-sans cursor-pointer"
                required
              >
                <option value="">-- Choose opening --</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    💼 {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Interview Type Selection toggles */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta font-semibold">Session Type</label>
              <div className="grid grid-cols-3 gap-2 bg-[#050816] p-1 rounded-xl border border-white/5 shadow-inner">
                {[
                  { id: 'video', label: 'Video Call' },
                  { id: 'in_person', label: 'In Person' },
                  { id: 'phone', label: 'Phone' }
                ].map(type => (
                  <button 
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all tracking-wider ${
                      interviewType === type.id 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow shadow-purple-500/15' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Read selected Date */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-jakarta">Selected Date</label>
              <span className="text-xs text-purple-300 font-extrabold flex items-center gap-1.5 font-sans">
                📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Dynamic Time slots */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Available Reservation Slots</label>
              <div className="grid grid-cols-5 gap-2 mt-1 select-none">
                {TIME_SLOTS.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  const isChosen = selectedTime === time;

                  return (
                    <button 
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(time)}
                      className={`py-1.5 rounded-lg text-[10.5px] font-bold transition-all border ${
                        isChosen 
                          ? 'bg-purple-600 border-purple-500 text-white shadow shadow-purple-500/20' 
                          : isBooked
                          ? 'bg-[#050816]/30 border-white/[0.03] text-slate-600 cursor-not-allowed opacity-50'
                          : 'bg-[#050816] border-white/5 hover:border-purple-500/30 text-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration choices */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Duration Length</label>
              <div className="flex gap-3">
                {[30, 45, 60].map(mins => (
                  <button 
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-4 py-1 rounded-lg text-xs font-bold uppercase border transition-all ${
                      duration === mins 
                        ? 'bg-purple-600 border-purple-500 text-white shadow shadow-purple-500/10' 
                        : 'bg-[#050816] border-white/5 hover:border-purple-500/30 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Agenda Notes</label>
              <textarea 
                placeholder="Include agenda details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#050816] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed font-sans"
              />
            </div>

            {/* Gradient Trigger */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locking Slot...</span>
                </>
              ) : (
                <>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* SECTION 4: BOTTOM PANEL - UPCOMING INTERVIEWS FEED */}
      <div className="flex flex-col gap-4 mt-4 w-full">
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-jakarta flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          Upcoming Scheduled Sessions ({interviews.filter(i => i.status !== 'cancelled').length})
        </h3>
        
        {interviews.filter(i => i.status !== 'cancelled').length === 0 ? (
          <div className="text-center py-12 glass-card border border-white/5 rounded-2xl text-slate-500 font-semibold font-jakarta select-none">
            📂 No upcoming interview meetings booked. Schedule one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {interviews
              .filter(i => i.status !== 'cancelled')
              .map(int => (
                <div 
                  key={int.id}
                  className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col justify-between gap-5 relative group hover:border-white/10 transition-colors"
                >
                  {/* Top card metadata */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 items-center min-w-0">
                      {/* Initials avatar circle */}
                      <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-300 shrink-0">
                        {int.candidateName.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate font-jakarta">{int.candidateName}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-sans leading-tight max-w-[150px]">{int.jobTitle}</p>
                      </div>
                    </div>

                    {/* Actions drop trigger */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === int.id ? null : int.id)}
                        className="p-1 hover:bg-[#11182D] rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu overlay */}
                      {activeMenuId === int.id && (
                        <div className="absolute right-0 top-7 w-28 bg-[#0B1020] border border-white/10 rounded-lg p-1.5 shadow-2xl z-30 flex flex-col gap-1">
                          <button
                            onClick={() => {
                              showToast("Feature under development.", "error");
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-white/5 text-[10px] text-slate-300 hover:text-white rounded font-bold transition-all"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelInterview(int.id)}
                            className="w-full text-left px-2 py-1.5 hover:bg-red-500/10 text-[10px] text-red-400 hover:text-red-300 rounded font-bold transition-all"
                          >
                            Cancel Session
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle row date and duration badges */}
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#050816]/40 border border-white/[0.03]">
                    <div className="flex justify-between items-center text-[10.5px] text-purple-400 font-extrabold font-sans">
                      <span>
                        📅 {int.scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>
                        {int.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center mt-1">
                      {/* Countdown badge */}
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/25 text-purple-300 tracking-wider">
                        {getCountdownText(int.scheduledAt)}
                      </span>
                      
                      {/* Duration badge */}
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 tracking-wider flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {int.duration}m
                      </span>

                      {/* Type badge */}
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 tracking-wider flex items-center gap-1">
                        {getInterviewTypeIcon(int.type)}
                        {getFormattedTypeLabel(int.type)}
                      </span>
                    </div>
                  </div>

                  {/* Join Room CTA emerald button */}
                  <button 
                    onClick={() => {
                      showToast("Launching meeting room...", "success");
                    }}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-[10.5px] uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call Room</span>
                  </button>

                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}
