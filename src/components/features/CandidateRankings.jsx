import React, { useState, useEffect } from 'react';
import { Award, Search, Sparkles, MessageSquare, ShieldCheck, ArrowUpDown, Eye, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function CandidateRankings({ 
  candidates = [], 
  onOpenCandidateDetail, 
  onUpdateCandidateStatus, 
  onSendChatMessage, 
  showToast 
}) {
  // DB & UI States
  const [dbRankings, setDbRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatePodium, setAnimatePodium] = useState(false);

  // Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'date', 'role'

  // Trigger SVG offset animation after mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatePodium(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [loading]);

  // Load and join dynamic rankings data from Supabase
  const loadRankingsData = async () => {
    // Safety: never stay stuck loading more than 3 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 3000);

    try {
      setLoading(true);
      if (supabase) {
        // Step 1: fetch all applications with job title
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select(`id, status, ai_score, applied_at, candidate_id, job_id, jobs ( title )`);

        if (appsError || !appsData || appsData.length === 0) {
          if (appsError) console.warn("Applications query failed, using fallback:", appsError.message);
          useMockFallback();
          return;
        }

        // Step 2: fetch users and profiles separately, merge in JS
        const candidateIds = [...new Set(appsData.map(a => a.candidate_id).filter(Boolean))];

        if (candidateIds.length === 0) {
          useMockFallback();
          return;
        }

        const [{ data: usersData }, { data: profilesData }] = await Promise.all([
          supabase.from('users').select('id, name, email').in('id', candidateIds),
          supabase.from('candidate_profiles').select('user_id, skills, location, experience, bio, video_url, pdf_url').in('user_id', candidateIds)
        ]);

        const usersMap   = Object.fromEntries((usersData   || []).map(u => [u.id,      u]));
        const profileMap = Object.fromEntries((profilesData || []).map(p => [p.user_id, p]));

        const mapped = appsData.map(app => {
          const user    = usersMap[app.candidate_id]   || {};
          const profile = profileMap[app.candidate_id] || {};
          const job     = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          return {
            applicationId: app.id,
            id:             app.candidate_id || app.id,
            name:           user.name     || 'Anonymous Candidate',
            email:          user.email    || '',
            role:           job?.title    || 'Software Engineer',
            score:          app.ai_score  || 70,
            skills:         profile.skills     || [],
            experience:     profile.experience || '',
            location:       profile.location   || 'Remote',
            bio:            profile.bio        || '',
            videoResumeUrl: profile.video_url  || '',
            pdfResumeUrl:   profile.pdf_url    || '',
            status:         app.status         || 'Screened',
            appliedAt:      app.applied_at     || new Date().toISOString()
          };
        });

        if (mapped.length > 0) {
          setDbRankings(mapped);
        } else {
          useMockFallback();
        }
      } else {
        useMockFallback();
      }
    } catch (err) {
      console.error("Rankings load error:", err);
      useMockFallback();
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankingsData();
  }, [candidates]);

  const useMockFallback = () => {
    // Map candidates passed as prop into the standardized Rankings structure
    const mappedProps = (candidates || []).map((cand, idx) => {
      // Create artificial date offsets for sorting
      const dateOffset = new Date();
      dateOffset.setDate(dateOffset.getDate() - idx * 2);

      // Map statuses correctly
      return {
        applicationId: cand?.id || `app-${idx}`,
        id: cand?.id,
        name: cand?.name || 'Anonymous',
        email: cand?.email || 'candidate@hirevid.ai',
        role: cand?.title || 'Software Engineer',
        score: cand?.aiMatchScore || 75,
        skills: cand?.skills || [],
        experience: cand?.experience || 'CS Graduate',
        location: cand?.location || 'Remote',
        bio: cand?.bio || '',
        videoResumeUrl: cand?.videoResumeUrl || '',
        pdfResumeUrl: cand?.pdfResumeUrl || '',
        status: cand?.status || 'Screened',
        appliedAt: dateOffset.toISOString()
      };
    });
    setDbRankings(mappedProps);
  };

  // Extract unique skills list for filters

  const uniqueSkills = ['All', ...new Set((dbRankings || []).flatMap(c => c?.skills || []))];

  // Filtering candidates
  const filteredRankings = (dbRankings || []).filter(cand => {
    if (!cand) return false;
    const matchesSearch = (cand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (cand.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = selectedSkill === 'All' || (cand.skills || []).includes(selectedSkill);
    const matchesScore = (cand.score || 0) >= minScore;
    return matchesSearch && matchesSkill && matchesScore;
  });

  // Sorting candidates
  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.score || 0) - (a.score || 0);
    } else if (sortBy === 'date') {
      return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
    } else if (sortBy === 'role') {
      return (a.role || '').localeCompare(b.role || '');
    }
    return 0;
  });

  // Podium mappings based on score ranking
  const podiumList = [...(dbRankings || [])].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  
  // Arrange top 3 as [Rank 2, Rank 1, Rank 3] for physical podium centering
  const podiumLayout = [];
  if (podiumList[1]) podiumLayout.push({ ...podiumList[1], rank: 2 }); // Left (Silver)
  if (podiumList[0]) podiumLayout.push({ ...podiumList[0], rank: 1 }); // Center (Gold)
  if (podiumList[2]) podiumLayout.push({ ...podiumList[2], rank: 3 }); // Right (Bronze)

  // Stats calculation
  const totalCandidatesCount = (dbRankings || []).length;
  const averageScore = totalCandidatesCount > 0 
    ? Math.round(dbRankings.reduce((sum, c) => sum + (c.score || 0), 0) / totalCandidatesCount) 
    : 0;
  const topScore = totalCandidatesCount > 0 
    ? Math.max(...dbRankings.map(c => c.score || 0)) 
    : 0;
  const hiredCount = (dbRankings || []).filter(c => c.status === 'Offered' || c.status === 'Hired').length;

  const getStatusChipStyles = (status) => {
    const s = status.toLowerCase();
    if (s === 'offered' || s === 'hired') {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5';
    }
    if (s === 'interview scheduled' || s === 'shortlisted' || s === 'interviewed') {
      return 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/5';
    }
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-green-400';
    if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  // SVGs score ring geometry values
  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  // Loader state indicator
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-xs text-slate-400 font-jakarta mt-3">Loading Talent Rankings Board...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animation-fade-in pb-12">
      
      {/* SECTION 1 - TITLE HEADER */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 font-jakarta">
            <Award className="w-5 h-5 text-purple-400" />
            Candidate Rankings Leaderboard
          </h2>
          <p className="text-slate-400 text-xs font-sans">
            Real-time synthesis of recruiter pipelines, applications, and verified AI match statistics.
          </p>
        </div>

        <button 
          onClick={loadRankingsData}
          className="px-4 py-2 bg-black/40 hover:bg-[#0B1020] border border-white/10 hover:border-purple-500/30 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5"
        >
          🔄 Reload Stats
        </button>
      </div>

      {/* SECTION 2 - PODIUM STANDS */}
      {podiumLayout.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block text-center font-jakarta">
            🏆 TOP 3 PLATFORM MATCHES
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto w-full pt-4 px-2 select-none">
            {podiumLayout.map(cand => {
              const scoreDashoffset = circumference - (cand.score / 100) * circumference;
              
              // Arrange heights and glow styling according to Rank placement
              let heightClass = '';
              let glowBorderClass = '';
              let rankBadge = '';
              let rankText = '';
              let glowOverlay = '';
              
              if (cand.rank === 1) {
                heightClass = 'h-[270px] z-10 md:-translate-y-2';
                glowBorderClass = 'border-amber-500/40 shadow-xl shadow-amber-500/5 bg-[#0B1020]';
                glowOverlay = 'absolute inset-0 border border-amber-500/10 rounded-2xl pointer-events-none filter blur-[1px]';
                rankBadge = '🥇';
                rankText = 'Gold Match';
              } else if (cand.rank === 2) {
                heightClass = 'h-[220px]';
                glowBorderClass = 'border-slate-400/30 shadow-md shadow-slate-500/5 bg-[#0B1020]/90';
                glowOverlay = 'absolute inset-0 border border-slate-400/5 rounded-2xl pointer-events-none filter blur-[1px]';
                rankBadge = '🥈';
                rankText = 'Silver Match';
              } else {
                heightClass = 'h-[190px]';
                glowBorderClass = 'border-amber-800/30 shadow-md shadow-amber-900/5 bg-[#0B1020]/80';
                glowOverlay = 'absolute inset-0 border border-amber-800/5 rounded-2xl pointer-events-none filter blur-[1px]';
                rankBadge = '🥉';
                rankText = 'Bronze Match';
              }

              return (
                <div 
                  key={cand.id}
                  onClick={() => onOpenCandidateDetail(cand.id)}
                  className={`relative flex flex-col items-center justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:border-purple-500/40 cursor-pointer ${heightClass} ${glowBorderClass}`}
                >
                  {glowOverlay}

                  {/* TOP MATCH Badge only for Rank 1 */}
                  {cand.rank === 1 && (
                    <span className="absolute -top-3.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[#050816] text-[8px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 z-20">
                      ✦ Top Match
                    </span>
                  )}

                  {/* Initials & Medal Badge */}
                  <div className="flex flex-col items-center gap-2 mt-2 w-full text-center">
                    <div className="relative">
                      {/* Avatar initials ring */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/35 to-blue-500/25 border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-lg">
                        {cand.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {/* Medal badge absolute */}
                      <span className="absolute -bottom-2 -right-2 text-lg filter drop-shadow">
                        {rankBadge}
                      </span>
                    </div>

                    <div className="mt-2.5 max-w-[180px] min-w-0">
                      <h4 className="font-extrabold text-xs text-white truncate font-jakarta leading-tight">{cand.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-sans leading-none">{cand.role}</p>
                    </div>
                  </div>

                  {/* Score SVG Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle 
                        cx="24" 
                        cy="24" 
                        r={radius} 
                        stroke="rgba(255,255,255,0.03)" 
                        strokeWidth={strokeWidth} 
                        fill="transparent" 
                      />
                      <circle 
                        cx="24" 
                        cy="24" 
                        r={radius} 
                        stroke={cand.rank === 1 ? '#F59E0B' : cand.rank === 2 ? '#94A3B8' : '#B45309'} 
                        strokeWidth={strokeWidth} 
                        fill="transparent" 
                        strokeDasharray={circumference}
                        strokeDashoffset={animatePodium ? scoreDashoffset : circumference}
                        strokeLinecap="round"
                        style={{
                          filter: `drop-shadow(0 0 4px ${cand.rank === 1 ? 'rgba(245,158,11,0.6)' : cand.rank === 2 ? 'rgba(148,163,184,0.6)' : 'rgba(180,83,9,0.6)'})`,
                          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[10px] font-black text-white font-jakarta">{cand.score}%</span>
                    </div>
                  </div>

                  {/* Key Skills Tags list */}
                  <div className="flex flex-wrap justify-center gap-1 mt-1 w-full max-w-[170px]">
                    {cand.skills.slice(0, 2).map(sk => (
                      <span key={sk} className="text-[8px] font-bold px-2 py-0.5 rounded bg-[#11182D] border border-white/5 text-slate-300 font-sans tracking-wide uppercase leading-none">
                        {sk}
                      </span>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3 - STATS TILES BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {[
          { label: 'Total Scanned', value: totalCandidatesCount, emoji: '👥', color: 'text-purple-400 border-purple-500/10' },
          { label: 'Average Score', value: `${averageScore}%`, emoji: '📈', color: 'text-emerald-400 border-emerald-500/10' },
          { label: 'Top AI Rating', value: `${topScore}%`, emoji: '👑', color: 'text-amber-400 border-amber-500/10' },
          { label: 'Hired Pipeline', value: hiredCount, emoji: '💼', color: 'text-blue-400 border-blue-500/10' }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className={`glass-card p-3 px-4 rounded-xl border bg-[#0B1020]/60 flex items-center justify-between gap-3 ${stat.color} hover:bg-[#0B1020]/80 transition-colors`}
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none">{stat.label}</span>
              <span className="text-base font-black text-white block mt-1.5 leading-none font-jakarta">{stat.value}</span>
            </div>
            <span className="text-xl shrink-0 select-none">{stat.emoji}</span>
          </div>
        ))}
      </div>

      {/* SECTION 4 - FILTER & SEARCH BAR BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#0B1020]/60 p-5 rounded-2xl border border-white/5 items-end">
        
        {/* Name/Role Search */}
        <div className="lg:col-span-3">
          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Search Candidates</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Query name or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050816] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-sans"
            />
          </div>
        </div>

        {/* Skill dropdown selector */}
        <div className="lg:col-span-3 col-span-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Technology Cluster</label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none font-sans font-bold cursor-pointer"
          >
            {uniqueSkills.map(sk => <option key={sk} value={sk}>{sk}</option>)}
          </select>
        </div>

        {/* Min Score slider */}
        <div className="lg:col-span-3 col-span-1">
          <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-jakarta">
            <span>Min AI Score</span>
            <span className="text-emerald-400 font-extrabold">{minScore}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-full accent-purple-600 bg-[#050816] h-1.5 rounded-full mt-2 cursor-pointer"
          />
        </div>

        {/* Sorting selection */}
        <div className="lg:col-span-3 col-span-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-jakarta">Sort Criteria</label>
          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#050816] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none font-sans font-bold cursor-pointer appearance-none"
            >
              <option value="score">Rank by Score Rating</option>
              <option value="date">Order by Application Date</option>
              <option value="role">Alphabetize by Role Title</option>
            </select>
          </div>
        </div>

      </div>

      {/* SECTION 5 - LEADERBOARD LEADERBOARD TABLE */}
      <div className="glass-card border border-white/5 rounded-2xl bg-[#0B1020]/60 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/5 bg-[#050816]/75 uppercase tracking-wider text-[9px] font-black text-slate-400 font-jakarta">
                <th className="py-4 px-5">Rank</th>
                <th className="py-4 px-5">Candidate</th>
                <th className="py-4 px-5">Role Title</th>
                <th className="py-4 px-5">AI Score</th>
                <th className="py-4 px-5">Expertise</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/[0.04]">
              {sortedRankings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold font-jakarta select-none">
                    📂 No candidates found matching these active database criteria.
                  </td>
                </tr>
              ) : (
                sortedRankings.map((cand, idx) => {
                  const rank = idx + 1;
                  
                  // Medal markers for podium matches
                  let rankCell = <span className="text-slate-400 font-bold text-xs">{rank}</span>;
                  if (rank === 1) rankCell = <span className="text-xl filter drop-shadow">🥇</span>;
                  else if (rank === 2) rankCell = <span className="text-xl filter drop-shadow">🥈</span>;
                  else if (rank === 3) rankCell = <span className="text-xl filter drop-shadow">🥉</span>;

                  // Skills pill rendering breakdown
                  const topSkills = cand.skills.slice(0, 2);
                  const extraSkills = cand.skills.length - 2;

                  return (
                    <tr 
                      key={cand.id}
                      onClick={() => onOpenCandidateDetail(cand.id)}
                      className={`group transition-all duration-150 cursor-pointer ${
                        idx % 2 === 0 ? 'bg-[#0B1020]/30' : 'bg-[#11182D]/20'
                      } hover:bg-[#11182D]/85 border-l-2 border-l-transparent hover:border-l-purple-500`}
                    >
                      {/* Rank Column */}
                      <td className="py-4.5 px-5 font-bold shrink-0">{rankCell}</td>
                      
                      {/* Candidate Profile Info Column */}
                      <td className="py-4.5 px-5 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-extrabold text-[11px] text-purple-300 shadow shrink-0">
                            {cand.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-white block group-hover:text-purple-300 transition-colors leading-none font-jakarta truncate max-w-[150px]">
                              {cand.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1 leading-none font-sans truncate max-w-[150px]">
                              {cand.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Job Opening Title */}
                      <td className="py-4.5 px-5 font-semibold text-slate-300 max-w-[160px] truncate">
                        {cand.role}
                      </td>

                      {/* AI Matching progress bar */}
                      <td className="py-4.5 px-5 min-w-[120px]">
                        <div className="flex items-center gap-3">
                          <div className="w-16 bg-[#050816] h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div className={`${getScoreBarColor(cand.score)} h-full rounded-full`} style={{ width: `${cand.score}%` }}></div>
                          </div>
                          <span className={`text-xs font-black ${getScoreTextColor(cand.score)} font-jakarta`}>{cand.score}%</span>
                        </div>
                      </td>

                      {/* Top Skills Pills */}
                      <td className="py-4.5 px-5 max-w-[180px]">
                        <div className="flex flex-wrap gap-1 items-center">
                          {topSkills.map(sk => (
                            <span key={sk} className="text-[8px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 uppercase tracking-wide">
                              {sk}
                            </span>
                          ))}
                          {extraSkills > 0 && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                              +{extraSkills}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stage status chip */}
                      <td className="py-4.5 px-5">
                        <span className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border leading-none inline-block ${getStatusChipStyles(cand.status)}`}>
                          {cand.status}
                        </span>
                      </td>

                      {/* Hover action tooltip triggers */}
                      <td className="py-4.5 px-5 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 items-center justify-end">
                          
                          {/* View details */}
                          <button 
                            onClick={() => onOpenCandidateDetail(cand.id)}
                            className="p-1.5 bg-black/40 hover:bg-[#11182D] border border-white/10 hover:border-purple-500/30 text-slate-400 hover:text-white rounded-lg transition-all tooltip"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to shortlist */}
                          <button 
                            onClick={() => {
                              onUpdateCandidateStatus(cand.applicationId || cand.id, 'Shortlisted');
                            }}
                            className="p-1.5 bg-black/40 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-all tooltip"
                            title="Shortlist Candidate"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Message/Chat Box absolute trigger */}
                          <button 
                            onClick={() => {
                              onSendChatMessage(cand.id, `Hi ${cand.name}! Loved your profile, let's schedule an interview.`, 'recruiter');
                              showToast(`Automated chat invitation dispatched to ${cand.name}!`, "success");
                            }}
                            className="p-1.5 bg-black/40 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 text-slate-400 hover:text-purple-400 rounded-lg transition-all tooltip"
                            title="Dispatch Interview Invitation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
