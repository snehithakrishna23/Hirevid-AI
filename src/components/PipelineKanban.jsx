import React, { useState } from 'react';
import { 
  MapPin, 
  Sparkles, 
  ArrowRightLeft,
  Video,
  Briefcase
} from 'lucide-react';

const COLUMNS = [
  { id: 'Screened',            label: 'Screened',            color: 'border-slate-600/50',   bg: 'bg-slate-900/40',  header: 'text-slate-300',  dot: 'bg-slate-500'   },
  { id: 'Shortlisted',         label: 'Shortlisted',         color: 'border-amber-500/40',   bg: 'bg-amber-500/5',   header: 'text-amber-300',  dot: 'bg-amber-400'   },
  { id: 'Interview Scheduled', label: 'Interview Scheduled', color: 'border-purple-500/40',  bg: 'bg-purple-500/5',  header: 'text-purple-300', dot: 'bg-purple-400'  },
  { id: 'Offered',             label: 'Offered / Selected',  color: 'border-emerald-500/40', bg: 'bg-emerald-500/5', header: 'text-emerald-300',dot: 'bg-emerald-400' },
  { id: 'Rejected',            label: 'Rejected',            color: 'border-red-500/40',     bg: 'bg-red-500/5',     header: 'text-red-300',    dot: 'bg-red-400'     }
];

