import React, { useState, useEffect } from 'react';
import { 
  Video, 
  ShieldCheck, 
  FileText, 
  MapPin, 
  Sparkles, 
  UserCheck, 
  Briefcase,
  ToggleLeft, 
  ToggleRight, 
  LogOut,
  Layers,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import CandidateWorkspace from './components/CandidateWorkspace';
import RecruiterWorkspace from './components/RecruiterWorkspace';
import AuthScreen from './components/AuthScreen';
import ErrorBoundary from './components/ErrorBoundary';


// Pre-seeded mock jobs database
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer (React & Tailwind)',
    company: 'VividAI Systems',
    logo: '✨',
    location: 'Remote (US/Canada)',
    salary: '$130k - $160k',
    type: 'Full-time',
    skills: ['React', 'Tailwind CSS', 'JavaScript', 'TypeScript', 'WebRTC', 'Next.js'],
    description: 'We are seeking a senior engineer to build the future of our video collaboration suite. Strong proficiency in styling layouts and responsive animations is required.'
  },
  {
    id: 'job-2',
    title: 'Senior Product UI/UX Designer',
    company: 'DesignFlow Inc.',
    logo: '🎨',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$120k - $150k',
    type: 'Full-time',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'Wireframing', 'User Research'],
    description: 'Join a design-first organization where you will orchestrate layouts, design systems, and fluid human interfaces for our enterprise SaaS product.'
  },
  {
    id: 'job-3',
    title: 'Generative AI & LLM Engineer',
    company: 'NeuralNext',
    logo: '🧠',
    location: 'Seattle, WA (On-site)',
    salary: '$160k - $210k',
    type: 'Full-time',
    skills: ['Python', 'PyTorch', 'LLMs', 'NLP', 'Transformers', 'APIs'],
    description: 'Work directly on training and tuning multimodal foundation models. Experience with audio/video indexing and text embedding vectors is a huge plus.'
  },
  {
    id: 'job-4',
    title: 'Cloud DevOps Architect',
    company: 'CloudScale Corp',
    logo: '☁️',
    location: 'Remote (Global)',
    salary: '$140k - $180k',
    type: 'Contract',
    skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Linux'],
    description: 'Help us scale our real-time video streaming architecture globally. You will design fault-tolerant containerized nodes and orchestrate media relays.'
  }
];

