import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Calendar, 
  MessageSquare,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  Video
} from 'lucide-react';

const COLUMNS = [
  { id: 'Screened', name: 'Screened', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'Shortlisted', name: 'Shortlisted', color: 'border-amber-500/40 bg-amber-500/5 text-amber-300', accent: 'bg-amber-500' },
  { id: 'Interview Scheduled', name: 'Interview Scheduled', color: 'border-purple-500/40 bg-purple-500/5 text-purple-300', accent: 'bg-purple-500' },
  { id: 'Offered', name: 'Offered / Selected', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300', accent: 'bg-emerald-500' },
  { id: 'Rejected', name: 'Rejected', color: 'border-red-500/40 bg-red-500/5 text-red-300', accent: 'bg-red-500' }
];

export default function PipelineKanban({ candidates, jobs, onUpdateCandidateStatus, onOpenCandidateDetail }) {
  const [draggedCandId, setDraggedCandId] = useState(null);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, candidateId) => {
    setDraggedCandId(candidateId);
    e.dataTransfer.setData('text/plain', candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandId;
    if (candidateId) {
      onUpdateCandidateStatus(candidateId, targetStatus);
      setDraggedCandId(null);
    }
  };

  // Keyboard/Click Action menu callback
  const handleStatusChangeClick = (candidateId, newStatus) => {
    onUpdateCandidateStatus(candidateId, newStatus);
  };

  // Maps applied Job ID to job title
  const getJobTitle = (jobIds) => {
    if (!jobIds || jobIds.length === 0) return 'General Application';
    const targetJob = jobs.find(j => j.id === jobIds[0]);
    return targetJob ? targetJob.title : 'Software Engineer';
  };

  const getJobCompany = (jobIds) => {
    if (!jobIds || jobIds.length === 0) return 'HireVid Network';
    const targetJob = jobs.find(j => j.id === jobIds[0]);
    return targetJob ? targetJob.company : 'Enterprise';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Board Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            Hiring Pipeline Kanban
          </h2>
          <p className="text-slate-400 text-xs">
            Drag and drop applicant cards to sync statuses. Changes update the candidate dashboard instantly.
          </p>
        </div>
        
        <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0B1020] border border-white/10 text-slate-400">
            Total Candidates: {candidates.length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            AI Matches: {candidates.filter(c => c.aiMatchScore >= 90).length}
          </span>
        </div>
      </div>

      {/* Grid columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colCandidates = candidates.filter(cand => cand.status === col.id);
          
          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-xl border p-3 transition-all h-[420px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-1.5">
                  {col.accent && <span className={`w-1.5 h-1.5 rounded-full ${col.accent}`}></span>}
                  <span className="font-bold text-[10px] tracking-wider uppercase text-slate-200">{col.name}</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                  {colCandidates.length}
                </span>
              </div>

              {/* Candidate Cards Stack */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin">
                {colCandidates.length === 0 ? (
                  <div className="py-4 border border-dashed border-white/5 bg-white/[0.01] rounded-xl text-slate-500/60 text-center text-[10px] flex flex-col items-center justify-center gap-1 font-bold uppercase tracking-wider select-none my-auto">
                    <span className="text-base opacity-40">📂</span>
                    <span>Empty Stage</span>
                  </div>
                ) : (
                  colCandidates.map(cand => {
                    const jobTitle = getJobTitle(cand.appliedJobs);
                    
                    return (
                      <div
                        key={cand.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cand.id)}
                        style={{
                          minHeight: '160px',
                          padding: '12px',
                          boxSizing: 'border-box',
                          background: 'rgba(11,16,32,0.9)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s',
                          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                          gap: '8px'
                        }}
                      >
                        {/* Header: Name + AI Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4
                              onClick={() => onOpenCandidateDetail(cand.id)}
                              style={{ fontWeight: 700, fontSize: '13px', color: 'white', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}
                            >
                              {cand.name}
                            </h4>
                            <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{cand.title}</p>
                          </div>
                          <span style={{
                            fontSize: '9px', fontWeight: 800, padding: '2px 4px', borderRadius: '4px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: '2px',
                            ...(cand.aiMatchScore >= 90
                              ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                              : cand.aiMatchScore >= 80
                              ? { background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }
                              : { background: 'rgba(100,116,139,0.1)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' })
                          }}>
                            <Sparkles style={{ width: '8px', height: '8px', flexShrink: 0 }} />
                            {cand.aiMatchScore}%
                          </span>
                        </div>

                        {/* Avatar + Location + Job */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <img
                            src={cand.avatar}
                            alt={cand.name}
                            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80&h=80'; }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '9px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin style={{ width: '10px', height: '10px', color: '#64748B', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cand.location}</span>
                            </span>
                            <span style={{ fontSize: '9px', color: '#A78BFA', fontWeight: 600, display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {jobTitle}
                            </span>
                          </div>
                        </div>

                        {/* Skills — 1 fixed row, no wrapping */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '16px', overflow: 'hidden', flexWrap: 'nowrap' }}>
                          {cand.skills.slice(0, 2).map(skill => (
                            <span key={skill} style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: '#CBD5E1', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {skill}
                            </span>
                          ))}
                          {cand.skills.length > 2 && (
                            <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              +{cand.skills.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Spacer is removed for gap mapping, but keep dynamic layout pushed nicely */}
                        <div style={{ flex: 1 }} />

                        {/* ── Review Button ── */}
                        <button
                          onClick={() => onOpenCandidateDetail(cand.id)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            background: 'rgba(147,51,234,0.1)',
                            border: '1px solid rgba(147,51,234,0.2)',
                            borderRadius: '6px',
                            color: '#C084FC',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            margin: 0
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#9333EA'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(147,51,234,0.1)'; e.currentTarget.style.color = '#C084FC'; e.currentTarget.style.borderColor = 'rgba(147,51,234,0.2)'; }}
                        >
                          <Video style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                          <span>Review Video</span>
                        </button>

                        {/* ── STAGE dropdown selector ── */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(0,0,0,0.35)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          overflow: 'hidden'
                        }}>
                          <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0, marginRight: '6px' }}>Stage:</span>
                          <select
                            value={cand.status}
                            onChange={(e) => handleStatusChangeClick(cand.id, e.target.value)}
                            style={{ background: 'transparent', fontSize: '9px', fontWeight: 600, color: '#F1F5F9', outline: 'none', cursor: 'pointer', border: 'none', padding: 0, minWidth: 0, flex: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            <option value="Screened"            style={{ background: '#0B1020', color: 'white' }}>Screened</option>
                            <option value="Shortlisted"         style={{ background: '#0B1020', color: 'white' }}>Shortlisted</option>
                            <option value="Interview Scheduled" style={{ background: '#0B1020', color: 'white' }}>Interview</option>
                            <option value="Offered"             style={{ background: '#0B1020', color: 'white' }}>Offered</option>
                            <option value="Rejected"            style={{ background: '#0B1020', color: 'white' }}>Rejected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
