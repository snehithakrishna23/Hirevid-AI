import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function VideoTranscription({ activeCand }) {
  const [activeTab, setActiveTab] = useState('transcript');
  const [visibleChars, setVisibleChars] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollContainerRef = useRef(null);

  // 1. Dynamic Seed Data for Candidates
  const getSimulatedData = (candidate) => {
    const name = candidate?.name || 'Candidate';
    const email = candidate?.email || '';

    // Emily Chen - Mobile Developer Profile
    if (email === 'emily.codes@gmail.com' || name.toLowerCase().includes('emily') || candidate?.id === 'cand-4') {
      return {
        confidenceScore: 92,
        skillsMentioned: "Demonstrated advanced domain knowledge in Swift, Kotlin, and React Native. Highlighted experience building native view hierarchies, integrating reactive gesture controls, and configuring optimized local SQL engines.",
        communicationQuality: "Outstanding presentation clarity. Emily communicates technical system paradigms with exceptional articulation, projecting absolute confidence, structured pacing, and high professional enthusiasm.",
        highlights: [
          "Successfully optimized a high-volume checkout app, achieving a 40% reduction in API response rendering delays.",
          "Configured a highly resilient offline-first data sync engine integrating Firebase and local SQLite transactions.",
          "Emphasized a passion for pixel-perfect layout compliance and collaborative test-driven native development."
        ],
        transcript: [
          { time: "0:05", text: "Hi everyone, I'm Emily Chen. I'm a passionate Mobile Developer specializing in building native iOS and Android applications." },
          { time: "0:23", text: "Over the past four years, I've focused extensively on Swift, Kotlin, and hybrid systems like React Native. I love creating highly interactive interfaces with responsive gestures and fluid layouts." },
          { time: "0:45", text: "One of my proudest achievements was optimizing a high-traffic mobile commerce app, reducing load times by 40% and implementing a custom offline synchronization engine using Firebase and SQLite." },
          { time: "1:12", text: "I really value clean architecture, test-driven development in mobile environments, and close collaboration with design teams to deliver polished, pixel-perfect user experiences." },
          { time: "1:38", text: "I'm looking for a forward-thinking team where I can apply my mobile expertise, work with modern tooling, and continue deploying top-rated applications. Thank you for listening!" }
        ],
        keyPhrases: ["Emily Chen", "Mobile Developer", "iOS", "Android", "Swift", "Kotlin", "React Native", "Firebase", "SQLite", "offline synchronization", "clean architecture", "test-driven development"]
      };
    }

    // David Kim - AI & LLM Engineer Profile
    if (email === 'david.ai@gmail.com' || name.toLowerCase().includes('david') || candidate?.id === 'cand-3') {
      return {
        confidenceScore: 95,
        skillsMentioned: "Detailed deep execution expertise in Python, PyTorch, Hugging Face Transformers, and LangChain frameworks. Addressed structural scaling constraints in high-velocity vector stores.",
        communicationQuality: "Highly technical and analytical communication. Projecting authoritative competence in generative deep learning paradigms, high conceptual precision, and methodical explanation logic.",
        highlights: [
          "Developed and optimized proprietary retrieval-augmented generation (RAG) pipelines, cutting hallucinatory rates by 35%.",
          "Fine-tuned neural transformer weights on local hardware cluster rigs to achieve extremely fast sub-100ms response indexes.",
          "Demonstrated exceptional engineering capabilities in advanced vector indexing models and custom cognitive architectures."
        ],
        transcript: [
          { time: "0:04", text: "Hello, my name is David Kim, and I specialize in LLM cognitive architectures, vector indexes, and generative pipeline structures." },
          { time: "0:22", text: "I work daily with Python, PyTorch, Hugging Face pipelines, and orchestrators like LangChain to build resilient multi-agent orchestration frameworks." },
          { time: "0:41", text: "Recently, I designed a production-grade RAG pipeline that successfully integrated vector store search caching, reducing LLM hallucinations by over 35% on multi-million row datasets." },
          { time: "1:08", text: "I am passionate about fine-tuning open-weight models, minimizing parameter compute requirements, and orchestrating distributed GPU inference setups." },
          { time: "1:33", text: "I hope to join a cutting-edge lab to push the boundaries of high-efficiency generative AI interfaces. Thanks for checking out my video resume!" }
        ],
        keyPhrases: ["David Kim", "LLM", "vector indexes", "generative pipeline", "Python", "PyTorch", "Hugging Face", "LangChain", "RAG", "hallucinations", "fine-tuning", "inference"]
      };
    }

    // Sarah Jenkins - Frontend Developer Profile
    if (email === 'sarah.j@gmail.com' || name.toLowerCase().includes('sarah') || candidate?.id === 'cand-1') {
      return {
        confidenceScore: 88,
        skillsMentioned: "Addressed key design tokens, styled React component hierarchies, Tailwind CSS modular bindings, and advanced TypeScript state variables with complete fluency.",
        communicationQuality: "Warm, engaging, and collaborative communication style. Explains complex state machines and CSS layouts with high visual clarity and user-centric developer empathy.",
        highlights: [
          "Engineered a fully reusable modular UI design system that accelerated developer sprint releases by 50%.",
          "Implemented comprehensive WCAG 2.1 AA accessibility checklists, establishing a highly inclusive product grid.",
          "Highlighted strong design integration workflows and pixel-perfect micro-interactions layout styling."
        ],
        transcript: [
          { time: "0:06", text: "Hey! I'm Sarah Jenkins, a Frontend Developer who obsesses over visual layouts, smooth animations, and robust modular component lifecycles." },
          { time: "0:25", text: "My toolbelt includes React, TypeScript, Tailwind CSS, and Framer Motion. I love bridging the gap between design concepts and production-ready systems." },
          { time: "0:48", text: "At my last role, I drove the reconstruction of our enterprise core design system. We built 40+ accessible component blocks, scaling our sprint speed by nearly 50%." },
          { time: "1:15", text: "I ensure that every layout is highly responsive, semantic, and meets rigorous WCAG 2.1 AA accessibility standards for all users." },
          { time: "1:42", text: "I'm excited to join an ambitious product cell looking for a meticulous frontend architect to deliver gorgeous interactive layouts. Thanks for watching!" }
        ],
        keyPhrases: ["Sarah Jenkins", "Frontend Developer", "React", "TypeScript", "Tailwind CSS", "animations", "design system", "accessible", "WCAG 2.1 AA"]
      };
    }

    // Fallback template for other custom candidate profiles
    const primarySkill = (candidate?.skills && candidate.skills.length > 0) ? candidate.skills[0] : 'Software Engineering';
    return {
      confidenceScore: 84,
      skillsMentioned: `Demonstrated technical fluency in ${candidate?.skills?.join(', ') || 'modern engineering structures'}. Discussed practical execution models, development toolkits, and agile pipelines.`,
      communicationQuality: "Clear, methodical, and well-structured articulation. Paces descriptions effectively and projects a high standard of professional commitment and confidence.",
      highlights: [
        `Showcased solid competency in deploying high-quality software solutions utilizing ${primarySkill}.`,
        "Emphasized a strong capability to troubleshoot complex logic problems and work collaboratively across team units.",
        "Demonstrated a clean understanding of software testing protocols and modular code compilation formats."
      ],
      transcript: [
        { time: "0:05", text: `Hello there! I'm ${name}, and I am a software engineer specializing in ${primarySkill} and modern stack development.` },
        { time: "0:24", text: `I love working with tools like ${candidate?.skills?.slice(0, 3).join(', ') || 'React, SQL, and Git'} to design high-quality modules that scale clean.` },
        { time: "0:44", text: "Through my career, I've focused on maintaining clean code standards, implementing strong test coverage, and resolving logical performance bugs." },
        { time: "1:08", text: "I enjoy collaborative environments where we can conduct comprehensive peer review cycles, share clean ideas, and build features iteratively." },
        { time: "1:32", text: "I am ready to bring my energy and coding expertise to your engineering projects. Thanks for reviewing my profile and video resume!" }
      ],
      keyPhrases: [name, primarySkill, "software engineer", "clean code", "performance bugs", "collaborative environments"].concat(candidate?.skills || [])
    };
  };

  const data = getSimulatedData(activeCand);

  // 2. Compute Character Mapping for typewriter effect
  const fullTranscriptText = data.transcript.map(s => s.text).join(' ');
  const totalLength = fullTranscriptText.length;

  // Restart typewriter animation whenever candidate or tab changes
  useEffect(() => {
    setVisibleChars(0);
  }, [activeCand?.id, activeTab]);

  // Typewriter effect interval
  useEffect(() => {
    if (activeTab !== 'transcript') return;
    if (visibleChars >= totalLength) return;

    const interval = setTimeout(() => {
      setVisibleChars(prev => Math.min(prev + 3, totalLength)); // Fast character stream (3 chars per 20ms)
    }, 20);

    return () => clearTimeout(interval);
  }, [visibleChars, totalLength, activeTab]);

  // 3. Database Auto-Sync: Save transcript to candidate_profiles if empty
  useEffect(() => {
    const syncTranscriptToDb = async () => {
      // Check if candidateId exists and supabase is initialized
      if (!supabase || !activeCand?.candidateId) return;
      if (activeCand?.videoTranscript) return; // Already exists in database

      try {
        setSaving(true);
        const { error } = await supabase
          .from('candidate_profiles')
          .update({ video_transcript: JSON.stringify(data.transcript) })
          .eq('user_id', activeCand.candidateId);
        
        if (error) {
          console.warn("Failed to sync transcript into candidate_profiles table:", error);
        } else {
          console.log("Successfully synced video transcript into candidate_profiles for candidate:", activeCand.name);
        }
      } catch (err) {
        console.warn("Database sync transaction failed:", err);
      } finally {
        setSaving(false);
      }
    };

    syncTranscriptToDb();
  }, [activeCand?.id, activeCand?.candidateId]);

  // 4. Copy to clipboard
  const handleCopyTranscript = () => {
    const copyText = data.transcript.map(s => `[${s.time}] ${s.text}`).join('\n');
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 5. Share summary toast
  const handleShareSummary = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  // 6. Inline Highlighter engine (highlights visible text character by character)
  const renderTypewrittenSegments = () => {
    let globalCharCount = 0;
    
    return data.transcript.map((seg, segIdx) => {
      const segStart = globalCharCount;
      const segEnd = segStart + seg.text.length;
      globalCharCount = segEnd + 1; // +1 to account for join space

      // Determine visible portion of this segment
      if (visibleChars <= segStart) return null; // Not yet typed

      const isPartial = visibleChars < segEnd;
      const sliceEndIndex = isPartial ? (visibleChars - segStart) : seg.text.length;
      const visibleText = seg.text.slice(0, sliceEndIndex);

      return (
        <div key={segIdx} className="flex gap-4 items-start border-l border-white/5 pl-4 hover:border-purple-500/30 transition-colors py-1.5 group select-text">
          {/* Timestamp column */}
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded border border-white/5 select-none transition-colors group-hover:text-purple-400">
            {seg.time}
          </span>
          
          {/* Typewritten text with matching phrases highlighted */}
          <p className="text-xs text-slate-300 leading-relaxed flex-1">
            {highlightPhrases(visibleText, data.keyPhrases)}
            {isPartial && <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse ml-0.5 select-none" />}
          </p>
        </div>
      );
    });
  };

  // Split plain text by keyPhrases and wrap matches in highlighted marks
  const highlightPhrases = (text, keyPhrases) => {
    if (!text) return '';
    
    // Escape regex characters
    const escapedPhrases = keyPhrases
      .map(phrase => phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .filter(Boolean);
      
    if (escapedPhrases.length === 0) return text;
    
    const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const isMatch = keyPhrases.some(phrase => phrase.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={i} className="bg-purple-600/35 text-purple-200 font-semibold px-1 rounded shadow-sm select-text border border-purple-500/20">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-[#0B1020]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
      
      {/* Dynamic Local Toast Notifications */}
      {copied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/10 border border-emerald-400/30 flex items-center gap-1.5 animate-bounce select-none">
          <span>✓</span> Transcript copied to clipboard!
        </div>
      )}
      {shared && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-500/10 border border-purple-400/30 flex items-center gap-1.5 animate-bounce select-none">
          <span>✦</span> summary shared to the recruiter panel!
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/5">
        <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          AI Transcription & Summary
        </span>

        {/* Tab switcher with sliding indicator */}
        <div className="relative flex bg-slate-950/60 p-1 rounded-xl border border-white/5 w-full sm:w-[220px] h-[34px] select-none">
          <div 
            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 ease-out shadow-lg shadow-purple-500/15"
            style={{
              left: activeTab === 'transcript' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)'
            }}
          />
          <button
            onClick={() => setActiveTab('transcript')}
            className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 rounded-lg flex items-center justify-center gap-1 ${
              activeTab === 'transcript' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📄</span> Transcript
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 rounded-lg flex items-center justify-center gap-1 ${
              activeTab === 'summary' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨</span> AI Summary
          </button>
        </div>
      </div>

      {/* Contents Area */}
      <div className="min-h-[220px] max-h-[340px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin" ref={scrollContainerRef}>
        
        {/* TRANSCRIPT VIEW */}
        {activeTab === 'transcript' && (
          <div className="flex flex-col gap-3 relative select-text">
            {/* Copy Transcript button at top right */}
            {visibleChars > 10 && (
              <div className="flex justify-end select-none">
                <button 
                  onClick={handleCopyTranscript}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-950/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-purple-500/30 flex items-center gap-1.5 transition-all self-end"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.4M9 2.25H18a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0118 20.25H9A2.25 2.25 0 016.75 18V4.5B9 2.25z"/></svg>
                  Copy Transcript
                </button>
              </div>
            )}
            
            {/* Render paragraphs sequentially */}
            <div className="flex flex-col gap-4">
              {renderTypewrittenSegments()}
            </div>
            
            {/* Auto-typing loading indicator if active typing */}
            {visibleChars < totalLength && (
              <div className="flex gap-2 items-center pl-4 border-l border-white/5 select-none">
                <span className="text-[10px] text-purple-400 animate-pulse font-mono font-bold tracking-wider">AI transcribing stream...</span>
                <span className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI SUMMARY VIEW */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-3 animate-fade-in select-text">
            
            {/* Card 1: Skills Mentioned */}
            <div className="bg-[#11182D]/55 border border-white/5 rounded-xl p-4 flex gap-3 hover:border-purple-500/20 transition-all group">
              <span className="text-xl bg-purple-600/10 p-2 rounded-xl border border-purple-500/20 self-start group-hover:scale-110 transition-transform">
                🎯
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-200">Skills Mentioned</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">{data.skillsMentioned}</p>
              </div>
            </div>

            {/* Card 2: Communication Quality */}
            <div className="bg-[#11182D]/55 border border-white/5 rounded-xl p-4 flex gap-3 hover:border-indigo-500/20 transition-all group">
              <span className="text-xl bg-indigo-600/10 p-2 rounded-xl border border-indigo-500/20 self-start group-hover:scale-110 transition-transform">
                💬
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-200">Communication Quality</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">{data.communicationQuality}</p>
              </div>
            </div>

            {/* Card 3: Key Highlights */}
            <div className="bg-[#11182D]/55 border border-white/5 rounded-xl p-4 flex gap-3 hover:border-pink-500/20 transition-all group">
              <span className="text-xl bg-pink-600/10 p-2 rounded-xl border border-pink-500/20 self-start group-hover:scale-110 transition-transform">
                ⭐
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-200">Standout Moments</span>
                <ul className="flex flex-col gap-2 mt-1">
                  {data.highlights.map((h, i) => (
                    <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex gap-2 items-start">
                      <span className="text-purple-400 mt-1 select-none">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Score and Share Row */}
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5 mt-2 select-none">
              
              {/* Confidence Score Badge */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black border ${
                  data.confidenceScore >= 80
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${data.confidenceScore >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {data.confidenceScore}% {data.confidenceScore >= 80 ? 'High Confidence' : 'Moderate'}
                </div>
              </div>

              {/* Share Summary Button */}
              <button 
                onClick={handleShareSummary}
                className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/10 flex items-center gap-1 transition-all"
              >
                <span>🚀</span> Share Summary
              </button>

            </div>

          </div>
        )}

      </div>

      {/* Syncing micro-indicator */}
      {saving && (
        <div className="absolute bottom-2 right-4 flex items-center gap-1 text-[8px] font-bold text-purple-400/80 animate-pulse select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
          syncing transcript...
        </div>
      )}
    </div>
  );
}
