import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Award, User, Briefcase, MapPin, CheckCircle, ChevronDown, ChevronUp, FileText, Star, Cpu, Save, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AIInterviewAssistant({ candidates = [], jobs = [], onUpdateCandidateStatus, showToast }) {
  const [selectedCandId, setSelectedCandId] = useState('');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  
  const [loading, setLoading] = useState(false);
  const [questionsList, setQuestionsList] = useState([]);
  const [scores, setScores] = useState(Array(8).fill(5));
  const [notes, setNotes] = useState(Array(8).fill(''));
  const [visibleAnswers, setVisibleAnswers] = useState(Array(8).fill(false));
  
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  // Load recruiter user session on mount
  useEffect(() => {
    const getRecruiterSession = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setDbUser(user);
      }
    };
    getRecruiterSession();
  }, []);

  // Pre-select candidate
  useEffect(() => {
    if (candidates && candidates.length > 0 && !selectedCandId) {
      setSelectedCandId(candidates[0].id);
    }
  }, [candidates, selectedCandId]);

  const activeCand = (candidates || []).find(c => c.id === selectedCandId);

  // Fallback questions generator
  const generateFallbackQuestions = (candidate, type, diff) => {
    const skills = candidate.skills || ['React', 'JavaScript'];
    const firstSkill = skills[0] || 'React';
    const secondSkill = skills[1] || 'JavaScript';

    const technicalQuestions = [
      {
        question: `How do you manage component lifecycles, memoization, and prevent re-rendering loops in ${firstSkill}?`,
        answer: `By employing hooks like useMemo and useCallback to cache values/reference matrices, structurizing effects with strict dependency lists, and ensuring ref-binding controls preventing state updates on frame queries.`
      },
      {
        question: `Explain a highly complex asynchronous data pipeline or real-time media track you orchestrated with ${secondSkill}.`,
        answer: `Structuring custom event emitters, handling socket-based frame telemetry caches, cleaning active streams on unmounting events, and managing exceptions in asynchronous promise blocks.`
      },
      {
        question: `What methods do you employ to build fully inclusive component layouts that support accessibility standards?`,
        answer: `Verifying semantic HTML tags structures, focus trapping modal anchor rings, ensuring direct keyboard triggers like Escape, and validating complete ARIA attribute tags.`
      },
      {
        question: `How do you orchestrate secure server communications and manage client-side tokens securely?`,
        answer: `Utilizing httpOnly cookie sessions, attaching JWT tokens on custom fetch headers, checking session expirations on mount, and scrubbing user sensitive keys from states.`
      },
      {
        question: `Explain how you design fluid visual grids and HSL-based dark mode configurations dynamically.`,
        answer: `Configuring dynamic styled CSS classes, bounding theme changes to document roots, using HSL color tokens for harmonized dark styles, and adding micro-animations.`
      },
      {
        question: `What performance inspection tools and audit methodologies do you utilize in browser environments?`,
        answer: `Inspecting chrome audit tools like Lighthouse, verifying paint delays on render profiling timelines, measuring main thread block timings, and implementing virtual lists.`
      },
      {
        question: `How do you organize modular directories, git branch topologies, and bundle configurations in projects?`,
        answer: `Organizing separate folders by components and features layers, adopting standard git flow branches (e.g. main/develop/feature), and configuring module bundling lazy loaders.`
      },
      {
        question: `What are your strategies for testing React elements and handling mock database connections?`,
        answer: `Writing standard unit tests checking state changes, mocking external database libraries (e.g. supabaseClient mock wrappers), and checking responsive viewport outputs.`
      }
    ];

    const hrQuestions = [
      { question: "What motivated you to transition into this specialized engineering role?", answer: "Look for strong technical alignment, continuous learning passions, and clear career path articulation." },
      { question: "How do you manage disputes or architectural differences inside developer teams?", answer: "Demonstrate humble communication style, analytical consensus, and product-first alignment." },
      { question: "Describe a situation where a project scope shifted rapidly. How did you react?", answer: "Look for quick architectural adjustments, clear sprint re-organizations, and proactive partner alignments." },
      { question: "What features of our video hiring platform HireVid AI resonate most with you?", answer: "Look for appreciation of AI indexing, real-time assessment portals, and pixel-perfect design systems." },
      { question: "Where do you see your system architecture capabilities growing over the next two years?", answer: "Focus on senior scale methodologies, cloud devops engineering, and team mentoring methodologies." },
      { question: "Describe your ideal collaborative environment. What conditions help you ship best?", answer: "Look for highly visual specs documents, asynchronous sprint channels, and direct paired-programming sessions." },
      { question: "What strategies do you use to manage burn-outs and balance operational coding stress?", answer: "Look for clear compartmentalization habits, healthy hobbies, and proactive sprint planning." },
      { question: "Why do you think VividAI Systems is the right place to build your career?", answer: "Demonstrate deep understanding of our multimodal search stack, responsive styled branding, and culture." }
    ];

    if (type === 'HR' || type === 'Behavioral') {
      return hrQuestions.slice(0, 8);
    }
    
    return technicalQuestions.slice(0, 8);
  };

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!activeCand) {
      showToast("Please select a candidate first.", "error");
      return;
    }

    setLoading(true);
    setQuestionsList([]);
    setScores(Array(8).fill(5));
    setNotes(Array(8).fill(''));
    setVisibleAnswers(Array(8).fill(false));
    setFeedbackSummary('');

    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
        try {
          const prompt = `Generate exactly 8 interview questions and concise expected answers for a candidate named ${activeCand.name}.
Candidate Skills: ${(activeCand.skills || []).join(', ')}
Candidate Role: ${activeCand.title}
Interview Type: ${interviewType}
Difficulty: ${difficulty}

Return ONLY a valid JSON array of exactly 8 objects, with no markdown backticks, prefix, or extra text:
[
  {
    "question": "Question text here?",
    "answer": "Expected brief correct answer here."
  }
]`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          );

          const resData = await response.json();
          const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (rawText) {
            let jsonText = rawText;
            if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7, -3).trim();
            else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3, -3).trim();

            const data = JSON.parse(jsonText);
            if (Array.isArray(data) && data.length >= 6) {
              setTimeout(() => {
                setQuestionsList(data.slice(0, 8));
                setLoading(false);
                showToast(`Successfully synthesized ${data.length} ${interviewType} questions!`, "success");
              }, 1200);
              return;
            }
          }
        } catch (e) {
          console.warn("Gemini questions request failed, running local algorithm:", e);
        }
      }

      // Fallback matching
      setTimeout(() => {
        const fallback = generateFallbackQuestions(activeCand, interviewType, difficulty);
        setQuestionsList(fallback);
        setLoading(false);
        showToast(`Synthesized 8 ${interviewType} questions!`, "success");
      }, 1200);

    } catch (err) {
      console.error("AI questions extraction error:", err);
      showToast("Error synthesizing interview scorecard.", "error");
      setLoading(false);
    }
  };

  const handleScoreChange = (idx, val) => {
    const updated = [...scores];
    updated[idx] = val;
    setScores(updated);
  };

  const handleNoteChange = (idx, val) => {
    const updated = [...notes];
    updated[idx] = val;
    setNotes(updated);
  };

  const toggleAnswerVisible = (idx) => {
    const updated = [...visibleAnswers];
    updated[idx] = !updated[idx];
    setVisibleAnswers(updated);
  };

  // Score aggregate rings calculation
  const overallScore = questionsList.length > 0
    ? (scores.reduce((sum, s) => sum + s, 0) / questionsList.length)
    : 0;

  const getSliderColorClass = (score) => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  
  const getSliderTextColorClass = (score) => {
    if (score <= 3) return 'text-red-400';
    if (score <= 6) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const radius = 30;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 10) * circumference;

  const scoreTheme = overallScore >= 7
    ? { stroke: '#10B981', glow: 'rgba(16,185,129,0.7)', text: 'text-emerald-400', label: 'Strong Hiring Recommendation' }
    : overallScore >= 4
    ? { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.7)', text: 'text-amber-400', label: 'Borderline Competence' }
    : { stroke: '#EF4444', glow: 'rgba(239,68,68,0.7)', text: 'text-red-400', label: 'Do Not Hire' };

  // Save Interview Report to database
  const handleSaveReport = async () => {
    if (!selectedCandId) {
      showToast("Please select a candidate first.", "error");
      return;
    }

    try {
      setSaving(true);
      const overallScoreValue = Math.round(overallScore * 10); // scale to 0-100
      const recruiterId = dbUser?.id || "mock-recruiter-id";
      
      const reportPayload = {
        recruiter_id: recruiterId,
        candidate_id: selectedCandId,
        questions: questionsList,
        scores: scores,
        overall_score: overallScoreValue,
        notes: feedbackSummary || "Completed standard virtual panel screening scorecard."
      };

      if (supabase) {
        const { error } = await supabase
          .from('interview_reports')
          .insert(reportPayload);

        if (error) {
          console.warn("Table interview_reports missing. Saving to localStorage fallback:", error.message);
          localStorage.setItem(`interview_report_${selectedCandId}_${Date.now()}`, JSON.stringify(reportPayload));
          showToast("Interview report saved to fallback storage!", "success");
        } else {
          showToast("Interview scorecard saved successfully!", "success");
        }
      } else {
        localStorage.setItem(`interview_report_${selectedCandId}_${Date.now()}`, JSON.stringify(reportPayload));
        showToast("Mock scorecard saved successfully!", "success");
      }
    } catch (err) {
      console.error("Error in handleSaveReport:", err);
      showToast("Failed to save interview scorecard.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Move candidate to next stage
  const handleMoveToNextStage = async () => {
    if (!selectedCandId) {
      showToast("Please select a candidate first.", "error");
      return;
    }

    if (!activeCand) return;

    let nextStage = 'Shortlisted';
    if (activeCand.status === 'Screened') nextStage = 'Shortlisted';
    else if (activeCand.status === 'Shortlisted') nextStage = 'Interview Scheduled';
    else if (activeCand.status === 'Interview Scheduled') nextStage = 'Offered';

    try {
      setAdvancing(true);
      if (supabase) {
        const { error } = await supabase
          .from('applications')
          .update({ status: nextStage })
          .eq('id', selectedCandId); // selectedCandId maps to application ID

        if (error) throw error;
        showToast(`${activeCand.name} advanced to ${nextStage}!`, "success");
        
        if (onUpdateCandidateStatus) {
          onUpdateCandidateStatus(selectedCandId, nextStage);
        }
      } else {
        if (onUpdateCandidateStatus) {
          onUpdateCandidateStatus(selectedCandId, nextStage);
        }
        showToast(`${activeCand.name} advanced to ${nextStage} (Mock)!`, "success");
      }
    } catch (err) {
      console.error("Error advancing candidate:", err);
      showToast("Failed to advance candidate stage.", "error");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          AI Interview Assistant
        </h2>
        <p className="text-slate-400 text-xs">Generate highly specialized scorecard questionnaires and record live assessments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: CANDIDATE INFO SELECTOR */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Selected Candidate</h3>
            
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Choose Applicant</label>
              <select
                value={selectedCandId}
                onChange={(e) => setSelectedCandId(e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
              >
                <option value="" disabled>-- Choose Candidate --</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.title})</option>)}
              </select>
            </div>

            {activeCand ? (
              <div className="flex flex-col gap-4 pt-3 border-t border-white/5 animate-fade-in">
                <div className="flex gap-3 items-center">
                  {activeCand.avatar ? (
                    <img 
                      src={activeCand.avatar} 
                      alt={activeCand.name} 
                      className="w-14 h-14 rounded-2xl object-cover border border-purple-500/20"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-lg font-bold text-purple-300">
                      {activeCand.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{activeCand.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{activeCand.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-bold mt-1">
                      <Star className="w-3 h-3 text-purple-400" /> {activeCand.aiMatchScore}% Match Index
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Target Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {activeCand.skills.map(sk => (
                      <span key={sk} className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold uppercase">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Biography</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-4 bg-black/25 p-3 rounded-lg border border-white/5 italic">
                    "{activeCand.bio}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs">
                No active candidate loaded.
              </div>
            )}
          </div>
          
          {/* SQL tables schema information info banner for Pairs */}
          <div className="p-4 bg-[#0B1020]/30 border border-white/5 rounded-2xl flex items-start gap-3.5 text-[10px] text-slate-400 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300">Supabase Reports Schema</span>
              <p className="mt-1">
                To activate remote panel saving logs, execute the SQL migration snippet in your Supabase project query drawer:
              </p>
              <pre className="bg-black/40 border border-white/5 rounded-lg p-2.5 mt-2 font-mono text-[9px] text-purple-300 leading-normal select-all">
{`CREATE TABLE interview_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  recruiter_id UUID,
  candidate_id UUID,
  questions JSONB,
  scores JSONB,
  overall_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`}
              </pre>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: QUESTION GENERATOR & SCORECARD */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Question config card */}
          <form onSubmit={handleGenerateQuestions} className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 font-semibold">Interview Category</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
              >
                <option value="Technical">Technical Interview</option>
                <option value="Behavioral">Behavioral Panel</option>
                <option value="HR">HR Cultural Screen</option>
                <option value="Mixed">Mixed Screening</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5 font-semibold">Assessment Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
              >
                <option value="Easy">Junior / Easy</option>
                <option value="Medium">Mid-level / Medium</option>
                <option value="Hard">Architect / Hard</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !activeCand}
              className="py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Crafting...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </form>

          {/* Loader screen */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 border border-white/5 bg-[#0B1020]/40 rounded-2xl min-h-[300px]">
              <div className="relative w-20 h-20 mb-5 border border-purple-500/20 bg-purple-500/5 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/5">
                <Cpu className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <div className="text-center w-full max-w-[280px]">
                <span className="text-xs font-bold text-slate-200">AI is crafting questions...</span>
                <p className="text-[10px] text-slate-500 mt-1">Generating 8 custom screening questions mapped to candidate skills portfolio...</p>
              </div>
            </div>
          )}

          {/* Questions list viewport */}
          {!loading && questionsList.length > 0 && (
            <div className="flex flex-col gap-5 animate-slide-in">
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Screening Questionnaire Scorecard ({difficulty})
              </h3>
              
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                {questionsList.map((q, idx) => {
                  const isAnswerVisible = visibleAnswers[idx];
                  const currentScore = scores[idx] || 5;

                  return (
                    <div key={idx} className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4">
                      
                      {/* Badge question row */}
                      <div className="flex gap-3 items-start">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md shadow-purple-500/10">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-white font-semibold leading-relaxed pt-0.5">
                          {q.question}
                        </p>
                      </div>

                      {/* Accordion expected answer */}
                      {isAnswerVisible && (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] text-slate-300 leading-relaxed animate-slide-in">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">✦ Model Expected Answer:</span>
                          "{q.answer}"
                        </div>
                      )}

                      {/* Slider scorecard indicator */}
                      <div className="grid sm:grid-cols-2 gap-4 items-end pt-2 border-t border-white/5 mt-1">
                        
                        {/* Observation notes */}
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 font-semibold">Observations</label>
                          <input 
                            type="text" 
                            placeholder="Add your observations..."
                            value={notes[idx] || ''}
                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                            className="w-full bg-[#050816] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-purple-500 outline-none"
                          />
                        </div>

                        {/* Visual Dot Score Indicator */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-bold">Interviewer Score:</span>
                            <span className={`font-black text-xs ${getSliderTextColorClass(currentScore)}`}>
                              {currentScore}/10
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={currentScore}
                              onChange={(e) => handleScoreChange(idx, parseInt(e.target.value))}
                              className="flex-1 accent-purple-600 h-1.5 bg-[#050816] rounded-full"
                            />
                            {/* Visual Dot */}
                            <span className={`w-3.5 h-3.5 rounded-full ${getSliderColorClass(currentScore)} shadow-sm shadow-black/80 shrink-0`}></span>
                          </div>
                        </div>

                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleAnswerVisible(idx)}
                        className="text-[10px] text-slate-500 hover:text-purple-400 font-bold transition-all w-fit mt-1 flex items-center gap-1"
                      >
                        {isAnswerVisible ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                            <span>Hide expected answer</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                            <span>Show expected answer</span>
                          </>
                        )}
                      </button>

                    </div>
                  );
                })}
              </div>

              {/* FOOTER: AGGREGATE DECISION SCORECARD */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-5 mt-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-blue-500"></div>
                
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Aggregate Evaluation Score</h4>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  
                  {/* Score Indicator Ring details */}
                  <div className="flex gap-4 items-center">
                    {/* Ring indicator */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle 
                          cx="32" 
                          cy="32" 
                          r={radius} 
                          stroke="rgba(255,255,255,0.05)" 
                          strokeWidth={strokeWidth} 
                          fill="transparent" 
                        />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r={radius} 
                          stroke={scoreTheme.stroke} 
                          strokeWidth={strokeWidth} 
                          fill="transparent" 
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            filter: `drop-shadow(0 0 4px ${scoreTheme.glow})`,
                            transition: 'stroke-dashoffset 0.5s ease-out'
                          }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-[11px] font-black text-white">{overallScore.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated Average Rating</span>
                      <p className={`text-sm font-extrabold mt-0.5 ${getSliderTextColorClass(Math.round(overallScore))}`}>
                        {scoreTheme.label}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Summary Input */}
                  <div className="flex-1 w-full">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1 font-semibold">Feedback Summary Notes</label>
                    <textarea 
                      value={feedbackSummary}
                      onChange={(e) => setFeedbackSummary(e.target.value)}
                      placeholder="Add summary hiring evaluation notes, culture considerations, and next steps..."
                      rows={2}
                      className="w-full bg-[#050816] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed"
                    />
                  </div>

                </div>

                {/* Finalizing Actions */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-1">
                  <button 
                    onClick={handleSaveReport}
                    disabled={saving}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving report...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Interview Report</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleMoveToNextStage}
                    disabled={advancing}
                    className="py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
                  >
                    {advancing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Advancing...</span>
                      </>
                    ) : (
                      <>
                        <span>Move to Next Stage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Prompt state */}
          {!loading && questionsList.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border border-white/5 bg-[#0B1020]/20 rounded-2xl min-h-[300px] text-center select-none">
              <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Awaiting Scorecard Generation</span>
              <p className="text-[10px] text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">Choose an active applicant, customize difficulties and categories, then boot the AI Questionnaire Engine to generate scorecards.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
