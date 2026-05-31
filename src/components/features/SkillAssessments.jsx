import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Award, User, Briefcase, MapPin, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, ArrowRight, Download, Timer, ArrowRightLeft, FileCheck2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Complete 30-Question Database Mappings
const PYTHON_QUESTIONS = [
  { id: 1, question: "What is the output of print(2**3)?", options: ["6", "8", "9", "5"], answer: 1 },
  { id: 2, question: "Which keyword is used to define a function in Python?", options: ["func", "define", "def", "fun"], answer: 2 },
  { id: 3, question: "What does len([1, 2, 3]) return?", options: ["2", "4", "3", "1"], answer: 2 },
  { id: 4, question: "Which data structure in Python stores key-value pairs?", options: ["list", "tuple", "set", "dictionary"], answer: 3 },
  { id: 5, question: "How do you add an item to the end of a list in Python?", options: ["list.add()", "list.append()", "list.push()", "list.insert()"], answer: 1 },
  { id: 6, question: "What is the correct syntax for a comment in Python?", options: ["// comment", "-- comment", "# comment", "** comment"], answer: 2 },
  { id: 7, question: "Which loop is generally used to run a fixed number of times?", options: ["while", "for", "do-while", "repeat"], answer: 1 },
  { id: 8, question: "What does type(\"hello\") return?", options: ["string", "str", "text", "char"], answer: 1 },
  { id: 9, question: "Which of the following data types is immutable in Python?", options: ["list", "dictionary", "tuple", "set"], answer: 2 },
  { id: 10, question: "How do you open a file for reading in Python?", options: ["open()", "file()", "read()", "load()"], answer: 0 }
];

const SQL_QUESTIONS = [
  { id: 1, question: "Which statement is used to retrieve all columns from a table?", options: ["GET *", "SELECT *", "FETCH *", "SHOW *"], answer: 1 },
  { id: 2, question: "Which SQL clause is used to filter rows in a query?", options: ["HAVING", "GROUP BY", "WHERE", "LIMIT"], answer: 2 },
  { id: 3, question: "Which SQL clause is used to sort results?", options: ["SORT BY", "ARRANGE BY", "ORDER BY", "GROUP BY"], answer: 2 },
  { id: 4, question: "Which SQL function is used to count the total rows in a table?", options: ["SUM()", "TOTAL()", "COUNT()", "NUM()"], answer: 2 },
  { id: 5, question: "Which SQL keyword combines rows from two or more tables?", options: ["MERGE", "JOIN", "COMBINE", "ATTACH"], answer: 1 },
  { id: 6, question: "Which SQL statement is used to add a new row?", options: ["ADD", "INSERT INTO", "PUT", "CREATE"], answer: 1 },
  { id: 7, question: "Which SQL statement removes rows from a table?", options: ["REMOVE", "DROP", "DELETE", "CLEAR"], answer: 2 },
  { id: 8, question: "Which SQL function returns the highest value in a column?", options: ["HIGHEST()", "MAX()", "TOP()", "BEST()"], answer: 1 },
  { id: 9, question: "Which SQL clause is used to group rows with identical values?", options: ["ORDER BY", "SORT BY", "GROUP BY", "CLUSTER BY"], answer: 2 },
  { id: 10, question: "Which SQL statement updates existing database columns?", options: ["MODIFY", "CHANGE", "SET", "UPDATE"], answer: 3 }
];