export default function PipelineKanban({ candidates = [], jobs = [], onUpdateCandidateStatus, onOpenCandidateDetail }) {
  const [draggedId, setDraggedId]       = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);

  /* ── Drag handlers ─────────────────────────────── */
  const onDragStart = (e, candidateId) => {
    const id = String(candidateId);
    setDraggedId(id);
    try { e.dataTransfer.setData('text/plain', id); } catch (_) {}
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumnId(colId);
  };

  const onDragLeave = () => setOverColumnId(null);

  const onDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      const target = candidates.find(c => String(c.id) === String(id));
      if (target && target.status !== targetStatus) {
        onUpdateCandidateStatus(target.id, targetStatus);
      }
    }
    setDraggedId(null);
    setOverColumnId(null);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setOverColumnId(null);
  };

  /* ── Helpers ────────────────────────────────────── */
  const getJobTitle = (jobIds) => {
    if (!jobIds || jobIds.length === 0) return 'General Application';
    const j = (jobs || []).find(j => j.id === jobIds[0] || String(j.id) === String(jobIds[0]));
    return j ? (j.title || j.name || 'Applied Role') : 'Applied Role';
  };

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase() || 'C';

  const scoreColor = (s) =>
    s >= 90 ? { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.25)' }
    : s >= 75 ? { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' }
    : { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', border: 'rgba(255,255,255,0.08)' };

  /* ── Candidates Empty State ─────────────────────── */
  if (candidates.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <ArrowRightLeft className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">Hiring Pipeline Kanban</h2>
            <p className="text-slate-400 text-xs">Drag and drop applicant cards to sync statuses.</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20 select-none animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5">
            <Briefcase className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base mb-1">No candidates yet</h3>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed font-sans">
              There are no candidates in your pipeline at the moment. Post a job opening to get started.
            </p>
          </div>
          <button
            onClick={() => {
              // Action triggers parent navigation if mapped, button is highly visual
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md shadow-purple-500/15 cursor-pointer"
          >
            Post a Job to Get Started
          </button>
        </div>
      </div>
    );
  }

  /* ── Board ──────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col min-w-0">

      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            Hiring Pipeline Kanban
          </h2>
          <p className="text-slate-400 text-xs">Drag and drop applicant cards to sync statuses. Changes update the candidate dashboard instantly.</p>
        </div>
        <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0B1020] border border-white/10 text-slate-400">
            Total: {candidates.length}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Top Matches: {candidates.filter(c => (c.aiMatchScore || 0) >= 90).length}
          </span>
        </div>
      </div>

      {/* Kanban columns — horizontal flex with overflow scroll */}
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ alignItems: 'flex-start' }}
      >
        {COLUMNS.map(col => {
          const colCards  = candidates.filter(c => c.status === col.id);
          const isOver    = overColumnId === col.id;
          const isDraggingAnything = !!draggedId;

          return (
            <div
              key={col.id}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.id)}
              style={{
                width: '220px',
                minWidth: '220px',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px',
                padding: '12px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                border: isOver
                  ? '2px solid rgba(147,51,234,0.6)'
                  : '1px solid ' + (col.color.includes('amber') ? 'rgba(245,158,11,0.3)'
                      : col.color.includes('purple') ? 'rgba(168,85,247,0.3)'
                      : col.color.includes('emerald') ? 'rgba(16,185,129,0.3)'
                      : col.color.includes('red') ? 'rgba(239,68,68,0.3)'
                      : 'rgba(100,116,139,0.3)'),
                background: isOver
                  ? 'rgba(147,51,234,0.06)'
                  : (col.bg.includes('amber') ? 'rgba(245,158,11,0.03)'
                    : col.bg.includes('purple') ? 'rgba(168,85,247,0.03)'
                    : col.bg.includes('emerald') ? 'rgba(16,185,129,0.03)'
                    : col.bg.includes('red') ? 'rgba(239,68,68,0.03)'
                    : 'rgba(15,20,40,0.6)'),
                boxShadow: isOver ? '0 0 0 2px rgba(147,51,234,0.15), 0 8px 32px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: col.dot.includes('amber') ? '#F59E0B'
                      : col.dot.includes('purple') ? '#A78BFA'
                      : col.dot.includes('emerald') ? '#34D399'
                      : col.dot.includes('red') ? '#F87171'
                      : '#64748B'
                  }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#CBD5E1' }}>{col.label}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                  {colCards.length}
                </span>
              </div>

              {/* Drop zone hint when dragging and column is empty */}
              {isDraggingAnything && colCards.length === 0 && (
                <div style={{
                  flex: 1,
                  border: '2px dashed rgba(147,51,234,0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(147,51,234,0.5)',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  minHeight: '80px',
                  transition: 'all 0.2s',
                  background: isOver ? 'rgba(147,51,234,0.06)' : 'transparent'
                }}>
                  Drop here
                </div>
              )}

              {/* Empty state when not dragging */}
              {!isDraggingAnything && colCards.length === 0 && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '4px', color: 'rgba(100,116,139,0.5)', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: '80px'
                }}>
                  <span style={{ fontSize: '18px', opacity: 0.3 }}>📂</span>
                  <span>Empty</span>
                </div>
              )}

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colCards.map(cand => {
                  const sc       = scoreColor(cand.aiMatchScore || 0);
                  const jobTitle = getJobTitle(cand.appliedJobs);
                  const isBeingDragged = String(cand.id) === String(draggedId);

                  return (
                    <div
                      key={cand.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, cand.id)}
                      onDragEnd={onDragEnd}
                      style={{
                        padding: '12px',
                        background: 'rgba(11,16,32,0.95)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        opacity: isBeingDragged ? 0.45 : 1,
                        transform: isBeingDragged ? 'scale(0.97)' : 'scale(1)',
                        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Name row + Score badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            onClick={() => onOpenCandidateDetail && onOpenCandidateDetail(cand.id)}
                            style={{ fontWeight: 700, fontSize: '12px', color: 'white', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={cand.name}
                          >
                            {cand.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cand.title}</div>
                          {cand.videoLanguage && cand.videoLanguage !== 'English' && (
                            <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: 'rgba(147,51,234,0.15)', color: '#C084FC', border: '1px solid rgba(147,51,234,0.25)', marginTop: '2px', display: 'inline-block' }}>
                              🌐 {cand.videoLanguage}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', gap: '2px',
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                        }}>
                          <Sparkles style={{ width: '7px', height: '7px' }} />
                          {cand.aiMatchScore || 0}%
                        </span>
                      </div>

                      {/* Avatar + location + job */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {cand.avatar ? (
                          <img
                            src={cand.avatar}
                            alt={cand.name}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                            onError={e => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                        ) : (
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(147,51,234,0.2)', border: '1px solid rgba(147,51,234,0.3)', color: '#C084FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, flexShrink: 0 }}>
                            {initials(cand.name)}
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '9px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin style={{ width: '9px', height: '9px', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cand.location || 'Remote'}</span>
                          </div>
                          <div style={{ fontSize: '9px', color: '#A78BFA', fontWeight: 600, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jobTitle}</div>
                        </div>
                      </div>

                      {/* Skills row */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                        {(cand.skills || []).slice(0, 2).map(skill => (
                          <span key={skill} style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {skill}
                          </span>
                        ))}
                        {(cand.skills || []).length > 2 && (
                          <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            +{(cand.skills || []).length - 2}
                          </span>
                        )}
                      </div>

                      {/* Review button */}
                      <button
                        onClick={() => onOpenCandidateDetail && onOpenCandidateDetail(cand.id)}
                        style={{
                          width: '100%', padding: '5px 8px',
                          background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)',
                          borderRadius: '7px', color: '#C084FC', fontSize: '10px', fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '5px', transition: 'all 0.2s', boxSizing: 'border-box'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#9333EA'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(147,51,234,0.1)'; e.currentTarget.style.color = '#C084FC'; }}
                      >
                        <Video style={{ width: '11px', height: '11px' }} />
                        Review Video
                      </button>

                      {/* Stage selector */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', flexShrink: 0 }}>Stage:</span>
                        <select
                          value={cand.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateCandidateStatus(cand.id, e.target.value);
                          }}
                          style={{ background: 'transparent', fontSize: '9px', fontWeight: 600, color: '#F1F5F9', outline: 'none', cursor: 'pointer', border: 'none', flex: 1, minWidth: 0 }}
                        >
                          <option value="Screened"            style={{ background: '#0B1020' }}>Screened</option>
                          <option value="Shortlisted"         style={{ background: '#0B1020' }}>Shortlisted</option>
                          <option value="Interview Scheduled" style={{ background: '#0B1020' }}>Interview Scheduled</option>
                          <option value="Offered"             style={{ background: '#0B1020' }}>Offered</option>
                          <option value="Rejected"            style={{ background: '#0B1020' }}>Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
