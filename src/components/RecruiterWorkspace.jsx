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
  Camera,
  Loader2,
  AlertCircle,
  Award,
  Cpu,
  LogOut,
  Menu
} from 'lucide-react';
import PipelineKanban from './PipelineKanban';
import AIMatchCenter from './features/AIMatchCenter';
import AIInterviewAssistant from './features/AIInterviewAssistant';
import CandidateRankings from './features/CandidateRankings';
import InterviewScheduler from './features/InterviewScheduler';
import VideoTranscription from './features/VideoTranscription';
import { RecruiterTranslationSummary } from './features/MultilingualSupport';
import Toast from './features/Toast';
import { supabase } from '../lib/supabaseClient';

export default function RecruiterWorkspace({
  activeTab,
  setActiveTab,
  currentUser: parentCurrentUser,
  candidates: parentCandidates,
  jobs: parentJobs,
  interviews: parentInterviews,
  onUpdateCandidateStatus,
  onScheduleInterview,
  onSendChatMessage,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState(50);
  
  // Mobile responsive sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real Supabase States
  const [dbUser, setDbUser] = useState(null);
  const [dbCompany, setDbCompany] = useState(null);
  const [localCandidates, setLocalCandidates] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);
  const [allCandidatesPool, setAllCandidatesPool] = useState([]);
  const [localInterviews, setLocalInterviews] = useState(parentInterviews || []);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Active detailed preview drawer
  const [activeCandId, setActiveCandId] = useState(null);
  
  // Interactive Chat State
  const [chatCandId, setChatCandId] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Scheduler Form
  const [scheduleNameId, setScheduleNameId] = useState('');
  const [scheduleJobId, setScheduleJobId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2026-05-28');
  const [scheduleTime, setScheduleTime] = useState('14:00');
  
  // Virtual Interview Simulation
  const [intCandId, setIntCandId] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(80);
  const [technicalScore, setTechnicalScore] = useState(80);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [candidateAnswerTranscript, setCandidateAnswerTranscript] = useState('');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  
  // Organization profile
  const [companyName, setCompanyName] = useState(parentCurrentUser?.company || 'VividAI Systems');
  const [companyWebsite, setCompanyWebsite] = useState('https://vividai.com');
  const [companyInfo, setCompanyInfo] = useState('Leading the future of multimodal search indexers and video resumes.');

  // Post Job Form state
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [jobLocationInput, setJobLocationInput] = useState('');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [jobSkillsInput, setJobSkillsInput] = useState('');
  const [postingJob, setPostingJob] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Webcam
  const recruiterVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);

  const SCREENING_QUESTIONS = [
    "Tell us about a highly complex technical layout you built using React and modern styled grids.",
    "How do you optimize asynchronous frame loading or real-time WebRTC connections?",
    "Explain how you manage state and cache parsed attributes in client browsers.",
    "What practices do you employ to build fully inclusive and highly responsive components?"
  ];

  // Helper for displaying notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ── DEMO DATA (instantly injected when isDemo flag is set) ──────────────
  const DEMO_CANDIDATES = [
    {
      id: 'cand-1', candidateId: 'cand-1',
      name: 'Sarah Jenkins', title: 'Full Stack Engineer',
      location: 'New York, NY', email: 'sarah.j@devmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Tailwind CSS', 'SQL'],
      bio: 'Passionate full-stack developer with 5+ years building scalable web solutions. Focused on pixel-perfect implementations, WebRTC streaming, and high-performance React patterns.',
      experience: '5 years', education: 'B.Tech Computer Science, IIT Delhi',
      linkedin: 'https://linkedin.com/in/sarahjenkins', github: 'https://github.com/sarahj',
      videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42280-large.mp4',
      pdfResumeUrl: '', pdfResumeName: 'sarah_jenkins_resume.pdf',
      videoTranscript: "Hi, I'm Sarah Jenkins, a Full Stack Engineer with 5 years of experience. I specialize in React, TypeScript, and Node.js. I've built real-time collaboration tools using WebRTC and optimized CI/CD pipelines for zero-downtime deployments.",
      videoLanguage: 'English',
      status: 'Shortlisted', aiMatchScore: 94,
      appliedJobs: ['demo-job-1'],
      chatHistory: [
        { sender: 'recruiter', text: 'Hi Sarah! Loved your video resume. The WebRTC segment was highly impressive.', timestamp: 'Yesterday, 4:15 PM' },
        { sender: 'candidate', text: 'Thank you so much! I built that to showcase optimized frame rendering. Happy to connect anytime!', timestamp: 'Yesterday, 4:32 PM' }
      ]
    },
    {
      id: 'cand-2', candidateId: 'cand-2',
      name: 'Alex Rivera', title: 'UI/UX Designer',
      location: 'San Francisco, CA', email: 'alex.design@creative.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
      skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'Adobe CC', 'CSS Grid'],
      bio: 'Product designer with 4 years translating complex workflows into human-centric software. Expert in multi-brand design systems and inclusive component libraries.',
      experience: '4 years', education: 'B.Des Industrial Design, NID Ahmedabad',
      videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-sitting-at-his-desk-and-smiling-at-camera-42284-large.mp4',
      pdfResumeUrl: '', pdfResumeName: 'alex_rivera_portfolio.pdf',
      videoTranscript: "Hello, I'm Alex Rivera. I design scalable design systems and conduct user research to craft intuitive, accessible interfaces. At my last role I built a Figma token library that reduced handoff time by 60%.",
      videoLanguage: 'English',
      status: 'Interview Scheduled', aiMatchScore: 89,
      appliedJobs: ['demo-job-2'],
      chatHistory: [
        { sender: 'recruiter', text: 'Alex, your portfolio has a great aesthetic sense. How familiar are you with design tokens in Figma?', timestamp: '2 days ago' },
        { sender: 'candidate', text: 'Thanks! I maintain token libraries using JSON structures that map directly to Tailwind configs!', timestamp: '2 days ago' }
      ]
    },
    {
      id: 'cand-3', candidateId: 'cand-3',
      name: 'David Kim', title: 'AI Engineering Lead',
      location: 'Seattle, WA', email: 'david.kim@neuralnext.net',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
      skills: ['Python', 'PyTorch', 'LLMs', 'Transformers', 'C++', 'Docker'],
      bio: 'Researcher and engineer specializing in optimizing neural networks and running large language models locally. Eager to bring deep intelligence systems to video analytics.',
      experience: '6 years', education: 'PhD AI/ML, Stanford University',
      videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-with-glasses-working-on-his-laptop-42282-large.mp4',
      pdfResumeUrl: '', pdfResumeName: 'david_kim_phd.pdf',
      videoTranscript: "I'm David Kim, an AI Engineering Lead. I fine-tune transformer models and build scalable ML inference pipelines. I recently deployed a RAG system with 40ms latency at 10K QPS using PyTorch and ONNX.",
      videoLanguage: 'English',
      status: 'Offered', aiMatchScore: 96,
      appliedJobs: ['demo-job-3'],
      chatHistory: [
        { sender: 'recruiter', text: 'David, we are ready to schedule your code evaluation session. Invite sent!', timestamp: '3 days ago' },
        { sender: 'candidate', text: 'Awesome! Looking forward to diving deep into the model metrics. Calendar synced!', timestamp: '3 days ago' }
      ]
    },
    {
      id: 'cand-4', candidateId: 'cand-4',
      name: 'Emily Chen', title: 'Mobile Developer (iOS/Android)',
      location: 'Austin, TX', email: 'emily.codes@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
      skills: ['Swift', 'Kotlin', 'React Native', 'Mobile UI', 'Git', 'Firebase'],
      bio: 'Mobile developer with a record of top-rated App Store launches. Enthusiastic about immersive video playback overlays and reactive gestures in native apps.',
      experience: '3 years', education: 'B.E. Electronics, BITS Pilani',
      videoResumeUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-laptop-and-smiling-at-camera-42285-large.mp4',
      pdfResumeUrl: '', pdfResumeName: 'emily_chen_mobile.pdf',
      videoTranscript: "Hi! I'm Emily Chen, a mobile developer specializing in iOS and Android. I've shipped 3 apps with over 100K downloads. I'm passionate about smooth animations and Firebase real-time integrations.",
      videoLanguage: 'English',
      status: 'Screened', aiMatchScore: 78,
      appliedJobs: ['demo-job-1'],
      chatHistory: []
    }
  ];

  const DEMO_JOBS = [
    { id: 'demo-job-1', title: 'Senior Frontend Engineer (React & WebRTC)', company: 'LTI Mindtree', logo: '🏢', location: 'Remote (India/US)', salary: '₹25-40 LPA', type: 'Full-time', skills: ['React', 'TypeScript', 'WebRTC', 'Node.js'], description: 'Build the future of our AI-powered video collaboration suite. Strong React and real-time streaming experience required.' },
    { id: 'demo-job-2', title: 'Senior Product Designer', company: 'LTI Mindtree', logo: '🏢', location: 'Bangalore (Hybrid)', salary: '₹18-28 LPA', type: 'Full-time', skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'], description: 'Design intuitive enterprise SaaS experiences. Figma design system expertise is a must.' },
    { id: 'demo-job-3', title: 'Generative AI & LLM Engineer', company: 'LTI Mindtree', logo: '🏢', location: 'Hyderabad', salary: '₹35-55 LPA', type: 'Full-time', skills: ['Python', 'PyTorch', 'LLMs', 'RAG', 'APIs'], description: 'Work on foundation model fine-tuning and multimodal video analytics. LLM production experience required.' }
  ];

  // Mount Loader for real Supabase data
  const loadData = async () => {
    // ── DEMO MODE: skip all Supabase calls, load prebuilt data instantly ──
    if (parentCurrentUser?.isDemo) {
      setLocalCandidates(DEMO_CANDIDATES);
      setAllCandidatesPool(DEMO_CANDIDATES);
      setLocalJobs(DEMO_JOBS);
      setLocalInterviews(parentInterviews || []);
      setCompanyName('LTI Mindtree');
      setCompanyWebsite('https://ltimindtree.com');
      setCompanyInfo('LTI Mindtree is a global technology consulting and digital solutions company that enables enterprises across industries to reimagine business models, accelerate innovation and maximize growth.');
      if (DEMO_CANDIDATES.length > 0) {
        setChatCandId(DEMO_CANDIDATES[0].id);
        setScheduleNameId(DEMO_CANDIDATES[0].id);
        setIntCandId(DEMO_CANDIDATES[0].id);
      }
      setLoading(false);
      return;
    }
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // 1. Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }
      setDbUser(user);

      // 2. Fetch Company details from companies table
      let { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('recruiter_id', user.id)
        .maybeSingle();

      // Failsafe: if company doesn't exist, seed it!
      if (!company) {
        const { data: newCompany, error: seedError } = await supabase
          .from('companies')
          .insert({
            recruiter_id: user.id,
            company_name: parentCurrentUser?.company || 'VividAI Systems',
            logo_url: '✨',
            description: 'Leading the future of multimodal search indexers and video resumes.',
            website: 'https://vividai.com'
          })
          .select()
          .single();

        if (seedError) {
          console.error("Error seeding company:", seedError);
        } else {
          company = newCompany;
        }
      }

      if (company) {
        setDbCompany(company);
        setCompanyName(company.company_name || 'VividAI Systems');
        setCompanyWebsite(company.website || 'https://vividai.com');
        setCompanyInfo(company.description || '');
      }

      // 3. Load Jobs posted by this recruiter
      const companyId = company?.id || company?.recruiter_id || user.id;
      
      // Dynamic column inspection
      let jobsColumns = [];
      try {
        // Method A: Select 1 row to get keys (works if table is seeded)
        const { data: sampleCol } = await supabase.from('jobs').select('*').limit(1);
        if (sampleCol && sampleCol.length > 0) {
          jobsColumns = Object.keys(sampleCol[0]);
        } else {
          // Method B: OPTIONS OpenAPI schema fetch (works if table is empty)
          const sUrl = import.meta.env.VITE_SUPABASE_URL;
          const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          if (sUrl && sKey) {
            const res = await fetch(`${sUrl}/rest/v1/jobs`, {
              method: 'OPTIONS',
              headers: {
                'apikey': sKey,
                'Authorization': `Bearer ${sKey}`
              }
            });
            if (res.ok) {
              const schema = await res.json();
              if (schema && schema.definitions && schema.definitions.jobs) {
                jobsColumns = Object.keys(schema.definitions.jobs.properties || {});
              } else if (schema && schema.paths && schema.paths['/jobs']) {
                const postParams = schema.paths['/jobs']?.post?.parameters || [];
                const bodyParam = postParams.find(p => p.in === 'body');
                if (bodyParam && bodyParam.schema && bodyParam.schema.properties) {
                  jobsColumns = Object.keys(bodyParam.schema.properties);
                }
              }
            }
          }
        }
      } catch (colErr) {
        console.warn("Failed to dynamically inspect jobs columns:", colErr);
      }

      // Method C: Individual column existence checks failsafe
      const criticalCols = ['recruiter_id', 'user_id', 'company_id', 'skills', 'required_skills'];
      for (const col of criticalCols) {
        if (!jobsColumns.includes(col)) {
          try {
            const { error } = await supabase.from('jobs').select(col).limit(0);
            if (!error) jobsColumns.push(col);
          } catch (e) {}
        }
      }

      let jobsQuery = supabase.from('jobs').select('*');
      if (jobsColumns.includes('recruiter_id')) {
        jobsQuery = jobsQuery.or(`recruiter_id.eq.${user.id},recruiter_id.is.null`);
      } else if (jobsColumns.includes('user_id')) {
        jobsQuery = jobsQuery.or(`user_id.eq.${user.id},user_id.is.null`);
      } else if (jobsColumns.includes('company_id')) {
        jobsQuery = jobsQuery.or(`company_id.eq.${companyId},company_id.is.null`);
      } else if (jobsColumns.includes('company')) {
        const queryCompanyName = company?.company_name || parentCurrentUser?.company || 'VividAI Systems';
        jobsQuery = jobsQuery.eq('company', queryCompanyName);
      }

      const { data: jobsData, error: jobsError } = await jobsQuery;

      if (jobsError) {
        console.error("Error loading jobs:", jobsError);
      } else {
        setLocalJobs(jobsData || []);
      }

      // 4. Load Applications with candidate profiles and candidate user details
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*, candidate_profiles(*), users(name, email), jobs(title)');

      if (appsError) {
        console.error("Error loading applications:", appsError);
      } else {
        // Filter applications to only match jobs posted by this recruiter's company
        const recruiterJobIds = (jobsData || []).map(j => j.id);
        const filteredApps = (appsData || []).filter(app => recruiterJobIds.includes(app.job_id));

        // Map applications to localCandidates structure
        const mappedCandidates = filteredApps.map(app => {
          const profile = app.candidate_profiles || {};
          const candidateUser = app.users || {};
          
          return {
            id: app.id, // Map application ID to candidate id so drag & drop works seamlessly on the application row!
            candidateId: profile.user_id || app.candidate_id,
            name: candidateUser.name || 'Anonymous Candidate',
            email: candidateUser.email || '',
            title: app.jobs?.title || 'Applied Candidate',
            location: profile.location || 'Remote',
            avatar: profile.avatar || '',
            skills: profile.skills || ['React', 'JavaScript'],
            bio: profile.bio || 'No biography details provided.',
            experience: profile.experience || 'CS Graduate',
            education: profile.education || 'CS Graduate',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            videoResumeUrl: profile.video_url || '',
            pdfResumeUrl: profile.pdf_url || '',
            pdfResumeName: profile.pdf_url ? profile.pdf_url.split('/').pop() : '',
            videoTranscript: profile.video_transcript || '',
            videoLanguage: profile.video_language || 'English',
            status: app.status || 'Screened',
            aiMatchScore: app.ai_score || 75,
            appliedJobs: [app.job_id],
            chatHistory: [
              { sender: 'recruiter', text: `Hi ${candidateUser.name || 'there'}! Loved your application. Let's schedule an interview.`, timestamp: 'Just now' }
            ]
          };
        });
        setLocalCandidates(mappedCandidates);

        // Pre-select inputs
        if (mappedCandidates.length > 0) {
          setChatCandId(prev => prev || mappedCandidates[0].id);
          setScheduleNameId(prev => prev || mappedCandidates[0].id);
          setIntCandId(prev => prev || mappedCandidates[0].id);
        }
      }

      // 5. Load all candidate profiles for the talent search engine pool
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('candidate_profiles')
        .select('*, users(name, email)');

      if (allProfilesError) {
        console.error("Error loading all profiles for search:", allProfilesError);
      } else {
        const mappedPool = (allProfiles || []).map(profile => {
          const u = profile.users || {};
          return {
            id: profile.user_id, // Use candidate user_id for searching candidate list
            name: u.name || 'Anonymous Candidate',
            email: u.email || '',
            title: profile.skills && profile.skills.length > 0 ? `${profile.skills[0]} Engineer` : 'Software Developer',
            location: profile.location || 'Remote',
            avatar: profile.avatar || '',
            skills: profile.skills || ['React'],
            bio: profile.bio || 'No biography details provided.',
            experience: profile.experience || 'CS Graduate',
            education: profile.education || 'CS Graduate',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            videoResumeUrl: profile.video_url || '',
            pdfResumeUrl: profile.pdf_url || '',
            pdfResumeName: profile.pdf_url ? profile.pdf_url.split('/').pop() : '',
            aiMatchScore: Math.floor(Math.random() * 25) + 75, // Failsafe dynamic AI score
            appliedJobs: [],
            status: 'Screened'
          };
        });
        setAllCandidatesPool(mappedPool);
      }

    } catch (err) {
      console.error("Error loading recruiter data:", err);
      showToast("Error loading recruiter data from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parentCurrentUser?.isDemo) {
      // Demo mode: no timeout needed, instant load
      loadData().then(() => {
        showToast('⚡ LTI Mindtree demo workspace loaded! Explore all features.', 'info');
      });
      return;
    }

    // Safety timeout: if loading takes longer than 2.0 seconds, force disable the loader
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    loadData().then(() => {
      const activeUserCompany = parentCurrentUser?.company || 'VividAI Systems';
      showToast(`⚡ ${activeUserCompany} workspace loaded successfully!`, 'info');
    }).finally(() => {
      clearTimeout(safetyTimeout);
    });

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Sync company details when parentCurrentUser shifts
  useEffect(() => {
    if (parentCurrentUser?.company) {
      setCompanyName(parentCurrentUser.company);
    }
  }, [parentCurrentUser]);

  // Reset candidate details drawer when recruiter switches tabs to prevent layout blocking
  useEffect(() => {
    setActiveCandId(null);
  }, [activeTab]);

  // Real-time Supabase subscriptions
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('public:applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        (payload) => {
          console.log('Real-time database sync payload:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localJobs]); // Re-subscribe if jobs list updates

  // Camera start when opening Virtual Interview Room
  useEffect(() => {
    if (activeTab === 'virtual') {
      startRecruiterCamera();
    } else {
      stopRecruiterCamera();
    }
    return () => stopRecruiterCamera();
  }, [activeTab]);

  // Close candidate detail modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setActiveCandId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Dynamic AI Interview Answer Generation
  useEffect(() => {
    if (!intCand) return;
    
    setIsGeneratingAnswer(true);
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const questionText = SCREENING_QUESTIONS[currentQuestionIndex];
    
    const triggerMockFallback = () => {
      setTimeout(() => {
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

  // Drag and Drop / Dropdown Status Update Handler
  const handleUpdateCandidateStatus = async (applicationIdOrCandidateId, newStatus) => {
    if (supabase) {
      try {
        // Path 1: existing Supabase application (from localCandidates)
        const isPipeline = localCandidates.some(c => c.id === applicationIdOrCandidateId);

        if (isPipeline) {
          const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicationIdOrCandidateId);

          if (error) {
            console.error("Supabase update status error:", error);
            showToast("Failed to update status in database.", "error");
          } else {
            showToast(`Status updated to ${newStatus}!`, "success");
            setLocalCandidates(prev =>
              prev.map(cand => cand.id === applicationIdOrCandidateId ? { ...cand, status: newStatus } : cand)
            );
            // Also sync to parent so candidate dashboard reflects the change
            onUpdateCandidateStatus(applicationIdOrCandidateId, newStatus);
          }
          return;
        }

        // Path 2: mock / parent-data candidate (no real Supabase application yet)
        // These are the fallback parentCandidates shown when localCandidates is empty.
        // Just update local optimistic state and propagate to parent — no Supabase write needed.
        const isMock = (parentCandidates || []).some(c => String(c.id) === String(applicationIdOrCandidateId));
        if (isMock) {
          onUpdateCandidateStatus(applicationIdOrCandidateId, newStatus);
          showToast(`Status updated to ${newStatus}!`, "success");
          return;
        }

        // Path 3: real candidate from the search/directory pool being shortlisted for the first time
        if (localJobs.length === 0) {
          showToast("Please post a job opening first before shortlisting new candidates.", "error");
          return;
        }
        const targetJob = localJobs[0];

        const { error } = await supabase
          .from('applications')
          .insert({
            job_id: targetJob.id,
            candidate_id: applicationIdOrCandidateId,
            status: newStatus,
            ai_score: Math.floor(Math.random() * 20) + 80
          });

        if (error) {
          console.error("Error shortlisting candidate:", error);
          showToast("Failed to shortlist candidate in database.", "error");
        } else {
          showToast(`Candidate shortlisted & added to ${newStatus}!`, "success");
          loadData();
        }
      } catch (err) {
        console.error("Error updating status:", err);
        showToast("Error updating application status.", "error");
      }
    } else {
      // No Supabase — full mock mode
      onUpdateCandidateStatus(applicationIdOrCandidateId, newStatus);
      showToast(`Status updated to ${newStatus}!`, "success");
    }
  };

  // Chat helper
  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChatMessage(chatCandId, chatInput.trim(), 'recruiter');
      setChatInput('');
      showToast("Message sent to candidate!", "success");
    }
  };

  // Schedule helper
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const cand = candidatesList.find(c => c.id === scheduleNameId);
    const j = jobsList.find(job => job.id === scheduleJobId);
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
      showToast("Interview meeting scheduled & synced!", "success");
      setActiveTab('pipeline');
    }
  };

  // Post Job form submit handler
  const handlePostJobSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitleInput.trim() || !jobDescriptionInput.trim() || !jobSkillsInput.trim() || !jobLocationInput.trim()) {
      showToast("Please fill in all job fields.", "error");
      return;
    }

    try {
      setPostingJob(true);

      // Get fresh authenticated user directly from Supabase session
      const { data: authData } = await supabase.auth.getUser();
      const currentUserObj = authData?.user || dbUser;
      if (!currentUserObj) {
        showToast("Authentication session expired. Please log in again.", "error");
        return;
      }
      const recruiterUserId = currentUserObj.id;

      // Fetch fresh company if state is missing
      let activeCompany = dbCompany;
      if (!activeCompany) {
        const { data: freshCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('recruiter_id', recruiterUserId)
          .maybeSingle();
        activeCompany = freshCompany;
      }
      
      const companyId = activeCompany?.id || activeCompany?.recruiter_id || recruiterUserId;
      const skillsArray = jobSkillsInput.split(',').map(s => s.trim()).filter(Boolean);

      // Dynamic column inspection
      let jobsColumns = [];
      try {
        // Method A: Select 1 row to get keys (works if table is seeded)
        const { data: sampleCol } = await supabase.from('jobs').select('*').limit(1);
        if (sampleCol && sampleCol.length > 0) {
          jobsColumns = Object.keys(sampleCol[0]);
        } else {
          // Method B: OPTIONS OpenAPI schema fetch (works if table is empty)
          const sUrl = import.meta.env.VITE_SUPABASE_URL;
          const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          if (sUrl && sKey) {
            const res = await fetch(`${sUrl}/rest/v1/jobs`, {
              method: 'OPTIONS',
              headers: {
                'apikey': sKey,
                'Authorization': `Bearer ${sKey}`
              }
            });
            if (res.ok) {
              const schema = await res.json();
              if (schema && schema.definitions && schema.definitions.jobs) {
                jobsColumns = Object.keys(schema.definitions.jobs.properties || {});
              } else if (schema && schema.paths && schema.paths['/jobs']) {
                const postParams = schema.paths['/jobs']?.post?.parameters || [];
                const bodyParam = postParams.find(p => p.in === 'body');
                if (bodyParam && bodyParam.schema && bodyParam.schema.properties) {
                  jobsColumns = Object.keys(bodyParam.schema.properties);
                }
              }
            }
          }
        }
      } catch (colErr) {
        console.warn("Failed to dynamically inspect jobs columns for insert:", colErr);
      }

      // Method C: Individual column existence checks failsafe
      const criticalCols = ['recruiter_id', 'user_id', 'company_id', 'skills', 'required_skills'];
      for (const col of criticalCols) {
        if (!jobsColumns.includes(col)) {
          try {
            const { error } = await supabase.from('jobs').select(col).limit(0);
            if (!error) jobsColumns.push(col);
          } catch (e) {}
        }
      }

      const insertObj = {};
      if (jobsColumns.includes('title') || jobsColumns.length === 0) insertObj.title = jobTitleInput.trim();
      if (jobsColumns.includes('description') || jobsColumns.length === 0) insertObj.description = jobDescriptionInput.trim();
      if (jobsColumns.includes('location') || jobsColumns.length === 0) insertObj.location = jobLocationInput.trim();
      
      // Skills
      if (jobsColumns.includes('skills') || jobsColumns.length === 0) insertObj.skills = skillsArray;
      if (jobsColumns.includes('required_skills')) insertObj.required_skills = skillsArray;

      // Auth IDs mapping for RLS checks
      if (jobsColumns.includes('recruiter_id') || jobsColumns.length === 0) {
        insertObj.recruiter_id = recruiterUserId;
      }
      if (jobsColumns.includes('user_id')) {
        insertObj.user_id = recruiterUserId;
      }

      // Company mapping
      if (jobsColumns.includes('company_id') || jobsColumns.length === 0) insertObj.company_id = companyId;
      if (jobsColumns.includes('company') || jobsColumns.length === 0) {
        insertObj.company = companyName || activeCompany?.company_name || parentCurrentUser?.company || 'VividAI Systems';
      }

      // Default fields
      if (jobsColumns.includes('logo') || jobsColumns.length === 0) insertObj.logo = activeCompany?.logo_url || '✨';
      if (jobsColumns.includes('salary') || jobsColumns.length === 0) insertObj.salary = '$130k - $160k';
      if (jobsColumns.includes('type') || jobsColumns.length === 0) insertObj.type = 'Full-time';
      if (jobsColumns.includes('status')) insertObj.status = 'Active';

      const { error } = await supabase
        .from('jobs')
        .insert(insertObj);

      if (error) {
        console.error("Error inserting job:", error, "Payload was:", insertObj);
        showToast(`Failed to post new job opening: ${error.message} (Auth details: recruiter_id=${insertObj.recruiter_id ? 'SET' : 'MISSING'}, company_id=${insertObj.company_id ? 'SET' : 'MISSING'}, company=${insertObj.company})`, "error");
      } else {
        showToast("New job posting added successfully!", "success");
        setJobTitleInput('');
        setJobLocationInput('');
        setJobDescriptionInput('');
        setJobSkillsInput('');
        loadData();
      }
    } catch (err) {
      console.error("Error posting job:", err);
      showToast("Failed to create job opening: " + err.message, "error");
    } finally {
      setPostingJob(false);
    }
  };

  // Edit Company Profile details save handler
  const handleCompanyProfileSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Company name cannot be empty.", "error");
      return;
    }

    if (!supabase || !dbUser) {
      showToast("Branding saved locally!", "success");
      return;
    }

    try {
      setSavingCompany(true);
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: companyName.trim(),
          website: companyWebsite.trim(),
          description: companyInfo.trim()
        })
        .eq('recruiter_id', dbUser.id);

      if (error) {
        console.error("Error updating company details:", error);
        showToast("Failed to save company details.", "error");
      } else {
        showToast("Company profile saved successfully!", "success");
        loadData();
      }
    } catch (err) {
      console.error("Error in handleCompanyProfileSubmit:", err);
      showToast("Failed to save organization profile.", "error");
    } finally {
      setSavingCompany(false);
    }
  };

  // Filters candidates in the Search and Pipeline lists
  const candidatesList = (supabase && localCandidates.length > 0) ? localCandidates : parentCandidates;
  const jobsList = (supabase && localJobs.length > 0) ? localJobs : parentJobs;
  const interviewsList = (supabase && localInterviews.length > 0) ? localInterviews : parentInterviews;

  const filteredCandidates = (supabase && allCandidatesPool.length > 0 ? allCandidatesPool : candidatesList || []).filter(cand => {
    if (!cand) return false;
    const matchesSearch = searchQuery === '' || 
      (cand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (cand.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (cand.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSkill = selectedSkill === 'All' || (cand.skills || []).includes(selectedSkill);
    const matchesScore = (cand.aiMatchScore || 0) >= minMatchScore;

    return matchesSearch && matchesSkill && matchesScore;
  });

  // Extract all unique skills across candidates for filter dropdowns
  const allSkills = ['All', ...new Set((supabase && allCandidatesPool.length > 0 ? allCandidatesPool : candidatesList || []).flatMap(c => c?.skills || []))];

  const activeCand = (candidatesList || []).find(c => c?.id === activeCandId) || (allCandidatesPool || []).find(c => c?.id === activeCandId);
  const chatCand = (candidatesList || []).find(c => c?.id === chatCandId);
  const intCand = (candidatesList || []).find(c => c?.id === intCandId);

  // Loading Screen Layout
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] bg-[#050816] text-white">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl border border-white/5 bg-[#0B1020]/60 backdrop-blur-2xl shadow-2xl">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-sm tracking-wide text-slate-200">Loading Recruiter Desk</h3>
            <p className="text-[10px] text-slate-500 mt-1">Retrieving jobs, pipeline applications, and profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#050816]">
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Mobile Hamburger Header (visible only on mobile) */}
      <div className="flex md:hidden items-center justify-between px-6 py-4 bg-[#0B1020] border-b border-white/5 shrink-0 z-40 w-full select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-sm font-bold shadow-md shadow-purple-500/15">
            🏢
          </div>
          <div>
            <h3 className="font-bold text-xs text-white truncate max-w-[140px] leading-tight">{companyName}</h3>
            <span className="text-[8px] font-bold text-emerald-400 block">Recruiter Desk</span>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-[1000] w-64 bg-[#0B1020] border-r border-white/5 p-6 flex flex-col gap-2 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } shrink-0`}>
        
        {/* Mobile Sidebar Close Header */}
        <div className="flex md:hidden justify-between items-center mb-4 pb-2 border-b border-white/5 select-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recruiter Menu</span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recruiter Badge */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5 select-none">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md shadow-purple-500/10 shrink-0">
            🏢
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate max-w-[130px] leading-tight">{companyName}</h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit mt-1.5">
              <ShieldCheck className="w-3 h-3" /> Verified Org
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <button 
            onClick={() => { setActiveTab('pipeline'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'pipeline' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Hiring Pipeline Board
          </button>

          <button 
            onClick={() => { setActiveTab('search'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
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
            onClick={() => { setActiveTab('ai-match'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'ai-match' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Match Center
          </button>

          <button 
            onClick={() => { setActiveTab('rankings'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'rankings' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            Candidate Rankings
          </button>

          <button 
            onClick={() => { setActiveTab('interview-assistant'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'interview-assistant' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
            AI Interview Assistant
          </button>

          <button 
            onClick={() => { setActiveTab('post-job'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'post-job' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Post a New Job
          </button>

          <button 
            onClick={() => { setActiveTab('company'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'company' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Company Profile
          </button>

          <button 
            onClick={() => { setActiveTab('scheduler'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'scheduler' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Interview Scheduler
          </button>

          <button 
            onClick={() => { setActiveTab('virtual'); startRecruiterCamera(); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'virtual' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            Virtual Interview Room
          </button>

          <button 
            onClick={() => { setActiveTab('chats'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'chats' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Talent Chat Box
          </button>
        </nav>

        {/* Sidebar Footer with Logout Button */}
        <div className="pt-4 border-t border-white/5 mt-auto flex flex-col gap-3 select-none">
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Recruiter Frame */}
      <section className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full min-w-0 flex flex-col animation-fade-in">
        
        {/* TAB 1: PIPELINE MANAGEMENT (KANBAN) */}
        {activeTab === 'pipeline' && (
          <PipelineKanban 
            candidates={candidatesList}
            jobs={jobsList}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
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
                    className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1020]/60 glass-card-hover"
                  >
                    <div className="flex gap-4 items-center">
                      {cand.avatar ? (
                        <img 
                          src={cand.avatar} 
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80&h=80';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-base font-bold text-purple-300">
                          {cand.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-base text-white">{cand.name}</h4>
                        <p className="text-xs text-slate-400">{cand.title} • {cand.location}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            🌐 {cand.videoLanguage || 'English'}
                          </span>
                        </div>
                        
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

        {/* TAB: AI MATCH CENTER */}
        {activeTab === 'ai-match' && (
          <AIMatchCenter 
            jobs={jobsList}
            onOpenCandidateDetail={(id) => setActiveCandId(id)}
            showToast={showToast}
            fallbackCandidates={candidatesList}
          />
        )}

        {/* TAB: CANDIDATE RANKINGS */}
        {activeTab === 'rankings' && (
          <CandidateRankings 
            candidates={candidatesList}
            onOpenCandidateDetail={(id) => setActiveCandId(id)}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
            onSendChatMessage={onSendChatMessage}
            showToast={showToast}
          />
        )}

        {/* TAB: AI INTERVIEW ASSISTANT */}
        {activeTab === 'interview-assistant' && (
          <AIInterviewAssistant 
            candidates={candidatesList}
            jobs={jobsList}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
            showToast={showToast}
          />
        )}

        {/* TAB 3: POST A JOB */}
        {activeTab === 'post-job' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Post a New Job Opening</h2>
              <p className="text-slate-400 text-xs">Create a new career opening. It will immediately show up in candidate searches and active listings.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Form card */}
              <form onSubmit={handlePostJobSubmit} className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-4 bg-[#0B1020]/60">
                <h3 className="font-bold text-sm text-white mb-2 pb-2 border-b border-white/5">Opening Details</h3>
                
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Backend Engineer" 
                    value={jobTitleInput}
                    onChange={(e) => setJobTitleInput(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Remote (US/Canada) or New York, NY" 
                    value={jobLocationInput}
                    onChange={(e) => setJobLocationInput(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Required Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="React, JavaScript, Node.js, WebRTC" 
                    value={jobSkillsInput}
                    onChange={(e) => setJobSkillsInput(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Job Description</label>
                  <textarea 
                    placeholder="We are looking for a brilliant engineer to..." 
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    rows={4}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={postingJob}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all mt-2 flex items-center justify-center gap-2"
                >
                  {postingJob ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      <span>Publishing Opening...</span>
                    </>
                  ) : (
                    <span>Publish Job Opening</span>
                  )}
                </button>
              </form>

              {/* Active Openings list */}
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-sm text-white pb-2 border-b border-white/5">Active Posted Openings ({jobsList.length})</h3>
                {jobsList.length === 0 ? (
                  <div className="text-center p-8 bg-black/30 rounded-xl text-slate-500 text-xs">
                    No active job postings recorded. Use the form on the left to add one!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {jobsList.map(job => (
                      <div key={job.id} className="glass-card p-4 rounded-xl border border-white/5 flex flex-col gap-2 bg-[#0B1020]/60">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-white">{job.title}</h4>
                            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-400" /> {job.location}
                            </span>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold rounded uppercase">
                            Active
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{job.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray(job.required_skills) ? job.required_skills : (job.skills || [])).map(sk => (
                            <span key={sk} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-semibold border border-white/5">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY PROFILE */}
        {activeTab === 'company' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Organization Profile</h2>
              <p className="text-slate-400 text-xs">Manage your brand presence, website, and company summary viewed by all candidates.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              
              {/* Profile Card Left */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0B1020]/60 md:col-span-1 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/10 border border-white/10 select-none">
                  🏢
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{companyName}</h3>
                  <a href={companyWebsite} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:text-purple-300 font-semibold truncate block mt-0.5">{companyWebsite}</a>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-4">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Org
                  </span>
                </div>
              </div>

              {/* Form Card Right */}
              <form onSubmit={handleCompanyProfileSubmit} className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-4 bg-[#0B1020]/60 md:col-span-2">
                <h3 className="font-bold text-sm text-white pb-2 border-b border-white/5">Edit Branding & Core Info</h3>
                
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Corporate Website URL</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Organization Bio / Description</label>
                  <textarea 
                    value={companyInfo}
                    onChange={(e) => setCompanyInfo(e.target.value)}
                    placeholder="Write a brief pitch about your company culture, technology stack, and hiring goals."
                    rows={4}
                    className="w-full bg-[#050816] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={savingCompany}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all mt-2 flex items-center justify-center gap-2"
                >
                  {savingCompany ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      <span>Saving branding...</span>
                    </>
                  ) : (
                    <span>Save Corporate Branding Details</span>
                  )}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* TAB 5: INTERVIEW SCHEDULER */}
        {activeTab === 'scheduler' && (
          <InterviewScheduler 
            currentUser={parentCurrentUser || dbUser}
            candidates={candidatesList}
            jobs={jobsList}
            showToast={showToast}
          />
        )}

        {/* TAB 6: TALENT CHAT BOX */}
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
                  {candidatesList.map(cand => (
                    <div 
                      key={cand.id}
                      onClick={() => setChatCandId(cand.id)}
                      className={`flex gap-3 items-center p-3 cursor-pointer transition-colors ${
                        chatCandId === cand.id ? 'bg-purple-600/10 border-l-2 border-purple-500' : 'hover:bg-white/5'
                      }`}
                    >
                      {cand.avatar ? (
                        <img 
                          src={cand.avatar} 
                          alt={cand.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                          {cand.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div className="min-w-0 hidden sm:block">
                        <h4 className="font-bold text-xs text-white truncate">{cand.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{cand.chatHistory && cand.chatHistory.length > 0 ? cand.chatHistory[cand.chatHistory.length - 1].text : 'No conversations yet'}</p>
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
                        {chatCand.avatar ? (
                          <img src={chatCand.avatar} alt={chatCand.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                            {chatCand.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
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
                      {!chatCand.chatHistory || chatCand.chatHistory.length === 0 ? (
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

        {/* TAB 7: VIRTUAL INTERVIEW ROOM SIMULATOR */}
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
                <option value="" disabled>-- Choose Room Candidate --</option>
                {candidatesList.map(c => <option key={c.id} value={c.id}>{c.name} ({c.title})</option>)}
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
                <div className="glass-card p-5 rounded-xl border border-white/5 flex flex-col gap-3.5 bg-[#0B1020]/60">
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
                        <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
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
              <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col gap-4 bg-[#0B1020]/60">
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
                    placeholder="Candidate demonstrated great insights, clear confidence, and structured problem solving patterns."
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
                      if (intCandId) {
                        handleUpdateCandidateStatus(intCandId, 'Offered');
                        setActiveTab('pipeline');
                      }
                    }}
                    className="py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Selected / Offer
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (intCandId) {
                        handleUpdateCandidateStatus(intCandId, 'Rejected');
                        setActiveTab('pipeline');
                      }
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
        <div 
          className="fixed inset-0 z-[1500] bg-black/85 backdrop-blur-md flex flex-col animation-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveCandId(null); }}
        >
          {/* Fixed top bar — ALWAYS visible, never scrolls away */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-3 bg-[#050816]/95 border-b border-white/5 backdrop-blur-xl z-10">
            <button 
              onClick={() => setActiveCandId(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold group cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              ← Back to Pipeline
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600 hidden sm:block">Press <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono">ESC</kbd> to close</span>
              <button 
                onClick={() => setActiveCandId(null)}
                className="text-slate-400 hover:text-red-400 transition-colors p-1.5 bg-white/5 hover:bg-red-500/10 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Floating Card Content Container */}
            <div className="bg-[#0B1020] border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl mx-auto mb-4">

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
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider flex items-center gap-1">
                            <span>🌐</span> Video: {activeCand.videoLanguage || 'English'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-400 mt-3">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-500" /> {activeCand.location}</span>
                          <span className="flex items-center gap-1.5">💼 {activeCand.experience || '3 years exp'}</span>
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

                  {/* Recruiter Translation & Summary Details */}
                  {activeCand.videoResumeUrl && (
                    <div className="mt-2.5">
                      <RecruiterTranslationSummary activeCand={activeCand} />
                    </div>
                  )}
                </div>

                {/* Video Resume Transcription & Summary */}
                {activeCand.videoResumeUrl && (
                  <VideoTranscription activeCand={activeCand} />
                )}
   
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
                          <div className={`${metric.color} h-1.5 rounded-full progress-bar-fill`} style={{ width: `${metric.score}%` }}></div>
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
                        handleUpdateCandidateStatus(activeCand.id, 'Shortlisted');
                        setActiveCandId(null);
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-amber-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ⭐ Shortlist
                    </button>
  
                    <button 
                      onClick={() => {
                        handleUpdateCandidateStatus(activeCand.id, 'Offered');
                        setActiveCandId(null);
                      }}
                      className="w-full py-2.5 bg-black/40 hover:bg-[#11182D] border border-white/5 hover:border-emerald-500/20 text-xs font-bold text-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      ✅ Offer Job
                    </button>
  
                    <button 
                      onClick={() => {
                        handleUpdateCandidateStatus(activeCand.id, 'Rejected');
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
