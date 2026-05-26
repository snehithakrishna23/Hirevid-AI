import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Search, 
  Calendar, 
  MessageSquare, 
  Video, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  UserCheck, 
  Building2, 
  ChevronRight, 
  Send,
  Sliders,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Camera
} from 'lucide-react';
import PipelineKanban from './PipelineKanban';

export default function RecruiterWorkspace({
  activeTab,
  setActiveTab,
  currentUser,
  candidates,
  jobs,
  interviews,
  onUpdateCandidateStatus,
  onScheduleInterview,
  onSendChatMessage
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState(50);
  
  // Active detailed preview drawer
  const [activeCandId, setActiveCandId] = useState(null);
  
  // Interactive Chat State
  const [chatCandId, setChatCandId] = useState('cand-1');
  const [chatInput, setChatInput] = useState('');

  // Scheduler Form
  const [scheduleNameId, setScheduleNameId] = useState('cand-1');
  const [scheduleJobId, setScheduleJobId] = useState('job-1');
  const [scheduleDate, setScheduleDate] = useState('2026-05-28');
  const [scheduleTime, setScheduleTime] = useState('14:00');
  
  // Virtual Interview Simulation
  const [intCandId, setIntCandId] = useState('cand-3');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [overallScore, setOverallScore] = useState(80);
  const [communicationScore, setCommunicationScore] = useState(80);
  const [technicalScore, setTechnicalScore] = useState(80);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [candidateAnswerTranscript, setCandidateAnswerTranscript] = useState('');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  
  // Organization profile
  const [companyName, setCompanyName] = useState(currentUser?.company || 'VividAI Systems');
  const [companyWebsite, setCompanyWebsite] = useState('https://vividai.com');
  const [companyInfo, setCompanyInfo] = useState('Leading the future of multimodal search indexers and video resumes.');

  // Sync company details when currentUser shifts
  useEffect(() => {
    if (currentUser?.company) {
      setCompanyName(currentUser.company);
    }
  }, [currentUser]);

  // Webcam
  const recruiterVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);

  const SCREENING_QUESTIONS = [
    "Tell us about a highly complex technical layout you built using React and modern styled grids.",
    "How do you optimize asynchronous frame loading or real-time WebRTC connections?",
    "Explain how you manage state and cache parsed attributes in client browsers.",
    "What practices do you employ to build fully inclusive and highly responsive components?"
  ];

  // Camera start when opening Virtual Interview Room
  useEffect(() => {
    if (activeTab === 'virtual') {
      startRecruiterCamera();
    } else {
      stopRecruiterCamera();
    }
    return () => stopRecruiterCamera();
  }, [activeTab]);

  // Dynamic AI Interview Answer Generation
  useEffect(() => {
    if (!intCand) return;
    
    setIsGeneratingAnswer(true);
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const questionText = SCREENING_QUESTIONS[currentQuestionIndex];
    
    const triggerMockFallback = () => {
      setTimeout(() => {
        // Fallback dynamic responses
        const firstSkill = intCand.skills && intCand.skills.length > 0 ? intCand.skills[0] : 'React';
        const secondSkill = intCand.skills && intCand.skills.length > 1 ? intCand.skills[1] : 'TypeScript';
        
        let ans = "";
        let tScore = 80;
        let cScore = 82;
        let notes = "";
        
        if (currentQuestionIndex === 0) {
          ans = `In my recent role, I had to build a complex dashboard containing multiple live drag-and-drop tiles. I used CSS Grid coupled with React refs to prevent unnecessary re-renders. I made sure to structure the grid tracks dynamically so it scaled flawlessly from ultra-wide displays down to mobile screens using ${firstSkill}.`;
          tScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 1.02)));
          cScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 0.98)));
          notes = `Demonstrated solid layout knowledge. Talked through CSS Grid tracks, dynamic ref-binding, and viewport scaling using ${firstSkill} effectively.`;
        } else if (currentQuestionIndex === 1) {
          ans = `To optimize asynchronous frame loading, I implement custom pre-fetching queues and lazy-loading in ${secondSkill}. For real-time WebRTC connections, I establish clean trackers on connection ice-states and shut down active stream tracks immediately when the candidate navigates away to save system resources.`;
          tScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 1.05)));
          cScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 0.95)));
          notes = `Clear explanation of WebRTC track shutdowns and async frame caching in ${secondSkill}. Very impressive architectural thinking.`;
        } else if (currentQuestionIndex === 2) {
          ans = `For state management, I rely on a mix of local state for modularity and global React contexts where necessary. To cache parsed attributes like PDF details or webcam urls, I serialize the data structures into Local Storage and sync them on mount to provide an instantaneous loading experience.`;
          tScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 1.01)));
          cScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 1.03)));
          notes = `Understands client-side state lifecycles and localStorage caching models very well. Clear, precise articulation.`;
        } else {
          ans = `To build fully inclusive components, I ensure semantic markup like dynamic select anchors and modular drawers are completely accessible. I verify keyboard navigation, focus-trapping inside dialog cards, and ARIA labels. Responsive scaling is designed using fluid styled grid structures.`;
          tScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 0.99)));
          cScore = Math.min(100, Math.max(60, Math.round((intCand.aiMatchScore || 75) * 1.04)));
          notes = `Highly passionate about accessible ARIA guidelines and inclusive keyboard focus-trapping. Excellent culture fit.`;
        }
        
        setCandidateAnswerTranscript(ans);
        setTechnicalScore(tScore);
        setCommunicationScore(cScore);
        setRecruiterNotes(notes);
        setIsGeneratingAnswer(false);
      }, 1000);
    };
    
    if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
      const prompt = `You are simulating a candidate named ${intCand.name} in a virtual job interview.
Their title/headline is: ${intCand.title}.
Their skills are: ${intCand.skills.join(', ')}.
Their biography is: "${intCand.bio}".

The interviewer has asked this screening question:
"${questionText}"

Please generate a highly realistic response to this question in the candidate's voice.
Keep the answer natural, conversational, technically accurate for their skills, and relatively brief (2 to 4 sentences maximum). Do NOT say you are an AI. 

Additionally, rate their response performance from 60 to 100 on these metrics:
1. "communicationScore" (rating from 60 to 100)
2. "technicalScore" (rating from 60 to 100)
3. "notes" (a concise 1-sentence reviewer feedback detail, e.g. "Excellent articulation of WebRTC ice-states and solid technical maturity.")

Return the output as a valid, parsable JSON object in exactly this format (do not include any markdown backticks, prefix, or extra text):
{
  "answer": "the simulated spoken response from the candidate",
  "communicationScore": 85,
  "technicalScore": 90,
  "notes": "reviewer notes about this response"
}`;

      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })
      .then(res => res.json())
      .then(resData => {
        try {
          if (resData && resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0].text) {
            let jsonText = resData.candidates[0].content.parts[0].text.trim();
            // strip potential markdown wrapper if Gemini adds it
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.slice(7, -3).trim();
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.slice(3, -3).trim();
            }
            const data = JSON.parse(jsonText);
            setCandidateAnswerTranscript(data.answer || '');
            setTechnicalScore(parseInt(data.technicalScore) || 80);
            setCommunicationScore(parseInt(data.communicationScore) || 80);
            setRecruiterNotes(data.notes || '');
          } else {
            throw new Error("Invalid response schema");
          }
        } catch (e) {
          console.warn("Gemini response parse error, falling back:", e);
          triggerMockFallback();
        } finally {
          setIsGeneratingAnswer(false);
        }
      })
      .catch(err => {
        console.error("Gemini interview feed API call failed, falling back:", err);
        triggerMockFallback();
      });
    } else {
      triggerMockFallback();
    }
  }, [intCandId, currentQuestionIndex]);

  const startRecruiterCamera = async () => {
    try {
      stopRecruiterCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamStreamRef.current = stream;
      if (recruiterVideoRef.current) {
        recruiterVideoRef.current.srcObject = stream;
        recruiterVideoRef.current.play();
      }
    } catch (err) {
      console.warn("Recruiter camera access denied or unavailable. Showing generic stream.", err);
    }
  };

  const stopRecruiterCamera = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (recruiterVideoRef.current) recruiterVideoRef.current.srcObject = null;
  };

  // Chat helper
  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChatMessage(chatCandId, chatInput.trim(), 'recruiter');
      setChatInput('');
    }
  };

  // Schedule helper
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const cand = candidates.find(c => c.id === scheduleNameId);
    const j = jobs.find(job => job.id === scheduleJobId);
    if (cand && j) {
      onScheduleInterview({
        id: 'int-' + Date.now(),
        candidateId: cand.id,
        candidateName: cand.name,
        role: j.title,
        date: scheduleDate,
        time: scheduleTime,
        platform: 'HireVid Virtual Room',
        status: 'Confirmed'
      });
      setActiveTab('pipeline');
    }
  };

  // Filters candidates
  const filteredCandidates = candidates.filter(cand => {
    const matchesSearch = 
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSkill = selectedSkill === 'All' || cand.skills.includes(selectedSkill);
    const matchesScore = cand.aiMatchScore >= minMatchScore;

    return matchesSearch && matchesSkill && matchesScore;
  });

  // Extract all unique skills across candidates for filters
  const allSkills = ['All', ...new Set(candidates.flatMap(c => c.skills))];

  const activeCand = candidates.find(c => c.id === activeCandId);
  const chatCand = candidates.find(c => c.id === chatCandId);
  const intCand = candidates.find(c => c.id === intCandId);

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#050816]">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-[#0B1020]/90 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
        
        {/* Recruiter Badge */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md shadow-purple-500/10">
            🏢
          </div>
          <div>
            <h3 className="font-bold text-sm text-white truncate max-w-[130px]">{companyName}</h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit mt-1">
              <ShieldCheck className="w-3 h-3" /> Verified Org
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5 flex-1">
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'pipeline' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Hiring Pipeline Board
          </button>

          <button 
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'search' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            Search Candidates
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">
              AI Match
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'scheduler' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Interview Scheduler
          </button>

          <button 
            onClick={() => {
              setActiveTab('virtual');
              startRecruiterCamera();
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'virtual' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            Virtual Interview Room
          </button>

          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'chats' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Talent Chat Box
          </button>
        </nav>
      </aside>

      {/* Main Recruiter Frame */}
      <section className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full min-w-0 flex flex-col animation-fade-in">
        
        {/* TAB 1: PIPELINE MANAGEMENT (KANBAN) */}
        {activeTab === 'pipeline' && (
          <PipelineKanban 
            candidates={candidates}
            jobs={jobs}
            onUpdateCandidateStatus={onUpdateCandidateStatus}
            onOpenCandidateDetail={(id) => setActiveCandId(id)}
          />
        )}

        {/* TAB 2: CANDIDATE SEARCH ENGINE */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">AI Candidate Search Engine</h2>
              <p className="text-slate-400 text-xs">Filter applicant databases by skill clusters, title search, or minimum AI skill match thresholds.</p>
            </div>

            {/* Controls panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0B1020]/60 p-4 rounded-xl border border-white/5">
              <div>
                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Search name or keyword</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search UI Developer..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Filter by Skill</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none font-semibold"
                >
                  {allSkills.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  <span>Min AI Match Score</span>
                  <span className="text-emerald-400 font-extrabold">{minMatchScore}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                  className="w-full accent-purple-600 mt-2 bg-[#050816] h-1.5 rounded-full"
                />
              </div>
            </div>

            {/* List candidate results */}
            <div className="grid gap-4">
              {filteredCandidates.length === 0 ? (
                <div className="text-center p-12 glass-card border border-white/5 rounded-xl text-slate-500">
                  📂 No applicants match these active filters.
                </div>
              ) : (
                filteredCandidates.map(cand => (
                  <div 
                    key={cand.id}
                    className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card-hover"
                  >
                    <div className="flex gap-4 items-center">
                      <img 
                        src={cand.avatar} 
                        alt={cand.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80&h=80';
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-base text-white">{cand.name}</h4>
                        <p className="text-xs text-slate-400">{cand.title} • {cand.location}</p>
                        
                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cand.skills.map(sk => (
                            <span key={sk} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-semibold border border-white/5">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] uppercase tracking-widest text-slate-500">AI Match Rating</span>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {cand.aiMatchScore}% Score
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveCandId(cand.id)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-95 transition-all shadow-md shadow-purple-500/10"
                      >
                        Review Profile
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INTERVIEW SCHEDULER */}
        {activeTab === 'scheduler' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Interview Scheduling & Sync</h2>
              <p className="text-slate-400 text-xs">Coordinate with applicants, select available timeslots, and trigger virtual meeting codes.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Form card */}
              <form onSubmit={handleScheduleSubmit} className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                <h3 className="font-bold text-sm text-white mb-2 pb-2 border-b border-white/5">Schedule a Virtual Panel</h3>
                
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Select Candidate</label>
                  <select
                    value={scheduleNameId}
                    onChange={(e) => setScheduleNameId(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
                  >
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.title})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Target Opening</label>
                  <select
                    value={scheduleJobId}
                    onChange={(e) => setScheduleJobId(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
                  >
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Meeting Date</label>
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all mt-2"
                >
                  Generate Invitation & Sync Calendar
                </button>
              </form>

              {/* Dynamic Schedules list */}
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-sm text-white pb-2 border-b border-white/5">Active Scheduled Sessions</h3>
                {interviews.length === 0 ? (
                  <div className="text-center p-6 bg-black/30 rounded-xl text-slate-500 text-xs">
                    No active interview meetings booked.
                  </div>
                ) : (
                  interviews.map(int => (
                    <div key={int.id} className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{int.candidateName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{int.role}</p>
                        <div className="flex items-center gap-2 text-[10px] text-purple-400 mt-2 font-bold">
                          <Clock className="w-3 h-3" /> {int.date} at {int.time}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setIntCandId(int.candidateId);
                          setActiveTab('virtual');
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded hover:bg-emerald-500/20 transition-all shrink-0"
                      >
                        Launch Room
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TALENT CHAT BOX */}
        {activeTab === 'chats' && (
          <div className="flex flex-col gap-6 flex-1 min-h-[400px]">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Interactive Candidate Chat</h2>
              <p className="text-slate-400 text-xs flex flex-wrap items-center gap-1.5">
                Interact with candidates manually. Chat replies are dynamically generated by the 
                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                  ✦ Gemini AI Model
                </span> 
                {import.meta.env.VITE_GEMINI_API_KEY ? 'via active API credentials.' : '(local fallback active). Add VITE_GEMINI_API_KEY to your .env to unlock full generative reasoning!'}
              </p>
            </div>

            <div className="flex-1 flex gap-4 bg-[#0B1020]/40 border border-white/5 rounded-2xl overflow-hidden min-h-[350px]">
              
              {/* Chat list left */}
              <div className="w-1/3 border-r border-white/5 flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 p-4 border-b border-white/5">Active Chats</span>
                <div className="flex-1 overflow-y-auto">
                  {candidates.map(cand => (
                    <div 
                      key={cand.id}
                      onClick={() => setChatCandId(cand.id)}
                      className={`flex gap-3 items-center p-3 cursor-pointer transition-colors ${
                        chatCandId === cand.id ? 'bg-purple-600/10 border-l-2 border-purple-500' : 'hover:bg-white/5'
                      }`}
                    >
                      <img 
                        src={cand.avatar} 
                        alt={cand.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="min-w-0 hidden sm:block">
                        <h4 className="font-bold text-xs text-white truncate">{cand.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{cand.chatHistory.length > 0 ? cand.chatHistory[cand.chatHistory.length - 1].text : 'No conversations yet'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat frame right */}
              <div className="flex-1 flex flex-col bg-black/20">
                {chatCand ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                      <div className="flex items-center gap-3">
                        <img src={chatCand.avatar} alt={chatCand.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <h4 className="font-bold text-xs text-white">{chatCand.name}</h4>
                          <p className="text-[10px] text-slate-400">{chatCand.title}</p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
                        {chatCand.aiMatchScore}% Match
                      </span>
                    </div>

                    {/* Messages panel */}
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                      {chatCand.chatHistory.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                          No messages exchanged yet. Send a note to start screening!
                        </div>
                      ) : (
                        chatCand.chatHistory.map((msg, i) => (
                          <div 
                            key={i}
                            className={`flex flex-col max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                              msg.sender === 'recruiter' 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white self-end rounded-tr-none' 
                                : 'bg-[#11182D] text-slate-200 self-start rounded-tl-none border border-white/5'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <span className="text-[8px] opacity-75 self-end mt-1">{msg.timestamp}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input box */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-black/40 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ask about WebRTC experience..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                      <button 
                        type="submit"
                        className="p-2.5 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition-colors flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Select a candidate chat to begin screening notes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VIRTUAL INTERVIEW ROOM SIMULATOR */}
        {activeTab === 'virtual' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Virtual Interview Room Simulator</h2>
              <p className="text-slate-400 text-xs flex flex-wrap items-center gap-1.5">
                Join split-screen rooms with candidates. Response transcripts and score analytics are dynamically synthesized by the 
                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                  ✦ Gemini AI Model
                </span>
                {import.meta.env.VITE_GEMINI_API_KEY ? 'via active API credentials.' : '(local fallback active). Add VITE_GEMINI_API_KEY to your .env to unlock full generative reasoning!'}
              </p>
            </div>

            {/* Selector bar */}
            <div className="flex gap-2 items-center bg-[#0B1020]/60 p-3 rounded-lg border border-white/5">
              <span className="text-xs text-slate-400 font-bold">Select Active Candidate Room:</span>
              <select
                value={intCandId}
                onChange={(e) => {
                  setIntCandId(e.target.value);
                  setCurrentQuestionIndex(0);
                }}
                className="bg-[#050816] border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:border-purple-500 outline-none font-semibold"
              >
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.title})</option>)}
              </select>
            </div>

            {/* Split viewport screens */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Left Screen: Video Panels Grid */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 aspect-video">
                  
                  {/* Candidate Feed */}
                  <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                    {(() => {
                      const videoUrl = (intCand && intCand.videoResumeUrl) 
                        ? intCand.videoResumeUrl 
                        : "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42280-large.mp4";
                      return (
                        <video 
                          key={videoUrl}
                          src={videoUrl} 
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      );
                    })()}
                    
                    {/* Identification tags overlay */}
                    <div className="absolute bottom-2 left-2 text-[8px] bg-black/80 px-2 py-0.5 rounded border border-white/5 font-bold uppercase tracking-wider text-purple-300">
                      Candidate: {intCand?.name || 'Applicant'}
                    </div>
                  </div>

                  {/* Recruiter Feed */}
                  <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                    <video 
                      ref={recruiterVideoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      playsInline
                      muted
                    />

                    {/* Generic loading if no webcam */}
                    {!webcamStreamRef.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                        <Camera className="w-6 h-6 text-slate-600 mb-1" />
                        <span className="text-[8px] uppercase tracking-wider text-slate-400">Recruiter Camera (Live preview if permitted)</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 text-[8px] bg-black/80 px-2 py-0.5 rounded border border-white/5 font-bold uppercase tracking-wider text-blue-300">
                      Interviewer (You)
                    </div>
                  </div>

                </div>

                {/* Question Prompts Drawer with Live AI Transcription */}
                <div className="glass-card p-5 rounded-xl border border-white/5 flex flex-col gap-3.5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Core Screening Question {currentQuestionIndex + 1}/4</span>
                    <button 
                      onClick={() => setCurrentQuestionIndex(prev => (prev + 1) % 4)}
                      className="text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase flex items-center gap-1"
                    >
                      Next Question &rarr;
                    </button>
                  </div>
                  
                  <div>
                    <span className="text-[9px] uppercase font-bold text-purple-400">Question:</span>
                    <p className="text-xs text-white font-semibold leading-relaxed mt-0.5">
                      "{SCREENING_QUESTIONS[currentQuestionIndex]}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      ✦ Live AI Response Transcript (Simulated):
                    </span>
                    {isGeneratingAnswer ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                        <span className="w-2.5 h-2.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                        <span>AI transcribing voice telemetry...</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-300 leading-relaxed italic mt-1.5 bg-black/30 border border-white/5 p-3 rounded-lg">
                        "{candidateAnswerTranscript || 'Establishing live stream track...'}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Screen: Recruiter Scorecard Panel */}
              <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col gap-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-white/5">Hiring Scorecard & Feedback</h3>
                
                {/* Communication Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Communication & Confidence</span>
                    <span className="font-bold text-purple-400">{communicationScore}/100</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={communicationScore}
                    onChange={(e) => setCommunicationScore(parseInt(e.target.value))}
                    className="w-full accent-purple-600 h-1 bg-[#050816] rounded-full"
                  />
                </div>

                {/* Technical Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Technical Competence</span>
                    <span className="font-bold text-purple-400">{technicalScore}/100</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={technicalScore}
                    onChange={(e) => setTechnicalScore(parseInt(e.target.value))}
                    className="w-full accent-purple-600 h-1 bg-[#050816] rounded-full"
                  />
                </div>

                {/* Notes box */}
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Interviewer Notes</label>
                  <textarea 
                    value={recruiterNotes}
                    onChange={(e) => setRecruiterNotes(e.target.value)}
                    placeholder="Candidate demonstrated great WebRTC insight, clear confidence, and structured problem solving patterns."
                    rows={3}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none"
                  />
                </div>

                {/* Score indicators */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#050816]/60 border border-white/5 text-xs mt-1">
                  <span className="text-slate-400">Aggregate Decision Index:</span>
                  <span className="font-extrabold text-emerald-400">{Math.round((communicationScore + technicalScore) / 2)}% Index</span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    onClick={() => {
                      onUpdateCandidateStatus(intCandId, 'Offered');
                      setActiveTab('pipeline');
                    }}
                    className="py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Selected / Offer
                  </button>
                  
                  <button 
                    onClick={() => {
                      onUpdateCandidateStatus(intCandId, 'Rejected');
                      setActiveTab('pipeline');
                    }}
                    className="py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Decline Applicant
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </section>

      {/* DETAILED APPLICANT PREVIEW MODAL */}
      {activeCand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 md:p-6 flex items-start justify-center animation-fade-in">
          
          {/* Floating Card Content Container */}
          <div className="bg-[#0B1020] border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl relative my-auto mt-4 md:mt-10 mb-4 flex flex-col">
            
            {/* Top Close Button and Back Navigation */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <button 
                onClick={() => setActiveCandId(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Pipeline
              </button>
              
              <button 
                onClick={() => setActiveCandId(null)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-Column Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              
              {/* Left Column (Approx 58% width) */}
              <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                
                {/* Profile Details Card */}
                <div className="relative bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex gap-4 items-center">
                      {activeCand.avatar ? (
                        <img 
                          src={activeCand.avatar} 
                          alt={activeCand.name} 
                          className="w-16 h-16 rounded-2xl object-cover border border-purple-500/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-300">
                          {activeCand.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-2xl font-extrabold text-white leading-tight">{activeCand.name}</h3>
                        <p className="text-sm text-slate-400 mt-0.5">{activeCand.title}</p>
                        
                        <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-400 mt-3">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> {activeCand.location}</span>
                          <span className="flex items-center gap-1.5">💼 {activeCand.experience || (activeCand.id === 'cand-1' ? '5 years exp' : activeCand.id === 'cand-3' ? '6 years exp' : '4 years exp')}</span>
                          <span className="flex items-center gap-1.5">🎓 {activeCand.education || 'CS Graduate'}</span>
                        </div>
                      </div>
                    </div>
  
                    {/* Match score percentage */}
                    <div className="text-right flex flex-col items-end">
                      <span className="text-5xl font-black text-amber-500 leading-none">
                        {activeCand.aiMatchScore}%
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1.5">AI Match</span>
                    </div>
                  </div>
  
                  {/* Skills tags list */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeCand.skills.map(sk => (
                      <span key={sk} className="text-[10px] font-bold px-3 py-1 rounded bg-[#11182D] border border-white/5 text-slate-300">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
  
                {/* Video Resume Card */}
                <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                      Video Resume
                    </span>
                  </div>
   
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 flex flex-col items-center justify-center text-center">
                    {activeCand.videoResumeUrl ? (
                      <>
                        <video 
                          key={activeCand.videoResumeUrl}
                          src={activeCand.videoResumeUrl} 
                          className="w-full h-full object-cover" 
                          controls
                          playsInline
                        />
                        <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-600/80 border border-purple-400/20 text-white">
                          ✦ AI Transcribed
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center p-6 text-center select-none">
                        <Video className="w-10 h-10 text-slate-600 mb-3" />
                        <span className="text-xs text-slate-400 font-semibold">No Video Resume Uploaded Yet</span>
                        <p className="text-[10px] text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">This applicant has registered but has not yet completed their video resume in the recording studio.</p>
                      </div>
                    )}
                  </div>
   
                  {/* Controls row (only if video exists) */}
                  {activeCand.videoResumeUrl && (
                    <div className="grid grid-cols-3 gap-3 text-xs mt-1">
                      <a 
                        href={activeCand.videoResumeUrl}
                        download
                        className="py-2.5 bg-black/40 border border-white/5 hover:bg-[#11182D] text-slate-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                        Download
                      </a>
                      <button className="py-2.5 bg-black/40 border border-white/5 hover:bg-[#11182D] text-slate-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0l-6-6"/></svg>
                        Fullscreen
                      </button>
                      <button className="py-2.5 bg-black/40 border border-white/5 hover:bg-[#11182D] text-slate-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                        Transcript
                      </button>
                    </div>
                  )}
                </div>
   
                {/* PDF Resume card */}
                <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    PDF Resume
                  </span>
                  
                  {activeCand.pdfResumeUrl ? (
                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-[200px]">
                            {activeCand.pdfResumeName || 'candidate_resume.pdf'}
                          </p>
                          <span className="text-[10px] text-slate-400">Uploaded Document</span>
                        </div>
                      </div>
    
                      <a 
                        href={activeCand.pdfResumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-black/60 hover:bg-[#11182D] border border-white/15 hover:border-purple-500/30 text-xs font-bold text-slate-300 rounded-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                      >
                        Open
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/10 border border-white/5 rounded-xl flex items-center justify-center text-center">
                      <div className="flex flex-col items-center p-2 select-none">
                        <FileText className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs text-slate-400 font-semibold">No PDF Resume Uploaded Yet</span>
                      </div>
                    </div>
                  )}
                </div>
  
                {/* Biography Section */}
                <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Biography
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeCand.bio}
                  </p>
                </div>
              </div>
  
              {/* Right Column (Approx 42% width) */}
              <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                
                {/* AI Match Insights Card */}
                <div className="relative bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  
                  <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5">
                    ✦ AI Match Insights
                  </span>
  
                  {/* Progress bars */}
                  <div className="flex flex-col gap-3.5">
                    {[
                      { label: 'Technical Skills', score: activeCand.id === 'cand-1' ? 92 : activeCand.id === 'cand-2' ? 84 : activeCand.id === 'cand-3' ? 96 : Math.min(100, Math.max(50, Math.round((activeCand.aiMatchScore || 60) * 1.05))), color: 'bg-blue-500' },
                      { label: 'Communication', score: activeCand.id === 'cand-1' ? 94 : activeCand.id === 'cand-2' ? 91 : activeCand.id === 'cand-3' ? 89 : Math.min(100, Math.max(50, Math.round((activeCand.aiMatchScore || 60) * 0.95))), color: 'bg-purple-500' },
                      { label: 'Experience Match', score: activeCand.id === 'cand-1' ? 85 : activeCand.id === 'cand-2' ? 78 : activeCand.id === 'cand-3' ? 93 : Math.min(100, Math.max(50, Math.round((activeCand.aiMatchScore || 60) * 0.90))), color: 'bg-red-500' },
                      { label: 'Culture Fit', score: activeCand.id === 'cand-1' ? 88 : activeCand.id === 'cand-2' ? 90 : activeCand.id === 'cand-3' ? 85 : Math.min(100, Math.max(50, Math.round((activeCand.aiMatchScore || 60) * 0.92))), color: 'bg-amber-500' }
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-slate-400 font-medium">{metric.label}</span>
                          <span className="font-bold text-white">{metric.score}%</span>
                        </div>
                        <div className="w-full bg-[#11182D] h-1.5 rounded-full overflow-hidden">
                          <div className={`${metric.color} h-1.5 rounded-full`} style={{ width: `${metric.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
   
                  {/* Summary textbox */}
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {(() => {
                      if (activeCand.id === 'cand-1') return "Strong full stack candidate. Deep React and TypeScript skills match the job requirements perfectly. Highly impressive live WebRTC video segment. Recommended for immediate virtual panel.";
                      if (activeCand.id === 'cand-2') return "Superb design portfolio. Visual layout and Figma design token mastery matches DesignFlow criteria exceptionally well. Recommended for panel screen.";
                      if (activeCand.id === 'cand-3') return "Outstanding LLM and AI infrastructure engineer. PyTorch and ML systems knowledge is top tier. Strong fit for core transformer scaling. Highly recommended.";
                      
                      const skillsStr = activeCand.skills && activeCand.skills.length > 0 
                        ? activeCand.skills.join(', ') 
                        : 'modern web technologies';
                      return `Strong candidate with skills in ${skillsStr}. Their video resume demonstrates highly competent industry expertise and clear communication. Profile analysis indicates solid compatibility with the job requirements. Highly recommended for screening.`;
                    })()}
                  </div>
                </div>
  
                {/* Pipeline Actions Card */}
                <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
                    Pipeline Actions
                  </span>
  
                  <div className="flex flex-col gap-2.5">
                    <button 
                      onClick={() => {
                        setScheduleNameId(activeCand.id);
                        setActiveCandId(null);
                        setActiveTab('scheduler');
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-purple-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      🗓️ Schedule Interview
                    </button>
  
                    <button 
                      onClick={() => {
                        onUpdateCandidateStatus(activeCand.id, 'Shortlisted');
                        setActiveCandId(null);
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-amber-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ⭐ Shortlist
                    </button>
  
                    <button 
                      onClick={() => {
                        onUpdateCandidateStatus(activeCand.id, 'Offered');
                        setActiveCandId(null);
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-emerald-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ✅ Offer Job
                    </button>
  
                    <button 
                      onClick={() => {
                        onUpdateCandidateStatus(activeCand.id, 'Rejected');
                        setActiveCandId(null);
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-red-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
  
                {/* Application Timeline Card */}
                <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
                    Application Timeline
                  </span>
  
                  <div className="flex flex-col gap-4 relative pl-5">
                    {/* Line track */}
                    <div className="absolute left-[7px] top-1.5 bottom-1.5 w-[1px] bg-slate-800"></div>
  
                    {[
                      { label: 'Applied', isCompleted: true, date: '3 days ago' },
                      { label: 'Screened', isCompleted: activeCand.status !== 'Applied', date: '2 days ago' },
                      { label: 'Shortlisted', isCompleted: ['Shortlisted', 'Interview Scheduled', 'Offered', 'Rejected'].includes(activeCand.status), date: activeCand.status === 'Applied' || activeCand.status === 'Screened' ? 'Pending' : 'Completed' },
                      { label: 'Interview', isCompleted: ['Interview Scheduled', 'Offered', 'Rejected'].includes(activeCand.status), date: activeCand.status === 'Interview Scheduled' || activeCand.status === 'Offered' || activeCand.status === 'Rejected' ? 'Completed' : 'Pending' },
                      { label: 'Decision', isCompleted: ['Offered', 'Rejected'].includes(activeCand.status), date: activeCand.status === 'Offered' || activeCand.status === 'Rejected' ? 'Completed' : 'Pending' }
                    ].map(step => (
                      <div key={step.label} className="flex justify-between items-center text-xs relative">
                        {/* Circle mark */}
                        <div className={`absolute left-[-22px] w-[9px] h-[9px] rounded-full border ${
                          step.isCompleted ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-800 border-slate-700'
                        }`}></div>
                        
                        <span className={`font-semibold ${step.isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>{step.label}</span>
                        <span className={`text-[10px] ${step.isCompleted && step.date !== 'Completed' ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>{step.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// X svg close button
function X({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