const AI_ML_QUESTIONS = [
  { id: 1, question: "What does LLM stand for?", options: ["Large Language Model", "Linear Learning Method", "Logical Language Machine", "Long Learning Module"], answer: 0 },
  { id: 2, question: "What does RAG stand for in AI systems?", options: ["Random Approximation Generator", "Retrieval Augmented Generation", "Recursive AI Generator", "Real AI Gateway"], answer: 1 },
  { id: 3, question: "Which company created the ChatGPT AI model?", options: ["Google", "Meta", "OpenAI", "Microsoft"], answer: 2 },
  { id: 4, question: "What does AI stand for?", options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Automated Integration"], answer: 1 },
  { id: 5, question: "What is LangChain primarily used for?", options: ["Building blockchain apps", "Language translation", "Building LLM applications", "Chain learning"], answer: 2 },
  { id: 6, question: "What is an artificial neural network?", options: ["A computer networking system", "An AI model inspired by the human brain", "A social media networking system", "A secure database structure"], answer: 1 },
  { id: 7, question: "What is the Groq API primarily known for?", options: ["High fidelity image generation", "Extremely fast LLM inference", "Video editing pipelines", "Asynchronous database queries"], answer: 1 },
  { id: 8, question: "What is prompt engineering?", options: ["Building AI hardware chips", "Designing effective instructions for AI models", "Engineering software loops", "AI weights model training"], answer: 1 },
  { id: 9, question: "What is FAISS used for in vector searches?", options: ["Image recognition", "Fast similarity search of dense vectors", "Audio processing relays", "Network firewalls security"], answer: 1 },
  { id: 10, question: "What is the core definition of machine learning?", options: ["Machines learning physically to walk", "Writing software with nested loops", "AI algorithms learning patterns from datasets", "Computer processor chips hardware training"], answer: 2 }
];

const AVAILABLE_TESTS = [
  { id: 'python', name: 'Python Basics', difficulty: 'Beginner', duration: 900, questions: PYTHON_QUESTIONS, color: 'from-blue-600 to-cyan-500', logo: '🐍' },
  { id: 'sql', name: 'SQL Fundamentals', difficulty: 'Beginner', duration: 900, questions: SQL_QUESTIONS, color: 'from-amber-600 to-yellow-500', logo: '📊' },
  { id: 'ai_ml', name: 'AI & ML Concepts', difficulty: 'Intermediate', duration: 900, questions: AI_ML_QUESTIONS, color: 'from-purple-600 to-pink-500', logo: '🧠' }
];

export default function SkillAssessments({ currentUser, fallbackCandidate, showToast }) {
  const [screen, setScreen] = useState('selection'); // 'selection', 'taking', 'results'
  const [activeTest, setActiveTest] = useState(null);
  
  // Test Taking States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(Array(10).fill(null));
  const [timeLeft, setTimeLeft] = useState(900);
  const [completedTests, setCompletedTests] = useState({});
  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);

  // Load completed assessments from Supabase on mount
  const fetchAssessments = async () => {
    const userId = currentUser?.id || fallbackCandidate?.id;
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId);
      
      if (!error && data) {
        const completedMap = {};
        data.forEach(item => {
          if (item.test_name.includes('Python')) completedMap['python'] = item.score;
          else if (item.test_name.includes('SQL')) completedMap['sql'] = item.score;
          else if (item.test_name.includes('AI')) completedMap['ai_ml'] = item.score;
        });
        setCompletedTests(completedMap);
      }
    } catch (err) {
      console.error("Error loading completed tests:", err);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [currentUser]);

  // Timer countdown hook
  useEffect(() => {
    if (screen === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen, timeLeft]);

  const handleStartTest = (test) => {
    setActiveTest(test);
    setCurrentIdx(0);
    setSelectedAnswers(Array(10).fill(null));
    setTimeLeft(test.duration);
    setScreen('taking');
    showToast(`Test ${test.name} started! You have 15 minutes.`, "success");
  };

  const handleSelectOption = (optIdx) => {
    // Cannot deselect once selected
    if (selectedAnswers[currentIdx] !== null) return;
    const updated = [...selectedAnswers];
    updated[currentIdx] = optIdx;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentIdx < 9) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handleSubmitTest = () => {
    clearInterval(timerRef.current);
    setScreen('results');
    showToast("Skill assessment completed!", "success");
  };

  // Results math
  const correctCount = activeTest ? activeTest.questions.reduce((sum, q, idx) => {
    return sum + (selectedAnswers[idx] === q.answer ? 1 : 0);
  }, 0) : 0;

  const scorePercentage = correctCount * 10;
  const passed = scorePercentage >= 70;

  // Add completed test locally
  const saveLocalCompletedTest = (testId, score) => {
    const updated = { ...completedTests, [testId]: score };
    setCompletedTests(updated);
    // sync back to selection screen
    setScreen('selection');
  };

  // Save to Supabase assessments
  const handleSaveToProfile = async () => {
    const userId = currentUser?.id || fallbackCandidate?.id;
    if (!userId) return;

    const payload = {
      user_id: userId,
      test_name: activeTest.name,
      score: scorePercentage,
      passed,
      completed_at: new Date().toISOString()
    };

    try {
      setSaving(true);
      if (supabase) {
        const { error } = await supabase
          .from('assessments')
          .insert(payload);

        if (error) {
          console.warn("Table assessments missing, saving score to localStorage:", error.message);
          localStorage.setItem(`assessment_${activeTest.id}_${userId}`, scorePercentage);
          saveLocalCompletedTest(activeTest.id, scorePercentage);
          showToast("Assessment badges updated locally!", "success");
        } else {
          showToast("Assessment results successfully synced to database!", "success");
          fetchAssessments();
          setScreen('selection');
        }
      } else {
        saveLocalCompletedTest(activeTest.id, scorePercentage);
        showToast("Mock save successful!", "success");
      }
    } catch (err) {
      console.error("Error saving assessment score:", err);
      showToast("Error updating assessment profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Download PDF certificate report as static HTML card
  const handleDownloadCertificate = () => {
    const candidateName = currentUser?.name || fallbackCandidate?.name || "Candidate Name";
    const certHtml = `
      <html>
      <head>
        <style>
          body { background: #050816; color: #F1F5F9; font-family: 'DM Sans', sans-serif; display: flex; items-center: center; justify-content: center; height: 100vh; margin: 0; }
          .cert { background: #0B1020; border: 2px solid #9333EA; padding: 50px; border-radius: 24px; text-align: center; max-width: 600px; box-shadow: 0 10px 40px rgba(147, 51, 234, 0.2); }
          h1 { color: #A78BFA; font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0; }
          h2 { color: #FFFFFF; font-size: 20px; margin: 20px 0; }
          p { color: #94A3B8; font-size: 14px; line-height: 1.6; }
          .score { font-size: 40px; font-weight: 900; color: #10B981; margin: 20px 0; text-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
          .date { color: #64748B; font-size: 11px; margin-top: 40px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="cert">
          <h1>Certificate of Achievement</h1>
          <p>This is proudly presented to</p>
          <h2>${candidateName}</h2>
          <p>for successfully completing and passing the skill assessment for</p>
          <h2>${activeTest.name}</h2>
          <div class="score">${scorePercentage}% SCORE</div>
          <p>Verified by HireVid AI Assessment Engine</p>
          <div class="date">DATE OF COMPLETION: ${new Date().toLocaleDateString()}</div>
        </div>
      </body>
      </html>
    `;

    const element = document.createElement("a");
    const file = new Blob([certHtml], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${candidateName.replace(' ', '_')}_${activeTest.id}_certificate.html`;
    document.body.appendChild(element);
    element.click();
    showToast("Certificate generated and downloaded!", "success");
  };

  const getTimerColorClass = (seconds) => {
    if (seconds < 120) return 'text-red-500 font-extrabold animate-pulse'; // < 2min
    if (seconds < 300) return 'text-amber-500 font-bold'; // < 5min
    return 'text-emerald-400 font-bold';
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // SVGs score ring percentage gauge
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-purple-400" />
          Skill Assessments
        </h2>
        <p className="text-slate-400 text-xs">Test your technical credentials and earn badges to stand out to recruiters</p>
      </div>

      {/* SCREEN 1: SELECTION GRID */}
      {screen === 'selection' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AVAILABLE_TESTS.map(test => {
            const hasCompleted = completedTests[test.id] !== undefined;
            const completedScore = completedTests[test.id];

            return (
              <div 
                key={test.id} 
                className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                {/* Tech logo badge */}
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 bg-gradient-to-tr ${test.color} rounded-xl flex items-center justify-center text-2xl shadow-md border border-white/10`}>
                    {test.logo}
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#050816] border border-white/5 text-purple-300 tracking-wider">
                    {test.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">{test.name}</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1">10 Questions · 15 Minutes</p>
                </div>

                <div className="flex-1" />

                {hasCompleted ? (
                  <div className="flex flex-col gap-2.5">
                    <span className={`w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 uppercase`}>
                      <CheckCircle2 className="w-4 h-4" /> Passed · {completedScore}%
                    </span>
                    <button 
                      onClick={() => handleStartTest(test)}
                      className="w-full py-2 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-purple-500/20 text-[10px] text-slate-300 hover:text-white font-bold rounded-lg transition-all"
                    >
                      Re-take Assessment
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleStartTest(test)}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1"
                  >
                    <span>Start Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SCREEN 2: TEST TAKING CANVAS */}
      {screen === 'taking' && activeTest && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-5">
          {/* Header timer and progress */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400">{activeTest.name}</span>
              <h3 className="font-bold text-sm text-slate-300 mt-0.5">Question {currentIdx + 1} of 10</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className={`text-sm ${getTimerColorClass(timeLeft)} font-semibold`}>
                Time Remaining: {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-[#050816] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentIdx + 1) * 10}%` }}
            ></div>
          </div>

          {/* Question Viewport */}
          {(() => {
            const activeQ = activeTest.questions[currentIdx];
            const activeSelected = selectedAnswers[currentIdx];

            return (
              <div className="flex flex-col gap-6 pt-3">
                <div className="p-5 border border-white/5 bg-black/20 rounded-2xl">
                  <span className="text-[9px] font-extrabold uppercase text-purple-400 block mb-2">Question Text</span>
                  <p className="text-base font-bold text-white leading-relaxed">
                    {activeQ.question}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeQ.options.map((opt, idx) => {
                    const isSelected = activeSelected === idx;
                    const alphabet = ['A', 'B', 'C', 'D'][idx];

                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                          isSelected 
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10'
                            : activeSelected !== null
                            ? 'border-white/5 bg-[#050816]/30 text-slate-500 opacity-60 cursor-not-allowed'
                            : 'border-white/10 bg-[#050816]/60 text-slate-300 hover:border-purple-500/30'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-black/40 border border-white/10 text-slate-400'
                        }`}>
                          {alphabet}
                        </span>
                        <span className="text-xs font-semibold">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-1">
                  <span className="text-[10px] text-slate-500">Answers are saved automatically upon selection.</span>
                  
                  <button 
                    onClick={handleNext}
                    disabled={activeSelected === null}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span>{currentIdx < 9 ? 'Next Question' : 'Submit Assessment'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SCREEN 3: RESULTS PANEL */}
      {screen === 'results' && activeTest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-in">
          
          {/* Left panel gauge breakdown (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Score Ring indicator card */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col items-center text-center gap-4 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Overall Grade</span>
              
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle 
                    cx="48" 
                    cy="48" 
                    r={radius} 
                    stroke="rgba(255,255,255,0.04)" 
                    strokeWidth={strokeWidth} 
                    fill="transparent" 
                  />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r={radius} 
                    stroke={passed ? '#10B981' : '#EF4444'} 
                    strokeWidth={strokeWidth} 
                    fill="transparent" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 5px ${passed ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'})`,
                      transition: 'stroke-dashoffset 0.8s ease-out'
                    }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-2xl font-black ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{scorePercentage}%</span>
                </div>
              </div>

              <div className="min-w-0">
                <p className={`text-sm font-extrabold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passed ? 'PASSED · SUCCESS' : 'FAILED · NOT PASSED'}
                </p>
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  {correctCount} out of 10 questions correct
                </span>
              </div>
            </div>

            {/* Questions list breakdown review */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 pb-2 border-b border-white/5">Question Review</h3>
              
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {activeTest.questions.map((q, idx) => {
                  const selectedIdx = selectedAnswers[idx];
                  const isCorrect = selectedIdx === q.answer;

                  return (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-black/20 border border-white/5 rounded-lg">
                      <span className="text-slate-400 truncate max-w-[200px]">Question {idx + 1}: {q.question}</span>
                      {isCorrect ? (
                        <span className="text-emerald-400 font-extrabold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Correct</span>
                      ) : (
                        <span className="text-red-400 font-extrabold flex items-center gap-1 shrink-0"><X className="w-3.5 h-3.5 text-red-400" /> Wrong</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right panel certificate achievements (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Passed Achievements Certificate card */}
            {passed ? (
              <div className="glass-card p-6 border-l-4 border-l-purple-500 border-y-white/5 border-r-white/5 rounded-2xl bg-[#0B1020]/50 relative overflow-hidden flex flex-col items-center text-center gap-4">
                <div className="absolute top-4 right-4 text-3xl opacity-20">📜</div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-purple-400 flex items-center gap-1.5"><Award className="w-5 h-5 text-purple-400" /> Certificate of Achievement</h3>
                
                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Presented proudly to</p>
                  <h4 className="text-lg font-black text-white mt-1">{currentUser?.name || fallbackCandidate?.name || "Candidate Name"}</h4>
                </div>

                <div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    for passing the specialized assessment evaluation criteria for
                  </p>
                  <h4 className="text-sm font-extrabold text-white mt-1">{activeTest.name}</h4>
                  <span className="inline-flex items-center text-emerald-400 text-xs font-bold mt-2">
                    Score: {scorePercentage}%
                  </span>
                </div>

                {/* Verification line */}
                <p className="text-[9px] text-slate-500 italic mt-2">Verified by HireVid AI Assessment Engine</p>

                {/* Finalizing Actions */}
                <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-4 mt-1">
                  <button 
                    onClick={handleSaveToProfile}
                    disabled={saving}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Add to Profile</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleDownloadCertificate}
                    className="py-2.5 bg-black/40 hover:bg-[#0B1020] border border-white/10 hover:border-purple-500/20 text-slate-300 hover:text-white font-bold rounded-xl text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Cert</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-red-500/20 bg-red-500/5 text-slate-400 rounded-2xl flex flex-col items-center text-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <h4 className="font-extrabold text-sm text-white">Assessment Score Below 70%</h4>
                <p className="text-xs leading-relaxed max-w-[280px] text-slate-400">
                  Assessments require a minimum score of 70% or higher to earn a profile badge. Review your question errors on the left panel and try again!
                </p>
                <button 
                  onClick={() => handleStartTest(activeTest)}
                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs mt-2"
                >
                  Try Re-taking Test
                </button>
              </div>
            )}

            {/* Back home */}
            <button
              onClick={() => setScreen('selection')}
              className="text-[10px] text-slate-500 hover:text-purple-400 font-bold transition-all w-fit mx-auto mt-2 flex items-center gap-1.5"
            >
              &larr; Back to Assessments Directory
            </button>

          </div>

        </div>
      )}

    </div>
  );
}
