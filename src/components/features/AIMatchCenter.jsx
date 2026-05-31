import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Award, Briefcase, MapPin, CheckCircle, ChevronDown, ChevronUp, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AIMatchCenter({ jobs = [], onOpenCandidateDetail, showToast, fallbackCandidates = [] }) {
  const [candidatesPool, setCandidatesPool] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [shortlistingId, setShortlistingId] = useState(null);

  // Fetch all candidate profiles from Supabase on mount
  useEffect(() => {
    const fetchCandidates = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('candidate_profiles')
          .select('*, users(name, email)');
        
        if (!error && data) {
          const mapped = data.map(profile => ({
            id: profile.user_id,
            name: profile.users?.name || 'Anonymous Candidate',
            email: profile.users?.email || '',
            skills: profile.skills || [],
            experience: profile.experience || '',
            bio: profile.bio || '',
            location: profile.location || 'Remote',
            videoResumeUrl: profile.video_url || '',
            pdfResumeUrl: profile.pdf_url || ''
          }));
          setCandidatesPool(mapped);
        }
      } catch (err) {
        console.error("Error loading candidates for AI Match:", err);
      }
    };

    fetchCandidates();
  }, []);

  // Sync selected job description automatically
  useEffect(() => {
    if (selectedJobId && jobs.length > 0) {
      const targetJob = jobs.find(j => j.id === selectedJobId);
      if (targetJob) {
        setJobDescription(targetJob.description || '');
      }
    }
  }, [selectedJobId, jobs]);

  // Offline parsing matching logic
  const calculateFallbackMatching = (candidate, jobDesc) => {
    const jdLower = jobDesc.toLowerCase();
    let matchedSkills = [];
    
    candidate.skills.forEach(skill => {
      if (jdLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      }
    });

    const baseScore = 65;
    const skillMatchBonus = matchedSkills.length * 8;
    const finalScore = Math.min(98, baseScore + skillMatchBonus);

    const reasons = [
      matchedSkills.length > 0 
        ? `Direct skill match for required tools: ${matchedSkills.slice(0, 3).join(', ')}.`
        : `Strong technical proficiency aligned with development parameters.`,
      candidate.experience 
        ? `Valuable industry credentials: "${candidate.experience}" adds structural capability to team.`
        : `Competent developer showcasing high problem-solving adaptability.`,
      `Demonstrated capability to absorb team-specific tech stack and start shipping quickly.`
    ];

    return {
      ...candidate,
      aiMatchScore: finalScore,
      aiReasons: reasons
    };
  };

  // Perform AI scan using Groq or Fallback
  const handleFindMatches = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      showToast("Please enter or select a job description to analyze.", "error");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setResults([]);

    // Progress bar animation
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        return prev + 4;
      });
    }, 120);

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      const targetPool = candidatesPool.length > 0 ? candidatesPool : fallbackCandidates;
      
      if (targetPool.length === 0) {
        clearInterval(interval);
        showToast("No candidates found in Supabase or fallback tables.", "error");
        setLoading(false);
        return;
      }

      const scoringPromises = targetPool.map(async (candidate) => {
        if (groqApiKey && groqApiKey !== 'YOUR_GROQ_API_KEY') {
          try {
            const response = await fetch(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${groqApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'llama3-8b-8192',
                  messages: [{
                    role: 'user',
                    content: `Score this candidate 0-100.
                    Job Description: ${jobDescription}
                    Candidate Skills: ${candidate.skills.join(', ')}
                    Candidate Experience: ${candidate.experience}
                    
                    Return ONLY valid JSON:
                    {
                      "score": 87,
                      "reasons": [
                        "Strong Python skills match",
                        "RAG experience is relevant", 
                        "Good project background"
                      ]
                    }`
                  }],
                  temperature: 0.15,
                  max_tokens: 200
                })
              }
            );

            const result = await response.json();
            if (result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
              let jsonText = result.choices[0].message.content.trim();
              if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7, -3).trim();
              } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3, -3).trim();
              }
              const data = JSON.parse(jsonText);
              return {
                ...candidate,
                aiMatchScore: parseInt(data.score) || 75,
                aiReasons: data.reasons || [
                  "Strong matching characteristics across technology stack.",
                  "Broad experience profiles matching position criteria.",
                  "Clear communication metrics extracted."
                ]
              };
            }
          } catch (e) {
            console.warn("Groq request failed, using matrix search fallback:", e);
          }
        }

        // Fallback matching
        return calculateFallbackMatching(candidate, jobDescription);
      });

      const scoredResults = await Promise.all(scoringPromises);
      const sorted = scoredResults.sort((a, b) => b.aiMatchScore - a.aiMatchScore).slice(0, 5);
      
      // Delay completion slightly for animation feel
      setTimeout(() => {
        clearInterval(interval);
        setLoadingProgress(100);
        setTimeout(() => {
          setResults(sorted);
          setLoading(false);
          showToast("Successfully parsed candidate matching indexes!", "success");
        }, 300);
      }, 500);

    } catch (err) {
      clearInterval(interval);
      console.error("AI scanning error:", err);
      showToast("Error processing matching scores.", "error");
      setLoading(false);
    }
  };

  // Shortlist candidates in database
  const handleShortlistClick = async (candidate, score) => {
    if (!supabase) {
      showToast("Candidate shortlisted locally (Mock Mode)!", "success");
      return;
    }

    if (!selectedJobId) {
      showToast("Please select a target job opening to shortlist this candidate.", "error");
      return;
    }

    try {
      setShortlistingId(candidate.id);
      
      const { data: existingApp } = await supabase
        .from('applications')
        .select('*')
        .eq('candidate_id', candidate.id)
        .eq('job_id', selectedJobId)
        .maybeSingle();

      if (existingApp) {
        const { error } = await supabase
          .from('applications')
          .update({ status: 'Shortlisted', ai_score: score })
          .eq('id', existingApp.id);
        if (error) throw error;
        showToast(`${candidate.name} is now Shortlisted in the pipeline!`, "success");
      } else {
        const { error } = await supabase
          .from('applications')
          .insert({
            job_id: selectedJobId,
            candidate_id: candidate.id,
            status: 'Shortlisted',
            ai_score: score
          });
        if (error) throw error;
        showToast(`${candidate.name} shortlisted and added to pipeline!`, "success");
      }
    } catch (err) {
      console.error("Error shortlisting candidate:", err);
      showToast("Failed to shortlist candidate.", "error");
    } finally {
      setShortlistingId(null);
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'bg-amber-400/20 text-amber-300 border-amber-500/40'; 
    if (rank === 2) return 'bg-slate-300/20 text-slate-200 border-slate-400/40'; 
    if (rank === 3) return 'bg-amber-700/20 text-amber-600 border-amber-800/40'; 
    return 'bg-slate-800/20 text-slate-400 border-white/5'; 
  };

  const getRankLabel = (rank) => {
    if (rank === 1) return '🥇 Rank 1';
    if (rank === 2) return '🥈 Rank 2';
    if (rank === 3) return '🥉 Rank 3';
    return `Rank ${rank}`;
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Match Center
        </h2>
        <p className="text-slate-400 text-xs">Find the perfect candidate using AI</p>
      </div>

      {/* Input panel split */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Left Form controls */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 md:col-span-1 flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Matching Config</h3>
          
          <div>
            <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Target Opening</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
            >
              <option value="">-- Past Custom Text --</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Job Description Requirements</label>
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setSelectedJobId('');
                setJobDescription(e.target.value);
              }}
              rows={5}
              placeholder="Paste details of the role opening, technical stack, or project demands..."
              className="w-full bg-[#050816] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed"
              required
            />
          </div>

          <button 
            onClick={handleFindMatches}
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Scan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Find Best Matches</span>
              </>
            )}
          </button>
        </div>

        {/* Right Dashboard Area */}
        <div className="md:col-span-2 flex flex-col gap-4 min-h-[300px]">
          
          {/* Loading Animation overlay */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border border-white/5 bg-[#0B1020]/40 rounded-2xl min-h-[350px]">
              
              {/* Scanning visual effect */}
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center border border-purple-500/20 bg-purple-500/5 rounded-3xl overflow-hidden shadow-lg shadow-purple-500/5">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                {/* Horizontal scanner beam */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan"></div>
                {/* Pulsing dots */}
                <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
              </div>
              
              <div className="text-center w-full max-w-[280px]">
                <span className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
                  AI is analyzing candidates
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"></span>
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce delay-100"></span>
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce delay-200"></span>
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Llama 3 LLM scoring candidate skills and credentials...</p>
                
                {/* Custom Progress Bar */}
                <div className="w-full bg-[#050816] h-1.5 rounded-full mt-4 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-bold text-purple-400 mt-1.5 block">{loadingProgress}% Computed</span>
              </div>
            </div>
          )}

          {/* Results dashboard list */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Top 5 Synthesized Matches
              </h3>
              
              {results.map((cand, index) => {
                const rank = index + 1;
                const isExpanded = expandedMatchId === cand.id;
                
                // SVG Circle setup
                const radius = 28;
                const strokeWidth = 5;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (cand.aiMatchScore / 100) * circumference;

                return (
                  <div 
                    key={cand.id}
                    className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0B1020]/60 flex flex-col gap-4 transition-all duration-300 hover:border-white/10"
                  >
                    
                    {/* Upper row header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      
                      <div className="flex gap-4 items-center min-w-0">
                        {/* Rank Badge */}
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1 shrink-0 ${getRankBadgeClass(rank)}`}>
                          {getRankLabel(rank)}
                        </span>
                        
                        {/* Initials avatar circle */}
                        <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                          {cand.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        
                        <div className="min-w-0">
                          <h4 className="font-bold text-base text-white truncate">{cand.name}</h4>
                          <p className="text-xs text-slate-400 truncate">{cand.title} • {cand.location}</p>
                          
                          {/* Top 3 matching skills */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cand.skills.slice(0, 3).map(sk => (
                              <span key={sk} className="text-[8px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold uppercase tracking-wider">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Glowing Circle ring score */}
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0 self-end sm:self-center">
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
                            stroke="#10B981" 
                            strokeWidth={strokeWidth} 
                            fill="transparent" 
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                              filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.7))',
                              transition: 'stroke-dashoffset 1s ease-out'
                            }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-xs font-black text-white">{cand.aiMatchScore}%</span>
                        </div>
                      </div>

                    </div>

                    {/* Reasons Sliding Accordion */}
                    {isExpanded && (
                      <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed flex flex-col gap-2 animate-slide-in">
                        <span className="text-[9px] uppercase font-bold text-emerald-400">✦ Fit Analysis Details:</span>
                        <ul className="list-disc list-inside flex flex-col gap-1.5 text-[11px] text-slate-300">
                          {cand.aiReasons && cand.aiReasons.map((reason, i) => (
                            <li key={i} className="leading-relaxed">{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-1">
                      
                      {/* Accordion toggle */}
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : cand.id)}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-purple-400" />
                            <span>Hide reasons</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-purple-400" />
                            <span>Why this match?</span>
                          </>
                        )}
                      </button>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onOpenCandidateDetail(cand.id)}
                          className="px-3 py-1.5 border border-white/10 hover:border-purple-500/30 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleShortlistClick(cand, cand.aiMatchScore)}
                          disabled={shortlistingId === cand.id}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md shadow-emerald-500/10"
                        >
                          {shortlistingId === cand.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Shortlisting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Shortlist</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Prompt state when not analyzed */}
          {!loading && results.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border border-white/5 bg-[#0B1020]/20 rounded-2xl min-h-[350px] text-center select-none">
              <Sparkles className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Awaiting Analysis Scan</span>
              <p className="text-[10px] text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">Choose an active role opening or paste custom job requirements, then trigger the AI Match engine to extract matching candidates.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