// Pre-seeded mock candidates database
const INITIAL_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Sarah Jenkins',
    title: 'Full Stack Engineer',
    location: 'New York, NY',
    email: 'sarah.j@devmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Tailwind CSS', 'SQL'],
    bio: 'Passionate full-stack developer with 5+ years of experience building scalable web solutions. Focused on pixel-perfect implementations, audio/video streaming tools, and high-performance React application patterns.',
    kycStatus: 'Verified',
    pdfResumeName: 'sarah_jenkins_resume.pdf',
    videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42280-large.mp4',
    videoDuration: '1:45',
    appliedJobs: ['job-1'],
    status: 'Screened', // Screened, Shortlisted, Interview Scheduled, Offered, Rejected
    aiMatchScore: 94,
    chatHistory: [
      { sender: 'recruiter', text: 'Hi Sarah! Loved your video resume. The WebRTC segment was highly impressive.', timestamp: 'Yesterday, 4:15 PM' },
      { sender: 'candidate', text: 'Hi! Thank you so much. I built that module to showcase optimized frame rendering in react. Let me know when you would like to connect!', timestamp: 'Yesterday, 4:32 PM' }
    ]
  },
  {
    id: 'cand-2',
    name: 'Alex Rivera',
    title: 'UI/UX Designer',
    location: 'San Francisco, CA',
    email: 'alex.design@creative.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'Adobe CC', 'CSS Grid'],
    bio: 'Product designer focusing on beautiful, inclusive, and animated design workflows. Over 4 years of translating complex analytical workflows into simple, human-centric software solutions.',
    kycStatus: 'Verified',
    pdfResumeName: 'alex_rivera_portfolio.pdf',
    videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-sitting-at-his-desk-and-smiling-at-camera-42284-large.mp4',
    videoDuration: '2:10',
    appliedJobs: ['job-2'],
    status: 'Shortlisted',
    aiMatchScore: 89,
    chatHistory: [
      { sender: 'recruiter', text: 'Alex, your portfolio represents a great aesthetic sense. How familiar are you with design tokens in Figma?', timestamp: '2 days ago' },
      { sender: 'candidate', text: 'Thanks! I maintain token libraries using JSON structures that map directly to Tailwind configs. I spoke about it at a local meetup recently!', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'cand-3',
    name: 'David Kim',
    title: 'AI Engineering Lead',
    location: 'Seattle, WA',
    email: 'david.kim@neuralnext.net',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['Python', 'PyTorch', 'LLMs', 'Transformers', 'C++', 'Docker'],
    bio: 'Researcher and software engineer specialize in optimizing neural networks and running large language models locally. Eager to bring deep intelligence systems to rich video transcripts and analytics.',
    kycStatus: 'Verified',
    pdfResumeName: 'david_kim_phd.pdf',
    videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-with-glasses-working-on-his-laptop-42282-large.mp4',
    videoDuration: '1:30',
    appliedJobs: ['job-3'],
    status: 'Interview Scheduled',
    aiMatchScore: 96,
    chatHistory: [
      { sender: 'recruiter', text: 'David, we are ready to schedule your code evaluation session. I have sent an invite.', timestamp: '3 days ago' },
      { sender: 'candidate', text: 'Awesome, looking forward to diving deep into the model metrics. Calendar synced!', timestamp: '3 days ago' }
    ]
  },
  {
    id: 'cand-4',
    name: 'Emily Chen',
    title: 'Mobile Developer (iOS/Android)',
    location: 'Austin, TX',
    email: 'emily.codes@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
    skills: ['Swift', 'Kotlin', 'React Native', 'Mobile UI', 'Git', 'Firebase'],
    bio: 'Dedicated mobile applications builder with a record of deploying top-rated applications to the App Store. Enthusiastic about adding immersive video playback overlays and reactive gestures to native apps.',
    kycStatus: 'Pending',
    pdfResumeName: 'emily_chen_mobile.pdf',
    videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-laptop-and-smiling-at-camera-42285-large.mp4',
    videoDuration: '1:58',
    appliedJobs: ['job-1'],
    status: 'Screened',
    aiMatchScore: 78,
    chatHistory: []
  }
];

const INITIAL_INTERVIEWS = [
  {
    id: 'int-1',
    candidateId: 'cand-3',
    candidateName: 'David Kim',
    role: 'Generative AI & LLM Engineer',
    date: '2026-05-28',
    time: '14:00',
    platform: 'HireVid Virtual Room',
    status: 'Confirmed'
  }
];

export default function App() {
  // Stats Animation States
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [accuracyCount, setAccuracyCount] = useState(0);
  const [speedCount, setSpeedCount] = useState(0);

  // Demo mode selector modal state
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Global States synced with localStorage
  const [view, setView] = useState(() => {
    const currentUserSaved = localStorage.getItem('hirevid_currentUser');
    if (currentUserSaved) {
      // Only restore dashboard view if an active user session exists
      return JSON.parse(currentUserSaved).role; // 'candidate' or 'recruiter'
    }
    // If no user session, always start at landing — never restore a stale dashboard view
    const savedView = localStorage.getItem('hirevid_view') || 'landing';
    return ['candidate', 'recruiter'].includes(savedView) ? 'landing' : savedView;
  });

  useEffect(() => {
    if (view === 'landing') {
      // animate counts
      setCandidatesCount(0);
      setCompaniesCount(0);
      setAccuracyCount(0);
      setSpeedCount(0);
      
      const duration = 1500; // ms
      const startTime = performance.now();
      
      let frame;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing out function (cubic ease-out)
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const easeProgress = easeOut(progress);
        
        setCandidatesCount(Math.floor(easeProgress * 2400));
        setCompaniesCount(Math.floor(easeProgress * 380));
        setAccuracyCount(Math.floor(easeProgress * 91));
        setSpeedCount(Math.floor(easeProgress * 4));
        
        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setCandidatesCount(2400);
          setCompaniesCount(380);
          setAccuracyCount(91);
          setSpeedCount(4);
        }
      };
      
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }
  }, [view]);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hirevid_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('hirevid_users');
    if (saved) return JSON.parse(saved);
    const initial = [
      { name: 'Sarah Jenkins', email: 'sarah.j@devmail.com', password: 'password', role: 'candidate', company: '' },
      { name: 'VividAI Team', email: 'recruiter@vividai.com', password: 'password', role: 'recruiter', company: 'VividAI Systems' }
    ];
    localStorage.setItem('hirevid_users', JSON.stringify(initial));
    return initial;
  });

  const [authFormRole, setAuthFormRole] = useState('candidate');

  const [candidates, setCandidates] = useState(() => {
    const savedSession = localStorage.getItem('hirevid_currentUser');
    if (savedSession) {
      const u = JSON.parse(savedSession);
      if (u.email !== 'sarah.j@devmail.com' && u.email !== 'recruiter@vividai.com') {
        // Real production users start fresh
        return [];
      }
    }
    const saved = localStorage.getItem('hirevid_candidates');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [jobs, setJobsState] = useState(() => {
    const savedSession = localStorage.getItem('hirevid_currentUser');
    if (savedSession) {
      const u = JSON.parse(savedSession);
      if (u.role === 'recruiter' && u.email !== 'recruiter@vividai.com') {
        // Real production recruiters start fresh with no jobs posted yet
        return [];
      }
    }
    return MOCK_JOBS;
  });

  const [interviews, setInterviews] = useState(() => {
    const savedSession = localStorage.getItem('hirevid_currentUser');
    if (savedSession) {
      const u = JSON.parse(savedSession);
      if (u.email !== 'sarah.j@devmail.com' && u.email !== 'recruiter@vividai.com') {
        // Real production users start fresh
        return [];
      }
    }
    const saved = localStorage.getItem('hirevid_interviews');
    return saved ? JSON.parse(saved) : INITIAL_INTERVIEWS;
  });

  // Track active logged-in candidate (simulating 'cand-1' Sarah Jenkins or a new builder)
  const [currentCandidateId, setCurrentCandidateId] = useState(() => {
    const savedSession = localStorage.getItem('hirevid_currentUser');
    if (savedSession) {
      const u = JSON.parse(savedSession);
      if (u.role === 'candidate') {
        return u.id;
      }
    }
    return 'cand-1';
  });

  // Active view tabs for Candidate or Recruiter workspaces
  const [candidateActiveTab, setCandidateActiveTab] = useState('dashboard'); // 'dashboard', 'kyc', 'profile', 'video', 'jobs', 'tracker'
  const [recruiterActiveTab, setRecruiterActiveTab] = useState('pipeline'); // 'pipeline', 'search', 'scheduler', 'chats', 'profile'

  const handleSignInSession = async (user) => {
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !dbUser) {
        console.error("Failed to fetch user profile:", dbError);
        return;
      }

      let companyName = '';
      if (dbUser.role === 'recruiter') {
        const { data: comp } = await supabase
          .from('companies')
          .select('company_name')
          .eq('recruiter_id', user.id)
          .maybeSingle();
        companyName = comp?.company_name || '';
      }

      const sessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        company: companyName
      };

      setCurrentUser(sessionUser);
      if (dbUser.role === 'candidate') {
        setCurrentCandidateId(dbUser.id);
      }
      setView(dbUser.role);
    } catch (err) {
      console.error("Error in handleSignInSession:", err);
    }
  };

  const handleDemoModeLogin = (role) => {
    const mockUser = role === 'candidate'
      ? { 
          id: 'cand-1', 
          name: 'Sarah Jenkins', 
          email: 'sarah.j@devmail.com', 
          role: 'candidate', 
          company: '', 
          isDemo: true 
        }
      : { 
          id: 'recruiter-demo', 
          name: 'LTI Mindtree Team', 
          email: 'recruiter@ltimindtree.com', 
          role: 'recruiter', 
          company: 'LTI Mindtree', 
          isDemo: true 
        };

    setCurrentCandidateId('cand-1');
    setCurrentUser(mockUser);
    localStorage.setItem('hirevid_currentUser', JSON.stringify(mockUser));
    localStorage.setItem('hirevid_view', role);
    setView(role);
    setShowDemoModal(false);
  };

  // Load from Supabase and listen to auth changes on mount
  useEffect(() => {
    if (!supabase) return;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // Guard against racing and overwriting recovery view
        const isRecovery = window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery');
        
        if (session?.user) {
          if (isRecovery) {
            setView('resetPassword');
          } else {
            await handleSignInSession(session.user);
          }
        } else {
          const currentUserSaved = localStorage.getItem('hirevid_currentUser');
          if (!currentUserSaved) {
            if (!isRecovery) {
              setCurrentUser(null);
              setView('landing');
            }
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkSession();

    // Detect Supabase password-reset callback in URL hash
    const hash = window.location.hash;
    const isRecoveryMode = hash && hash.includes('type=recovery');
    if (isRecoveryMode) {
      setView('resetPassword');
      // Clean the hash from URL without reload after a short delay so Supabase client captures it
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 2500);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      
      const isRecovery = window.location.hash.includes('type=recovery') || 
                         window.location.href.includes('type=recovery') ||
                         event === 'PASSWORD_RECOVERY';

      if (session?.user) {
        if (isRecovery) {
          setView('resetPassword');
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Escape the callstack using setTimeout to prevent internal SDK auth deadlocks
          setTimeout(async () => {
            await handleSignInSession(session.user);
          }, 0);
        }
      } else {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setView('login');
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadSupabaseData = async () => {
    try {
      if (currentUser?.isDemo) {
        setJobsState(MOCK_JOBS);
        setCandidates(INITIAL_CANDIDATES);
        setInterviews(INITIAL_INTERVIEWS);
        return;
      }
      const isRealUser = currentUser && currentUser.email !== 'sarah.j@devmail.com' && currentUser.email !== 'recruiter@vividai.com';

      // 1. Fetch Jobs from Supabase
      const { data: dbJobs, error: jobsError } = await supabase.from('jobs').select('*');
      if (jobsError) console.error("Error loading jobs:", jobsError);
      else if (dbJobs && dbJobs.length > 0) {
        const uiJobs = dbJobs.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          logo: j.logo || '✨',
          location: j.location,
          salary: j.salary,
          type: j.type,
          skills: j.skills || [],
          description: j.description
        }));
        setJobsState(uiJobs);
      } else {
        if (isRealUser && currentUser?.role === 'recruiter') {
          // Real recruiter starts fresh with no jobs posted yet
          setJobsState([]);
        } else {
          // Seed default jobs if empty for demo or real candidates so the directory is populated
          const { error: seedError } = await supabase.from('jobs').insert(
            MOCK_JOBS.map(j => ({
              id: j.id,
              title: j.title,
              company: j.company,
              logo: j.logo,
              location: j.location,
              salary: j.salary,
              type: j.type,
              skills: j.skills,
              description: j.description
            }))
          );
          if (!seedError) {
            setJobsState(MOCK_JOBS);
          } else {
            console.error("Seeding jobs failed, falling back to local MOCK_JOBS:", seedError);
            setJobsState(MOCK_JOBS);
          }
        }
      }

      // 2. Fetch Candidates and Applications
      const { data: dbUsers, error: usersError } = await supabase.from('users').select('*');
      const { data: dbProfiles, error: profilesError } = await supabase.from('candidate_profiles').select('*');
      const { data: dbApps, error: appsError } = await supabase.from('applications').select('*');
      
      if (usersError) console.error("Error loading users:", usersError);
      if (profilesError) console.error("Error loading profiles:", profilesError);
      if (appsError) console.error("Error loading applications:", appsError);

      if (dbUsers && dbUsers.length > 0) {
        const candidateUsers = dbUsers.filter(u => u.role === 'candidate');
        const mappedCandidates = candidateUsers.map(user => {
          const profile = dbProfiles ? dbProfiles.find(p => p.user_id === user.id) : null;
          const profileApps = dbApps ? dbApps.filter(a => a.candidate_id === user.id) : [];
          return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            title: profile?.title || 'Software Engineer Portfolio',
            location: profile?.location || 'Remote',
            avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
            skills: profile?.skills || ['React', 'JavaScript', 'HTML5', 'CSS3'],
            bio: profile?.bio || 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.',
            kycStatus: profile?.kyc_status || 'Pending',
            pdfResumeName: profile?.pdf_resume_name || '',
            pdfResumeUrl: profile?.pdf_url || profile?.pdf_resume_url || '',
            videoResumeUrl: profile?.video_url || profile?.video_resume_url || '',
            videoDuration: profile?.video_duration || '0:00',
            appliedJobs: profileApps.map(a => a.job_id),
            status: profileApps.length > 0 ? profileApps[0].status : (profile?.status || 'Screened'),
            aiMatchScore: profileApps.length > 0 ? profileApps[0].ai_match_score : (profile?.ai_match_score || 60),
            chatHistory: profileApps.length > 0 ? (profileApps[0].chat_history || []) : [],
            experience: profile?.experience || '',
            education: profile?.education || '',
            videoLanguage: profile?.video_language || 'English'
          };
        });

        if (mappedCandidates.length > 0) {
          setCandidates(mappedCandidates);
        } else {
          setCandidates(isRealUser ? [] : INITIAL_CANDIDATES);
        }
      } else {
        setCandidates(isRealUser ? [] : INITIAL_CANDIDATES);
      }

      // 3. Fetch Interviews
      const { data: dbInterviews, error: interviewsError } = await supabase.from('interviews').select('*');
      if (interviewsError) console.error("Error loading interviews:", interviewsError);
      else if (dbInterviews && dbInterviews.length > 0) {
        const uiInterviews = dbInterviews.map(i => ({
          id: i.id,
          candidateId: i.candidate_id,
          candidateName: i.candidate_name,
          role: i.role,
          date: i.date,
          time: i.time,
          platform: i.platform,
          status: i.status || 'Confirmed'
        }));
        setInterviews(uiInterviews);
      } else {
        setInterviews(isRealUser ? [] : INITIAL_INTERVIEWS);
      }

    } catch (err) {
      console.error("Failed to load Supabase data:", err);
    }
  };

  // Global Sync
  useEffect(() => {
    localStorage.setItem('hirevid_view', view);
  }, [view]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hirevid_currentUser', JSON.stringify(currentUser));
      if (supabase) {
        loadSupabaseData();
      }
    } else {
      localStorage.removeItem('hirevid_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hirevid_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('hirevid_interviews', JSON.stringify(interviews));
  }, [interviews]);

  // Helper callbacks
  const updateCandidateStatus = async (candidateId, newStatus) => {
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        return { ...cand, status: newStatus };
      }
      return cand;
    }));

    if (supabase) {
      try {
        await supabase.from('candidate_profiles').update({ status: newStatus }).eq('user_id', candidateId);
        await supabase.from('applications').update({ status: newStatus }).eq('candidate_id', candidateId);
      } catch (err) {
        console.error("Failed to sync candidate status to Supabase:", err);
      }
    }
  };

  const handleApplyJob = async (candidateId, jobId) => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) return;
    if (cand.appliedJobs.includes(jobId)) return;

    const targetJob = jobs.find(j => j.id === jobId);
    let matchScore = 50;
    if (targetJob) {
      const matchingSkills = cand.skills.filter(s => 
        targetJob.skills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
      );
      matchScore = Math.min(100, 50 + Math.round((matchingSkills.length / targetJob.skills.length) * 50));
    }

    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          appliedJobs: [...c.appliedJobs, jobId],
          aiMatchScore: matchScore,
          status: 'Screened'
        };
      }
      return c;
    }));

    if (supabase) {
      try {
        await supabase.from('applications').insert({
          candidate_id: candidateId,
          job_id: jobId,
          status: 'Screened',
          ai_match_score: matchScore,
          chat_history: []
        });
      } catch (err) {
        console.error("Failed to apply job in Supabase:", err);
      }
    }
  };

  const handleUpdateCandidateProfile = async (candidateId, updatedProfile) => {
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        let matchScore = cand.aiMatchScore;
        const finalSkills = updatedProfile.skills || cand.skills;
        if (cand.appliedJobs.length > 0) {
          const firstAppliedJob = jobs.find(j => j.id === cand.appliedJobs[0]);
          if (firstAppliedJob) {
            const matchingSkills = finalSkills.filter(s => 
              firstAppliedJob.skills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
            );
            matchScore = Math.min(100, 50 + Math.round((matchingSkills.length / firstAppliedJob.skills.length) * 50));
          }
        }
        return { ...cand, ...updatedProfile, aiMatchScore: matchScore };
      }
      return cand;
    }));

    if (supabase) {
      try {
        if (updatedProfile.name !== undefined) {
          await supabase.from('users').update({ name: updatedProfile.name }).eq('id', candidateId);
        }

        const dbFields = {};
        if (updatedProfile.title !== undefined) dbFields.title = updatedProfile.title;
        if (updatedProfile.location !== undefined) dbFields.location = updatedProfile.location;
        if (updatedProfile.bio !== undefined) dbFields.bio = updatedProfile.bio;
        if (updatedProfile.skills !== undefined) dbFields.skills = updatedProfile.skills;
        if (updatedProfile.kycStatus !== undefined) dbFields.kyc_status = updatedProfile.kycStatus;
        if (updatedProfile.pdfResumeName !== undefined) dbFields.pdf_resume_name = updatedProfile.pdfResumeName;
        
        if (updatedProfile.pdfResumeUrl !== undefined) {
          dbFields.pdf_url = updatedProfile.pdfResumeUrl;
          dbFields.pdf_resume_url = updatedProfile.pdfResumeUrl;
        }
        if (updatedProfile.videoResumeUrl !== undefined) {
          dbFields.video_url = updatedProfile.videoResumeUrl;
          dbFields.video_resume_url = updatedProfile.videoResumeUrl;
        }
        
        if (updatedProfile.videoDuration !== undefined) dbFields.video_duration = updatedProfile.videoDuration;
        if (updatedProfile.experience !== undefined) dbFields.experience = updatedProfile.experience;
        if (updatedProfile.education !== undefined) dbFields.education = updatedProfile.education;
        if (updatedProfile.videoLanguage !== undefined) dbFields.video_language = updatedProfile.videoLanguage;

        if (Object.keys(dbFields).length > 0) {
          await supabase.from('candidate_profiles').upsert({
            user_id: candidateId,
            ...dbFields
          });
        }
      } catch (err) {
        console.error("Failed to update candidate profile in Supabase:", err);
      }
    }
  };

  const handleScheduleInterview = async (newInterview) => {
    setInterviews(prev => [...prev, newInterview]);
    updateCandidateStatus(newInterview.candidateId, 'Interview Scheduled');

    if (supabase) {
      try {
        await supabase.from('interviews').insert({
          id: newInterview.id,
          candidate_id: newInterview.candidateId,
          candidate_name: newInterview.candidateName,
          role: newInterview.role,
          date: newInterview.date,
          time: newInterview.time,
          platform: newInterview.platform,
          status: newInterview.status || 'Confirmed'
        });
      } catch (err) {
        console.error("Failed to schedule interview in Supabase:", err);
      }
    }
  };

  const generateSmartMockReply = (cand, text) => {
    const query = text.toLowerCase();
    const firstSkill = cand.skills && cand.skills.length > 0 ? cand.skills[0] : 'React';
    const secondSkill = cand.skills && cand.skills.length > 1 ? cand.skills[1] : 'TypeScript';
    
    if (query.includes('time') || query.includes('schedule') || query.includes('interview') || query.includes('calendar') || query.includes('meet') || query.includes('slot') || query.includes('when')) {
      return `That sounds great! I'm completely open this week. Let me know what slot works best on your calendar, and I'll make sure to sync my schedule!`;
    }
    if (query.includes('salary') || query.includes('compensation') || query.includes('pay') || query.includes('package') || query.includes('expectation') || query.includes('offer')) {
      return `Regarding compensation, I'm open to market rates and flexible depending on the full package (benefits, remote balance). The numbers specified in your job details fit my requirements nicely.`;
    }
    if (query.includes('experience') || query.includes('how long') || query.includes('years') || query.includes('project') || query.includes('past')) {
      return `I have spent substantial time working with ${firstSkill} and ${secondSkill}. I recently completed a project focusing on robust component architectures and scalability. I would love to tell you more about it!`;
    }
    if (query.includes('skill') || query.includes('stack') || query.includes('tech') || query.includes('tool') || query.includes('use')) {
      return `My main stack focuses heavily on ${cand.skills.slice(0, 3).join(', ')}. I am highly proficient in these tools and always eager to learn and adapt to new engineering patterns.`;
    }
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('greet')) {
      return `Hello! Thanks for reaching out. I'm really excited about the opportunity at your company and would love to chat more about how my background in ${cand.title || 'software engineering'} matches your goals.`;
    }
    
    return `Hi! Thank you for the message. I'm really looking forward to sharing my background as a ${cand.title || 'developer'}, showing my programming practices, and speaking with your team!`;
  };

  const generateRecruiterMockReply = (cand, text) => {
    const query = text.toLowerCase();
    if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('greet')) {
      return `Hi ${cand.name}! Great to hear from you. I was just reviewing your video resume and skills portfolio. How is your week going? Let's connect!`;
    }
    if (query.includes('schedule') || query.includes('interview') || query.includes('calendar') || query.includes('time') || query.includes('meet') || query.includes('slot') || query.includes('when')) {
      return `I would love to schedule a dynamic split-screen call! You can choose any of my active available slots directly using the schedule card, or propose a time and I will confirm it.`;
    }
    if (query.includes('salary') || query.includes('compensation') || query.includes('pay') || query.includes('package')) {
      return `Our compensation is highly competitive and fully aligned with the job details listed. I'd be happy to outline the full salary plus equity and benefits parameters on our upcoming chat.`;
    }
    if (query.includes('status') || query.includes('progress') || query.includes('applied') || query.includes('track')) {
      return `Your application is currently at the ${cand.status} stage. We are moving quickly, so booking a sync session with me will immediately advance your track.`;
    }
    return `Thanks for the message, ${cand.name}! I really appreciate your proactive approach. Let me know when you would like to hop on a call to talk about your engineering profile!`;
  };

  const handleSendChatMessage = async (candidateId, text, sender = 'recruiter') => {
    let updatedHistory = [];
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        const newMsg = { sender, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        updatedHistory = [...cand.chatHistory, newMsg];
        return { ...cand, chatHistory: updatedHistory };
      }
      return cand;
    }));

    if (supabase) {
      try {
        await supabase.from('applications').update({ chat_history: updatedHistory }).eq('candidate_id', candidateId);
      } catch (err) {
        console.error("Failed to sync chat history to Supabase:", err);
      }
    }

    if (sender === 'recruiter') {
      setTimeout(async () => {
        const cand = candidates.find(c => c.id === candidateId);
        if (!cand) return;

        let responseText = "";
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
          try {
            const prompt = `You are playing the role of a job applicant named ${cand.name} who is applying for a job.
Your headline/title is: ${cand.title}.
Your location is: ${cand.location}.
Your biography is: "${cand.bio}".
Your skills are: ${cand.skills.join(', ')}.

A recruiter has sent you this message:
"${text}"

Please write a highly professional, natural, and realistic candidate response to this message. Keep it conversational, warm, and highly relevant. Do NOT say you are an AI. Write ONLY the message content, keeping it concise (1 to 3 sentences max).`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
            });

            const resData = await response.json();
            if (resData && resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0].text) {
              responseText = resData.candidates[0].content.parts[0].text.trim();
            } else {
              throw new Error("Invalid response format from Gemini API");
            }
          } catch (err) {
            console.error("Gemini API call failed, falling back to smart client-side responder:", err);
            responseText = generateSmartMockReply(cand, text);
          }
        } else {
          responseText = generateSmartMockReply(cand, text);
        }

        const replyMsg = { 
          sender: 'candidate', 
          text: responseText, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };

        setCandidates(prev => prev.map(c => {
          if (c.id === candidateId) {
            const finalHistory = [...c.chatHistory, replyMsg];
            if (supabase) {
              supabase.from('applications').update({ chat_history: finalHistory }).eq('candidate_id', candidateId)
                .then(({ error }) => { if (error) console.error("Error saving auto chat:", error); });
            }
            return { ...c, chatHistory: finalHistory };
          }
          return c;
        }));
      }, 1500);
    } else if (sender === 'candidate') {
      setTimeout(async () => {
        const cand = candidates.find(c => c.id === candidateId);
        if (!cand) return;

        let responseText = "";
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
          try {
            const prompt = `You are playing the role of an enthusiastic recruiter named Priya Mehta, HR Lead at Infosys.
A candidate named ${cand.name} who is applying for a job (Headline: ${cand.title}, Bio: "${cand.bio}", Skills: ${cand.skills.join(', ')}, Current Stage: ${cand.status}) has sent you this message:
"${text}"

Please write a highly professional, polite, and encouraging recruiter response. If they are talking about scheduling or timing, mention booking an interview or connecting. Keep it conversational, warm, and highly relevant. Do NOT say you are an AI. Write ONLY the message content, keeping it concise (1 to 3 sentences max).`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
            });

            const resData = await response.json();
            if (resData && resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0].text) {
              responseText = resData.candidates[0].content.parts[0].text.trim();
            } else {
              throw new Error("Invalid response format from Gemini API");
            }
          } catch (err) {
            console.error("Gemini API call failed, falling back to smart recruiter mock reply:", err);
            responseText = generateRecruiterMockReply(cand, text);
          }
        } else {
          responseText = generateRecruiterMockReply(cand, text);
        }

        const replyMsg = { 
          sender: 'recruiter', 
          text: responseText, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };

        setCandidates(prev => prev.map(c => {
          if (c.id === candidateId) {
            const finalHistory = [...c.chatHistory, replyMsg];
            if (supabase) {
              supabase.from('applications').update({ chat_history: finalHistory }).eq('candidate_id', candidateId)
                .then(({ error }) => { if (error) console.error("Error saving auto chat:", error); });
            }
            return { ...c, chatHistory: finalHistory };
          }
          return c;
        }));
      }, 1500);
    }
  };

  const handleNavClick = (targetId) => {
    if (view !== 'landing') {
      setView('landing');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = async () => {
    // Immediately clear view so the dashboard unmounts at once
    setCurrentUser(null);
    setView('login');
    localStorage.removeItem('hirevid_currentUser');
    localStorage.removeItem('hirevid_view');   // ← was persisting 'recruiter', causing re-redirect on refresh
    window.scrollTo({ top: 0, behavior: 'instant' });
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Supabase signOut error:", err);
    }
  };

  const activeCandidate = candidates.find(c => c.id === currentCandidateId) || (() => {
    const isRealUser = currentUser && currentUser.email !== 'sarah.j@devmail.com' && currentUser.email !== 'recruiter@vividai.com';
    if (isRealUser && currentUser.role === 'candidate') {
      return {
        id: currentCandidateId,
        name: currentUser.name || 'New Candidate',
        email: currentUser.email || '',
        title: 'Software Engineer Portfolio',
        location: 'Remote',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
        skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
        bio: 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.',
        kycStatus: 'Pending',
        pdfResumeName: '',
        videoResumeUrl: '',
        videoDuration: '0:00',
        appliedJobs: [],
        status: 'Screened',
        aiMatchScore: 60,
        chatHistory: [],
        experience: '',
        education: ''
      };
    }
    return candidates[0] || INITIAL_CANDIDATES[0];
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[#050816] text-[#F1F5F9] font-sans antialiased scroll-smooth">
      {/* SECTION 1 - NAVBAR (sticky top / visible only when logged out) */}
      {!['candidate', 'recruiter'].includes(view) && (
        <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#050816]/97 backdrop-blur-[12px] border-b border-white/[0.07] py-4 px-6 md:px-8 flex justify-between items-center shadow-lg transition-all duration-200">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#F1F5F9] font-syne">
                HireVid AI
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-[#475569] font-semibold block leading-none mt-0.5">
                VIDEO-FIRST HIRING PLATFORM
              </span>
            </div>
          </div>

          {/* Middle Navigation (hidden on mobile, visible on desktop) */}
          {['landing', 'login', 'signup'].includes(view) && (
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-[#94A3B8] font-sans">
              <button 
                onClick={() => handleNavClick('how-it-works')}
                className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                How It Works
              </button>
              <button 
                onClick={() => handleNavClick('features')}
                className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick('testimonials')}
                className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                Testimonials
              </button>
              <button 
                onClick={() => handleNavClick('for-candidates')}
                className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                For Candidates
              </button>
              <button 
                onClick={() => handleNavClick('for-recruiters')}
                className="hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 transform"
              >
                For Recruiters
              </button>
            </nav>
          )}

          {/* Logged-in user info — removed and kept on the left sidebar instead! */}
          {currentUser ? null : (
            /* Login/Signup Nav indicators if logged out */
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDemoModal(true)}
                className="px-4 py-2 bg-purple-600/10 border border-purple-500/30 text-purple-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md shadow-purple-500/5 cursor-pointer"
              >
                Try Demo &rarr;
              </button>
              <button 
                onClick={() => {
                  setAuthFormRole('candidate');
                  setView('login');
                }}
                className="text-xs font-bold text-[#94A3B8] hover:text-white transition-all px-3.5 py-2 bg-transparent rounded-lg hover:scale-95 active:scale-90 duration-200"
              >
                Log In
              </button>
              <button 
                onClick={() => {
                  setAuthFormRole('candidate');
                  setView('signup');
                }}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] transform active:scale-95 transition-all duration-200 shadow-md shadow-purple-500/10"
              >
                Sign Up
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main Body Layout with dynamic header padding offset */}
      <main className={`flex-1 flex flex-col ${['candidate', 'recruiter'].includes(view) ? 'pt-0' : 'pt-[72px]'}`}>
        
        {/* Render split screen Auth System if active */}
        {(view === 'login' || view === 'signup' || view === 'resetPassword') && (
          <AuthScreen 
            view={view}
            setView={setView}
            users={users}
            setUsers={setUsers}
            setCurrentUser={setCurrentUser}
            initialRole={authFormRole}
            setInitialRole={setAuthFormRole}
            candidates={candidates}
            setCandidates={setCandidates}
            setCurrentCandidateId={setCurrentCandidateId}
          />
        )}

        {/* Landing Home Page */}
        {view === 'landing' && (
          <div className="flex-1 flex flex-col items-center relative w-full scroll-smooth">
            
            {/* Ambient Background Glow elements */}
            <div className="absolute top-[8%] left-[50%] -translate-x-[50%] w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none -z-10"></div>
            <div className="absolute top-[30%] left-[5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            {/* SECTION 2 - HERO (centered, padding 100px top) */}
            <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-[100px] pb-16 px-6 relative z-10">
              <h2 className="text-5xl md:text-[64px] font-black font-jakarta tracking-tight mb-4 leading-[1.1] text-[#F1F5F9] max-w-4xl">
                Resumes tell your history.
              </h2>
              <h2 className="text-5xl md:text-[64px] font-black font-jakarta tracking-tight mb-8 leading-[1.1] bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent max-w-4xl">
                Videos show your talent.
              </h2>

              <p className="text-[#94A3B8] text-[16px] max-w-[600px] mx-auto mb-10 leading-[1.9] font-sans font-normal">
                Traditional flat PDF resumes fail to represent communication skills, confidence, and real engineering persona. HireVid AI introduces video screening, KYC validation, live split-screen interviews, and automated AI skill matching in one immersive enterprise hiring suite.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    setAuthFormRole('candidate');
                    setView('signup');
                  }}
                  className="px-7 py-3.5 bg-gradient-to-r from-purple-600 to-blue-500 text-[#050816] font-bold rounded-[10px] text-[14px] uppercase tracking-wider hover:opacity-90 hover:-translate-y-[1px] shadow-lg shadow-purple-500/10 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Record Your Resume →
                </button>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="px-7 py-3.5 bg-purple-600/10 border border-purple-500/30 text-purple-300 font-bold rounded-[10px] text-[14px] uppercase tracking-wider hover:bg-purple-600/20 hover:-translate-y-[1px] active:scale-95 transition-all duration-200 cursor-pointer shadow-md shadow-purple-500/5"
                >
                  Try Demo &rarr;
                </button>
                <button 
                  onClick={() => {
                    setAuthFormRole('recruiter');
                    setView('signup');
                  }}
                  className="px-7 py-3.5 bg-transparent border border-white/20 hover:border-white text-white font-bold rounded-[10px] text-[14px] uppercase tracking-wider hover:bg-white/5 hover:-translate-y-[1px] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Post a Job
                </button>
              </div>
            </section>

            {/* SECTION 3 - STATS BAR */}
            <section className="w-full bg-[#0B1020] border-y border-white/[0.07] py-[32px] px-6 relative z-10">
              <div className="w-full max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-y-6 gap-x-[80px]">
                {[
                  { count: candidatesCount.toLocaleString(), suffix: '+', label: 'Candidates' },
                  { count: companiesCount, suffix: '+', label: 'Companies Hiring' },
                  { count: accuracyCount, suffix: '%', label: 'AI Match Accuracy' },
                  { count: speedCount, suffix: '×', label: 'Faster Hiring' }
                ].map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left min-w-[140px]">
                    <span className="text-4xl md:text-5xl font-extrabold font-jakarta bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block leading-tight">
                      {stat.count}{stat.suffix}
                    </span>
                    <span className="text-[12px] uppercase tracking-wider text-[#475569] font-bold mt-1 font-sans">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4 - FOR WHO (2 cards) */}
            <section className="w-full max-w-5xl py-[80px] px-6 relative z-10 flex flex-col items-center">
              <h3 className="text-3xl md:text-[36px] font-bold font-jakarta text-center text-white mb-[40px] tracking-tight">
                Built for two sides of hiring
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] w-full max-w-[900px] mx-auto">
                
                {/* Card 1 - Job Seekers */}
                <div 
                  id="for-candidates"
                  onClick={() => {
                    setAuthFormRole('candidate');
                    setView('signup');
                  }}
                  className="group relative bg-[#0B1020] border border-white/[0.07] rounded-2xl p-[28px] cursor-pointer text-left transition-all duration-300 hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-600/5 to-transparent rounded-bl-3xl -z-10"></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-purple-300">
                        Candidate
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xl font-bold font-jakarta text-white mb-2 leading-snug">
                    For Job Seekers
                  </h4>
                  <p className="text-[#94A3B8] text-xs md:text-sm leading-relaxed mb-6 font-sans">
                    Build a rich skills portfolio, verify your identity with biometric KYC scanner, record highly impressive video resumes with smart teleprompters, and auto-match with top jobs.
                  </p>
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs uppercase tracking-wider group-hover:text-purple-300 transition-colors">
                    Build your Video Profile &rarr;
                  </div>
                </div>

                {/* Card 2 - Hiring Teams */}
                <div 
                  id="for-recruiters"
                  onClick={() => {
                    setAuthFormRole('recruiter');
                    setView('signup');
                  }}
                  className="group relative bg-[#0B1020] border border-white/[0.07] rounded-2xl p-[28px] cursor-pointer text-left transition-all duration-300 hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-600/5 to-transparent rounded-bl-3xl -z-10"></div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-300">
                        Recruiter
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xl font-bold font-jakarta text-white mb-2 leading-snug">
                    For Hiring Teams
                  </h4>
                  <p className="text-[#94A3B8] text-xs md:text-sm leading-relaxed mb-6 font-sans">
                    Search candidate databases with AI match ratings, track candidates via drag-and-drop Kanban pipeline boards, schedule with Google sync, and join simulated split-screen video interviews.
                  </p>
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider group-hover:text-blue-300 transition-colors">
                    Open Recruiter Dashboard &rarr;
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 5 - HOW IT WORKS */}
            <section id="how-it-works" className="w-full bg-[#0B1020] py-[80px] px-6 md:px-12 relative z-10 flex flex-col items-center">
              <div className="w-full max-w-5xl text-center md:text-left mb-[40px]">
                <span className="text-[#10B981] text-[11px] font-black tracking-widest uppercase block mb-2 font-jakarta">
                  HOW IT WORKS
                </span>
                <h3 className="text-3xl md:text-[42px] font-extrabold font-jakarta text-white tracking-tight leading-tight">
                  Three steps. One hire.
                </h3>
              </div>

              {/* 3 column grid with thin lines separator */}
              <div className="w-full max-w-5xl bg-white/[0.07] grid grid-cols-1 md:grid-cols-3 gap-[1px] rounded-2xl overflow-hidden shadow-xl">
                {[
                  {
                    num: '01',
                    title: 'Record Your Video Resume',
                    desc: '60 seconds. Show your personality, skills, and confidence directly in the browser. No equipment needed.'
                  },
                  {
                    num: '02',
                    title: 'AI Matches You Instantly',
                    desc: 'Groq AI compares your skills to job descriptions and gives you a real match score out of 100. No guessing.'
                  },
                  {
                    num: '03',
                    title: 'Get Hired Faster',
                    desc: 'Recruiters watch your video, shortlist you, and move you through the pipeline — everything in one place.'
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#050816] hover:bg-[#0B1020] p-9 transition-colors duration-200 flex flex-col min-h-[250px] justify-between relative group"
                  >
                    <div>
                      <span className="text-[56px] font-black font-jakarta block mb-2 transition-all leading-none" style={{ color: 'rgba(255,255,255,0.28)' }}>
                        {item.num}
                      </span>
                      <h4 className="text-base font-bold text-white mb-2 font-jakarta leading-snug">{item.title}</h4>
                      <p className="text-[#94A3B8] text-xs leading-relaxed font-sans">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6 - FEATURES GRID */}
            <section id="features" className="w-full max-w-5xl py-[80px] px-6 md:px-12 relative z-10 flex flex-col items-center">
              <div className="text-center mb-12">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent text-[11px] font-black tracking-widest uppercase block mb-2 font-jakarta">
                  FEATURES
                </span>
                <h3 className="text-3xl md:text-[38px] font-extrabold font-jakarta text-white tracking-tight leading-tight">
                  Everything you need to hire smarter
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-[1100px] mx-auto">
                {[
                  {
                    icon: '🎥',
                    title: 'Video Resume Recording',
                    desc: 'Record directly in browser with built-in teleprompter and audio wave indicator'
                  },
                  {
                    icon: '🤖',
                    title: 'AI Match Score',
                    desc: 'Groq AI scores candidate vs job description out of 100 with breakdown insights'
                  },
                  {
                    icon: '🪪',
                    title: 'KYC Verification',
                    desc: 'Biometric identity verification with facial recognition and document validation'
                  },
                  {
                    icon: '📋',
                    title: 'Hiring Pipeline Kanban',
                    desc: 'Drag and drop candidates across 5 stages. Changes sync to candidate dashboard instantly'
                  },
                  {
                    icon: '📅',
                    title: 'Interview Scheduler',
                    desc: 'Schedule virtual interviews with calendar sync and automated confirmation emails'
                  },
                  {
                    icon: '💬',
                    title: 'Talent Chat',
                    desc: 'Direct recruiter to candidate messaging with intelligent auto-reply suggestions'
                  }
                ].map((feat, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setAuthFormRole('candidate');
                      setView('signup');
                    }}
                    className="group bg-[#0B1020] border border-white/[0.07] rounded-2xl p-6 cursor-pointer hover:border-purple-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white text-lg mb-4 shrink-0 shadow-md">
                        {feat.icon}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2 font-jakarta leading-snug">{feat.title}</h4>
                      <p className="text-[#94A3B8] text-xs leading-relaxed font-sans">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 7 - TESTIMONIALS */}
            <section id="testimonials" className="w-full bg-[#0B1020] py-[80px] px-6 md:px-12 relative z-10 flex flex-col items-center">
              <div className="w-full max-w-5xl text-center md:text-left mb-12">
                <span className="text-[#F59E0B] text-[11px] font-black tracking-widest uppercase block mb-2 font-jakarta">
                  TESTIMONIALS
                </span>
                <h3 className="text-3xl md:text-[38px] font-extrabold font-jakarta text-white tracking-tight leading-tight">
                  Loved by candidates and recruiters
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl mx-auto">
                {[
                  {
                    quote: '"I uploaded my video resume on Monday and had 3 interview calls by Wednesday. This platform changed everything."',
                    name: 'Arjun Reddy',
                    role: 'Hired at TechCorp · Hyderabad',
                    initials: 'AR',
                    avatarBg: 'bg-purple-600'
                  },
                  {
                    quote: '"As a recruiter I evaluate 20 candidates in the time it used to take me to read 5 resumes. The AI match score is incredibly accurate."',
                    name: 'Priya Mehta',
                    role: 'HR Lead · Infosys',
                    initials: 'PM',
                    avatarBg: 'bg-blue-600'
                  },
                  {
                    quote: '"Finally a platform that shows WHO I am, not just what I have done on paper. I got hired in 4 days after uploading my video."',
                    name: 'Kavya Nair',
                    role: 'Software Engineer · Bangalore',
                    initials: 'KN',
                    avatarBg: 'bg-emerald-600'
                  }
                ].map((test, idx) => (
                  <div key={idx} className="bg-[#11182D] border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div>
                      <span className="text-5xl font-black font-jakarta bg-gradient-to-tr from-purple-500 to-blue-400 bg-clip-text text-transparent block -mb-4 opacity-30 select-none">
                        “
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed italic mb-6 font-sans relative z-10">
                        {test.quote}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${test.avatarBg} flex items-center justify-center shrink-0 shadow-md`}>
                        <span className="text-[10px] font-bold text-white uppercase font-jakarta">
                          {test.initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-white text-xs font-bold block leading-none font-jakarta">{test.name}</span>
                        <span className="text-slate-500 text-[10px] block mt-1 leading-none truncate font-sans">{test.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 8 - CTA */}
            <section className="w-[calc(100%-48px)] md:w-[calc(100%-80px)] max-w-5xl my-16 mx-6 md:mx-10 relative rounded-[20px] overflow-hidden shadow-2xl shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500"></div>
              {/* Decorative radial overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none"></div>

              <div className="relative z-10 px-8 py-12 md:py-16 flex flex-col lg:flex-row justify-between items-center gap-8 w-full max-w-4xl mx-auto">
                <div className="text-center lg:text-left">
                  <h3 className="text-3xl md:text-[40px] font-extrabold font-jakarta text-white tracking-tight leading-tight mb-2">
                    Ready to get hired faster?
                  </h3>
                  <p className="text-white/80 text-sm md:text-[15px] max-w-lg leading-relaxed font-sans">
                    Join 2,400+ candidates already using HireVid AI
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setAuthFormRole('candidate');
                      setView('signup');
                    }}
                    className="px-7 py-3.5 bg-[#050816] text-[#F1F5F9] font-bold rounded-[10px] text-[14px] uppercase tracking-wider shadow-xl hover:opacity-90 hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
                  >
                    Record Your Resume →
                  </button>
                  <button 
                    onClick={() => {
                      setAuthFormRole('recruiter');
                      setView('signup');
                    }}
                    className="px-7 py-3.5 bg-transparent border border-white/40 hover:bg-white/10 text-white font-bold rounded-[10px] text-[14px] uppercase tracking-wider hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
                  >
                    Post a Job
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 9 - FOOTER */}
            <footer className="w-full bg-[#0B1020] border-t border-white/[0.07] py-[48px] px-[40px] relative z-10">
              <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* Column 1 - Brand */}
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-extrabold font-jakarta text-[#F1F5F9] text-lg leading-none">
                      HireVid AI
                    </span>
                  </div>
                  <p className="text-[#475569] text-[13px] leading-relaxed font-sans max-w-xs">
                    The future of hiring is video. Show who you are, not just what you did.
                  </p>
                </div>

                {/* Column 2 - Candidates */}
                <div className="flex flex-col gap-3 text-left">
                  <h4 className="font-semibold text-[13px] text-[#F1F5F9] font-jakarta uppercase tracking-wider mb-1">
                    Candidates
                  </h4>
                  {[
                    { label: 'Record Video Resume', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Build Profile', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Find Jobs', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Track Applications', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'KYC Verification', action: () => { setAuthFormRole('candidate'); setView('signup'); } }
                  ].map((link, idx) => (
                    <button 
                      key={idx} 
                      onClick={link.action}
                      className="text-[#94A3B8] hover:text-white text-xs font-medium font-sans text-left transition-colors duration-200"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Column 3 - Recruiters */}
                <div className="flex flex-col gap-3 text-left">
                  <h4 className="font-semibold text-[13px] text-[#F1F5F9] font-jakarta uppercase tracking-wider mb-1">
                    Recruiters
                  </h4>
                  {[
                    { label: 'Post a Job', action: () => { setAuthFormRole('recruiter'); setView('signup'); } },
                    { label: 'Search Candidates', action: () => { setAuthFormRole('recruiter'); setView('signup'); } },
                    { label: 'Hiring Pipeline', action: () => { setAuthFormRole('recruiter'); setView('signup'); } },
                    { label: 'Interview Scheduler', action: () => { setAuthFormRole('recruiter'); setView('signup'); } },
                    { label: 'AI Match Insights', action: () => { setAuthFormRole('recruiter'); setView('signup'); } }
                  ].map((link, idx) => (
                    <button 
                      key={idx} 
                      onClick={link.action}
                      className="text-[#94A3B8] hover:text-white text-xs font-medium font-sans text-left transition-colors duration-200"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Column 4 - Company */}
                <div className="flex flex-col gap-3 text-left">
                  <h4 className="font-semibold text-[13px] text-[#F1F5F9] font-jakarta uppercase tracking-wider mb-1">
                    Company
                  </h4>
                  {[
                    { label: 'About HireVid AI', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Privacy Policy', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Terms of Service', action: () => { setAuthFormRole('candidate'); setView('signup'); } },
                    { label: 'Contact Us', action: () => { setAuthFormRole('candidate'); setView('signup'); } }
                  ].map((link, idx) => (
                    <button 
                      key={idx} 
                      onClick={link.action}
                      className="text-[#94A3B8] hover:text-white text-xs font-medium font-sans text-left transition-colors duration-200"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

              </div>
                      <div className="w-full max-w-5xl mx-auto border-t border-white/[0.07] mt-8 pt-5 text-center text-[12px] text-[#475569] font-sans font-medium">
                <span>© 2026 HireVid AI. All rights reserved.</span>
              </div>
            </footer>

          </div>
        )}

        {/* Dashboards - Candidate view */}
        {view === 'candidate' && (
          <ErrorBoundary>
            <CandidateWorkspace 
              activeTab={candidateActiveTab}
              setActiveTab={setCandidateActiveTab}
              activeCandidate={activeCandidate}
              jobs={jobs}
              onUpdateProfile={(updated) => handleUpdateCandidateProfile(currentCandidateId, updated)}
              onApplyJob={(jobId) => handleApplyJob(currentCandidateId, jobId)}
              onAddJobs={(newJobs) => setJobsState(prev => [...newJobs, ...prev])}
              onSendChatMessage={handleSendChatMessage}
              interviews={interviews}
              onScheduleInterview={handleScheduleInterview}
              onLogout={handleLogout}
            />
          </ErrorBoundary>
        )}

        {/* Dashboards - Recruiter view */}
        {view === 'recruiter' && (
          <ErrorBoundary>
            <RecruiterWorkspace 
              activeTab={recruiterActiveTab}
              setActiveTab={setRecruiterActiveTab}
              currentUser={currentUser}
              candidates={candidates}
              jobs={jobs}
              interviews={interviews}
              onUpdateCandidateStatus={updateCandidateStatus}
              onScheduleInterview={handleScheduleInterview}
              onSendChatMessage={handleSendChatMessage}
              onLogout={handleLogout}
            />
          </ErrorBoundary>
        )}

        {showDemoModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-card max-w-2xl w-full rounded-2xl border border-purple-500/30 p-8 shadow-2xl relative overflow-hidden">
              
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white font-jakarta">Explore Live Demo Workspaces</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto">Both dashboards are fully pre-built with real candidates, jobs, chat history, and AI scores. No signup needed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                
                {/* Candidate Demo Card */}
                <button
                  onClick={() => handleDemoModeLogin('candidate')}
                  className="flex flex-col gap-3 p-5 rounded-xl border border-purple-500/20 bg-[#050816] hover:bg-[#0B1020] hover:border-purple-500/50 text-left transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=48&h=48"
                      alt="Sarah Jenkins"
                      className="w-12 h-12 rounded-xl object-cover border border-purple-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">Sarah Jenkins</span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-purple-500/15 border border-purple-500/20 text-purple-300 font-bold rounded-full">Candidate</span>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5">Full Stack Engineer · New York, NY</p>
                    </div>
                  </div>

                  {/* Pre-built feature previews */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {[
                      { icon: '🎥', label: 'Video Resume' },
                      { icon: '✅', label: 'KYC Verified' },
                      { icon: '📄', label: '3 Applications' },
                      { icon: '🤖', label: 'AI Career Path' },
                      { icon: '📊', label: 'Skill Assessments' },
                      { icon: '🌐', label: 'Multilingual' },
                    ].map(f => (
                      <span key={f.label} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-semibold flex items-center gap-1">
                        {f.icon} {f.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-500">94% AI Match Score</span>
                    <span className="text-[10px] font-bold text-purple-400 group-hover:translate-x-0.5 transition-transform">Enter Dashboard →</span>
                  </div>
                </button>

                {/* Recruiter Demo Card */}
                <button
                  onClick={() => handleDemoModeLogin('recruiter')}
                  className="flex flex-col gap-3 p-5 rounded-xl border border-blue-500/20 bg-[#050816] hover:bg-[#0B1020] hover:border-blue-500/50 text-left transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-2xl border border-blue-500/30 shrink-0">
                      🏢
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">LTI Mindtree</span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 text-blue-300 font-bold rounded-full">Recruiter</span>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5">HR Lead: Priya Mehta · 3 Active Jobs</p>
                    </div>
                  </div>

                  {/* Kanban column previews */}
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[
                      { label: 'Screened', count: 1, color: 'bg-slate-500' },
                      { label: 'Shortlisted', count: 1, color: 'bg-amber-500' },
                      { label: 'Interview', count: 1, color: 'bg-blue-500' },
                      { label: 'Offered', count: 1, color: 'bg-emerald-500' },
                    ].map(col => (
                      <div key={col.label} className="flex flex-col items-center gap-0.5">
                        <div className={`w-full h-1.5 rounded-full ${col.color} opacity-70`} />
                        <span className="text-[8px] text-slate-500 font-bold">{col.label}</span>
                        <span className="text-[8px] font-black text-white">{col.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { icon: '📋', label: 'Kanban Pipeline' },
                      { icon: '🤖', label: 'AI Match Center' },
                      { icon: '🎥', label: 'Video Reviews' },
                      { icon: '📅', label: 'Interview Scheduler' },
                      { icon: '💬', label: 'Candidate Chat' },
                      { icon: '🏆', label: 'Rankings Board' },
                    ].map(f => (
                      <span key={f.label} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-semibold flex items-center gap-1">
                        {f.icon} {f.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-500">4 Candidates Pre-loaded</span>
                    <span className="text-[10px] font-bold text-blue-400 group-hover:translate-x-0.5 transition-transform">Enter Dashboard →</span>
                  </div>
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-600 mt-4 relative z-10">
                ✦ All data is pre-populated locally · No database calls · Instant access
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
