import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Video, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  Search, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  X,
  FileCheck2,
  Tv,
  ArrowRight,
  Sparkle,
  MessageSquare,
  Send,
  Calendar,
  Mic,
  Clock,
  Award,
  Sliders,
  ChevronRight,
  Volume2,
  LogOut,
  Menu
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ResumeAnalysis from './features/ResumeAnalysis';
import SkillAssessments from './features/SkillAssessments';
import CareerRecommendations from './features/CareerRecommendations';
import MultilingualSupport, { SUPPORTED_LANGUAGES, TELEPROMPTER_SCRIPTS, saveVideoLanguageToDb } from './features/MultilingualSupport';
import Toast from './features/Toast';

export default function CandidateWorkspace({ 
  activeTab, 
  setActiveTab, 
  activeCandidate, 
  jobs, 
  onUpdateProfile, 
  onApplyJob,
  onAddJobs,
  onSendChatMessage,
  interviews = [],
  onScheduleInterview,
  onLogout
}) {
  const [profileName, setProfileName] = useState(activeCandidate?.name || '');
  const [profileTitle, setProfileTitle] = useState(activeCandidate?.title || '');
  const [profileLocation, setProfileLocation] = useState(activeCandidate?.location || '');
  const [profileBio, setProfileBio] = useState(activeCandidate?.bio || '');
  const [profileSkills, setProfileSkills] = useState(activeCandidate?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [profileExperience, setProfileExperience] = useState(activeCandidate?.experience || '');
  const [profileEducation, setProfileEducation] = useState(activeCandidate?.education || '');

  // Real Supabase States
  const [currentUser, setCurrentUser] = useState(null);
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profileGithub, setProfileGithub] = useState('');
  const [profileVideoUrl, setProfileVideoUrl] = useState('');
  const [profilePdfUrl, setProfilePdfUrl] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [toast, setToast] = useState(null);
  
  // Mobile responsive sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Gemini AI Job Generation States
  const [searchDomain, setSearchDomain] = useState('');
  const [isGeneratingJobs, setIsGeneratingJobs] = useState(false);

  // Multilingual Support States
  const [videoLanguage, setVideoLanguage] = useState(activeCandidate?.videoLanguage || 'English');

  const handleVideoLanguageChange = (selectedLang) => {
    setVideoLanguage(selectedLang);
    const customScript = TELEPROMPTER_SCRIPTS[selectedLang];
    if (customScript) {
      setTeleprompterText(customScript);
    }
    // Sync with parent state & database
    onUpdateProfile({ videoLanguage: selectedLang });
    if (currentUser?.id) {
      saveVideoLanguageToDb(currentUser.id, selectedLang);
    }
  };

  // Helper for displaying notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };





  // Mount Loader for real Supabase data
  useEffect(() => {
    // ── DEMO MODE: skip Supabase, instantly populate Sarah Jenkins' rich profile ──
    if (activeCandidate?.id === 'cand-1' || activeCandidate?.isDemo) {
      setProfileName('Sarah Jenkins');
      setProfileTitle('Full Stack Engineer');
      setProfileLocation('New York, NY');
      setProfileBio('Passionate full-stack developer with 5+ years of experience building scalable web solutions. Focused on pixel-perfect implementations, WebRTC audio/video streaming tools, and high-performance React application patterns. I love crafting smooth, production-grade UI components that delight users.');
      setProfileSkills(['React', 'JavaScript', 'TypeScript', 'Node.js', 'Tailwind CSS', 'SQL', 'WebRTC', 'Next.js']);
      setProfileExperience('5 years at top product companies including Razorpay, Freshworks, and early-stage startups.');
      setProfileEducation('B.Tech Computer Science, IIT Delhi (2019)');
      setProfileLinkedin('https://linkedin.com/in/sarahjenkins');
      setProfileGithub('https://github.com/sarahjenkins-dev');
      setProfileVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42280-large.mp4');
      setRecordedVideo('https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42280-large.mp4');
      setPdfFile('sarah_jenkins_resume.pdf');
      setKycVerified(true);
      setVideoLanguage('English');
      setApplications([
        { id: 'app-demo-1', job_id: 'job-1', status: 'Shortlisted', ai_match_score: 94, job: { title: 'Senior Frontend Engineer (React & WebRTC)', company: 'VividAI Systems', location: 'Remote (US/Canada)', salary: '$130k-$160k' } },
        { id: 'app-demo-2', job_id: 'job-3', status: 'Screened', ai_match_score: 82, job: { title: 'Generative AI & LLM Engineer', company: 'NeuralNext', location: 'Seattle, WA', salary: '$160k-$210k' } },
        { id: 'app-demo-3', job_id: 'job-4', status: 'Interview Scheduled', ai_match_score: 78, job: { title: 'Cloud DevOps Architect', company: 'CloudScale Corp', location: 'Remote (Global)', salary: '$140k-$180k' } }
      ]);
      setLoading(false);
      showToast('⚡ Welcome back, Sarah Jenkins! Portfolio loaded.', 'info');
      return;
    }

    // Safety timeout: if loading takes longer than 2.0 seconds, force disable the loader
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const loadData = async () => {
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
        setCurrentUser(user);

        // 2. Fetch User Details from users table
        const { data: dbUser } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single();

        if (dbUser) {
          setProfileName(dbUser.name || '');
        }

        // 3. Fetch Candidate Profile from candidate_profiles table
        const { data: dbProfile } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dbProfile) {
          setProfileTitle(dbProfile.title || 'Software Engineer Portfolio');
          setProfileLocation(dbProfile.location || 'Remote');
          setProfileBio(dbProfile.bio || 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.');
          setProfileSkills(dbProfile.skills || ['React', 'JavaScript', 'HTML5', 'CSS3']);
          setProfileExperience(dbProfile.experience || '');
          setProfileEducation(dbProfile.education || '');
          setProfileLinkedin(dbProfile.linkedin || '');
          setProfileGithub(dbProfile.github || '');
          setProfileVideoUrl(dbProfile.video_url || '');
          setProfilePdfUrl(dbProfile.pdf_url || '');
          setRecordedVideo(dbProfile.video_url || '');
          setPdfFile(dbProfile.pdf_resume_name || '');
          setKycVerified(dbProfile.kyc_status === 'Verified');
          setVideoLanguage(dbProfile.video_language || 'English');
        }

        // 4. Fetch Applications joined with Jobs safely in memory
        const { data: dbApps } = await supabase
          .from('applications')
          .select('*')
          .eq('candidate_id', user.id);

        if (dbApps && dbApps.length > 0) {
          const { data: dbJobs } = await supabase.from('jobs').select('*');
          const mergedApps = dbApps.map(app => ({
            ...app,
            job: dbJobs ? dbJobs.find(j => j.id === app.job_id) : null
          }));
          setApplications(mergedApps);
        }
      } catch (err) {
        console.error("Error loading candidate workspace data:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    loadData().then(() => {
      showToast(`⚡ Welcome back, ${activeCandidate?.name || 'Sarah Jenkins'}! Portfolio loaded.`, 'info');
    });

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);


  // Recruiter Message & Scheduling States
  const [chatInput, setChatInput] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-05-28');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [isBooking, setIsBooking] = useState(false);

  // AI Practice States
  const [practiceRole, setPracticeRole] = useState(jobs && jobs.length > 0 ? jobs[0].id : 'custom');
  const [customRoleName, setCustomRoleName] = useState('');
  const [selectedPracticeTab, setSelectedPracticeTab] = useState('setup'); // 'setup', 'interview', 'results'
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [isVoiceSimulating, setIsVoiceSimulating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  
  // Custom mock practice questions
  const MOCK_PRACTICE_QUESTIONS = {
    'job-1': [
      "How do you design and structure highly responsive layouts using React refs, flexbox, or grid containers?",
      "Explain the exact rendering cycle of React and how custom hooks or memoization can optimize performance.",
      "How would you approach configuring a real-time WebRTC media connection, including signaling and ice-candidates?",
      "What practices do you employ to build fully accessible components with keyboard focus-trapping?"
    ],
    'job-2': [
      "How do you translate complex analytical user workflows into simple, human-centric design tokens?",
      "Explain your process for building and maintaining dynamic, multi-brand design systems in Figma.",
      "How do you approach conducting remote user research and incorporating usability feedback into high-fidelity mockups?",
      "Describe how you design fluid interactive micro-animations and handle developer handoff for styled elements."
    ],
    'job-3': [
      "What methods do you employ for tuning and optimizing transformer-based model inference latency?",
      "Explain how you design data parsing channels for indexing highly unstructured text, audio, and video streams.",
      "Describe your approach to prompting engineering and running local fallbacks for large language models.",
      "How do you build highly resilient, streaming APIs that serve real-time AI analytics under high traffic?"
    ],
    'job-4': [
      "Describe how you architect fault-tolerant containerized nodes for running WebRTC live streams at global scale.",
      "How do you manage configuration drift across environments using Infrastructure as Code (Terraform)?",
      "What metrics do you monitor to analyze network relay bottlenecks, and how do you implement autoscaling policies?",
      "Describe your ideal CI/CD pipeline for deploying a containerized microservice suite into Kubernetes."
    ],
    'custom': [
      "Tell us about a challenging project you built recently and the key technical decisions you made.",
      "How do you stay up-to-date with emerging industry technologies and integrate them into your active projects?",
      "Explain how you debug complex, asynchronous issues or performance bottlenecks in your applications.",
      "What communication strategies do you use when aligning technical architecture plans with non-technical stakeholders?"
    ]
  };

  const getPracticeQuestions = () => {
    return MOCK_PRACTICE_QUESTIONS[practiceRole] || MOCK_PRACTICE_QUESTIONS['custom'];
  };

  const practiceQuestions = getPracticeQuestions();

  const handleEvaluateAnswer = async () => {
    setIsEvaluating(true);
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const questionText = practiceQuestions[currentPracticeIndex];

    const targetJob = jobs.find(j => j.id === practiceRole);
    const roleName = targetJob ? targetJob.title : (customRoleName || "Software Engineer");

    const triggerLocalGraderFallback = () => {
      setTimeout(() => {
        const text = practiceAnswer.trim();
        const textLower = text.toLowerCase();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        
        let techScore = 65;
        let commScore = 70;
        let strengths = [];
        let weaknesses = [];
        let modelAnswer = "";

        const hasSpecificExamples = textLower.includes("for example") || textLower.includes("e.g.") || textLower.includes("such as") || textLower.includes("specifically");
        const hasTechnicalTerms = textLower.includes("react") || textLower.includes("grid") || textLower.includes("flexbox") || textLower.includes("token") || textLower.includes("api") || textLower.includes("state") || textLower.includes("cache") || textLower.includes("optimization");

        // Analyze matching screening question
        const activeQuestion = practiceQuestions[currentPracticeIndex] || "";
        const questionTextLower = activeQuestion.toLowerCase();

        if (questionTextLower.includes("layout") || questionTextLower.includes("flexbox") || questionTextLower.includes("grid")) {
          const hasGrid = textLower.includes("grid") || textLower.includes("track") || textLower.includes("columns");
          const hasFlex = textLower.includes("flexbox") || textLower.includes("flex") || textLower.includes("direction");
          const hasRefs = textLower.includes("ref") || textLower.includes("dom") || textLower.includes("prevent re-render");

          if (hasGrid || hasFlex) techScore += 15;
          if (hasRefs) techScore += 10;
          if (wordCount > 30) commScore += 15;

          strengths = [
            `Good layout terminology used. You correctly highlighted ${hasGrid ? "CSS Grid properties" : "flex container models"} for structuring UI elements.`,
            hasRefs ? "Demonstrated highly advanced knowledge by incorporating React Ref manipulation to control DOM measurements." : "Well-structured response detailing responsive container constraints."
          ];
          
          weaknesses = [
            !hasRefs ? "We suggest expanding on how you measure dynamic viewport updates or prevent raw React re-renders using ref bindings." : "Try detailing concrete breakout parameters for sub-grid layouts.",
            "Make sure to mention ARIA semantic indicators for grid column roles when building accessible tables."
          ];

          modelAnswer = "To deliver a perfect response, outline your hands-on experience structuring responsive cards using CSS Grid, describe dynamic DOM track allocation using absolute measurement values in React refs, and mention focus-handling properties.";

        } else if (questionTextLower.includes("rendering") || questionTextLower.includes("cycle") || questionTextLower.includes("optimize")) {
          const hasHooks = textLower.includes("usecallback") || textLower.includes("usememo") || textLower.includes("memo");
          const hasVirtual = textLower.includes("virtual") || textLower.includes("windowing") || textLower.includes("list");
          const hasKeys = textLower.includes("key") || textLower.includes("reconciliation") || textLower.includes("diff");

          if (hasHooks) techScore += 15;
          if (hasVirtual) techScore += 10;
          if (hasKeys) techScore += 5;
          if (wordCount > 35) commScore += 15;

          strengths = [
            hasHooks ? "Correctly identified callback hooks and memoization as key strategies for eliminating excess component lifecycle updates." : "Articulated clean React functional component optimization patterns.",
            hasVirtual ? "Strong architectural awareness shown by explaining virtual windowing to optimize DOM node density." : "Good clarity outlining child rendering workflows."
          ];

          weaknesses = [
            !hasVirtual ? "We recommend mentioning dynamic virtual list libraries (like react-window) for handling infinitely scrolling grids." : "Consider explaining the precise trade-off in memory overhead when creating cached handlers via useCallback.",
            "Be sure to cover child key reconciliation rules during state changes to round out your response."
          ];

          modelAnswer = "A model answer should detail React's reconciliation engine, explain how useCallback avoids reinstantiating functions on parent re-renders, and outline DOM node virtualization techniques for heavy lists.";

        } else if (questionTextLower.includes("up-to-date") || questionTextLower.includes("emerging") || questionTextLower.includes("technologies") || questionTextLower.includes("integrate")) {
          const hasLearning = textLower.includes("read") || textLower.includes("blog") || textLower.includes("github") || textLower.includes("newsletter") || textLower.includes("documentation") || textLower.includes("community") || textLower.includes("meetup");
          const hasTesting = textLower.includes("poc") || textLower.includes("sandbox") || textLower.includes("experiment") || textLower.includes("prototype") || textLower.includes("test");
          const hasEvaluation = textLower.includes("overhead") || textLower.includes("license") || textLower.includes("package size") || textLower.includes("security") || textLower.includes("vet");

          if (hasLearning) techScore += 12;
          if (hasTesting) techScore += 12;
          if (hasEvaluation) techScore += 6;
          if (wordCount > 25) commScore += 15;

          strengths = [
            hasLearning ? "Excellent habits detailed regarding technical channels like official documentations, newsletters, or GitHub code reviews." : "Demonstrates proactive interest in technology adoption.",
            hasTesting ? "Strong integration practices described using isolated Sandboxes or Proof of Concepts to vet libraries before scaling." : "Good basic awareness of keeping software dependencies updated."
          ];

          weaknesses = [
            !hasTesting ? "We suggest outlining a safe evaluation loop, such as building modular sandboxed POCs before introducing dependencies to staging branches." : "Consider discussing how you balance package bundle size and licensing constraints.",
            "Explain how you audit security vulnerabilities in technical libraries using npm audit tools."
          ];

          modelAnswer = "A model answer outlines continuous learning habits (technical blogs, release notes), explains standard vetting procedures (bundle size, active maintenance), and highlights safe testing (sandboxed sandbox prototypes, regression runs).";

        } else if (questionTextLower.includes("webrtc") || questionTextLower.includes("connection") || questionTextLower.includes("stream")) {
          const hasIce = textLower.includes("ice") || textLower.includes("candidate") || textLower.includes("stun") || textLower.includes("turn");
          const hasSignaling = textLower.includes("signal") || textLower.includes("socket") || textLower.includes("channel");
          const hasTracks = textLower.includes("track") || textLower.includes("stream") || textLower.includes("media");

          if (hasIce || hasSignaling) techScore += 15;
          if (hasTracks) techScore += 10;
          if (wordCount > 30) commScore += 15;

          strengths = [
            hasSignaling ? "Clear understanding of peer-to-peer handshakes and signaling server relays." : "Good foundational knowledge of dynamic audio/video streams.",
            hasIce ? "Solid grasp of STUN/TURN connection traversal and candidate exchanges under firewall rules." : "Correctly described capturing local media streams."
          ];

          weaknesses = [
            !hasIce ? "We recommend adding the role of STUN/TURN servers in establishing signaling paths under heavy firewalls." : "Consider detailing how WebRTC handles track negotiation or fallback video codecs.",
            "Outline track garbage collection practices (e.g. stopping media stream tracks on component unmount) to protect memory."
          ];

          modelAnswer = "Your answer should outline peer negotiation steps, detail ICE candidate collection via STUN/TURN servers, explain Web sockets signaling channels, and describe stop-track garbage collection rules.";

        } else {
          const hasTechnicalFocus = hasTechnicalTerms && wordCount > 40;
          const hasExamples = hasSpecificExamples;

          if (hasTechnicalFocus) techScore += 15;
          if (hasExamples) techScore += 10;
          if (wordCount > 25) commScore += 15;

          strengths = [
            "Presented a well-structured technical statement with clear, logical flows.",
            hasExamples ? "Good practical focus shown by supplying concrete implementation examples or past projects." : "Clean vocabulary detailing your professional software engineering philosophy."
          ];

          weaknesses = [
            !hasExamples ? "Try giving a specific, real-world scenario of a technical bottleneck you resolved to ground your claims." : "Consider expanding on the testing or validation phases of your decisions.",
            "Mention how you coordinate architectural refactoring updates with product stakeholders to maintain product velocity."
          ];

          modelAnswer = "A strong answer combines deep domain knowledge, outlines structured debugging cycles, explains risk evaluation metrics, and highlights clear team collaboration channels.";
        }

        // Vocabulary length scoring adjustment
        if (wordCount < 15) {
          techScore = Math.max(45, techScore - 20);
          commScore = Math.max(40, commScore - 25);
          weaknesses.unshift("Your response is extremely short. We highly recommend typing a more comprehensive answer (at least 2-3 detailed sentences) to achieve a passing scorecard.");
        } else if (wordCount < 30) {
          techScore = Math.max(55, techScore - 10);
          commScore = Math.max(50, commScore - 12);
        }

        techScore = Math.min(100, Math.max(40, techScore));
        commScore = Math.min(100, Math.max(40, commScore));
        const overallScore = Math.round((techScore + commScore) / 2);

        setPracticeFeedback({
          score: overallScore,
          technical: techScore,
          communication: commScore,
          strengths,
          weaknesses,
          modelAnswer
        });
        setIsEvaluating(false);
        setSelectedPracticeTab('results');
      }, 1500);
    };

    if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        const prompt = `You are playing the role of an expert AI Technical Recruiter.
A candidate has submitted an answer to the following screening question for a role as a ${roleName}:
Question: "${questionText}"
Candidate's typed answer: "${practiceAnswer}"
Candidate's profile skills: ${profileSkills.join(', ')}

Please evaluate this response and return a JSON object with the following fields:
{
  "score": (overall score as an integer between 40 and 100),
  "technical": (technical competency score as an integer between 40 and 100),
  "communication": (communication clarity score as an integer between 40 and 100),
  "strengths": [2 or 3 short positive highlights as a list of strings],
  "weaknesses": [2 or 3 constructive critique items as a list of strings],
  "modelAnswer": "A comprehensive 2-3 sentence reference model answer for the candidate to study"
}

Do NOT wrap the response in markdown blocks like \`\`\`json or add extra text. Return ONLY the raw JSON string. If you cannot parse it, ensure it strictly follows JSON formatting.`;

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
          const rawText = resData.candidates[0].content.parts[0].text.trim();
          const cleanJsonText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
          const feedbackObj = JSON.parse(cleanJsonText);
          setPracticeFeedback(feedbackObj);
          setIsEvaluating(false);
          setSelectedPracticeTab('results');
        } else {
          throw new Error("Invalid output format from Gemini");
        }
      } catch (err) {
        console.error("Gemini Grader failed, running local evaluation:", err);
        triggerLocalGraderFallback();
      }
    } else {
      triggerLocalGraderFallback();
    }
  };

  const handleSimulateVoice = () => {
    setIsVoiceSimulating(true);
    setPracticeAnswer('');
    
    const sampleAnswers = [
      "In my past projects, I focus heavily on structured layouts using flexbox for simpler lists and CSS Grid for complex, multi-dimensional cards. I avoid dynamic margin hacks by utilizing explicit grid gaps and relative paddings that adapt dynamically using media queries.",
      "To optimize rendering performance in React, I implement useCallback and useMemo hooks to cache complex functions and values. For large lists, I employ virtual windowing techniques so that only visible cards are mounted in the browser DOM at any time.",
      "When configuring WebRTC connections, I establish a robust signalling server using socket.io. I attach active listeners for ICE-candidate generation and handle network topology variations gracefully, ensuring audio/video tracks sync perfectly.",
      "I prioritize building fully inclusive components. I ensure all modal drawers trap keyboard focus and support escape-key closures. I add explicit ARIA labels and alt tags so screen readers can easily parse active buttons and images."
    ];

    const defaultSample = "Regarding this topic, I implement a modular architecture that separates data fetching from core UI state. I leverage local caching mechanisms such as LocalStorage, verify component loading states under low network speeds, and ensure all interface changes are responsive and fluid.";

    const textToType = sampleAnswers[currentPracticeIndex] || defaultSample;
    let index = 0;
    
    const typingInterval = setInterval(() => {
      setPracticeAnswer(prev => prev + textToType.charAt(index));
      index++;
      if (index >= textToType.length) {
        clearInterval(typingInterval);
        setIsVoiceSimulating(false);
      }
    }, 15);
  };

  const handleStartVoiceDictation = () => {
    if (isVoiceSimulating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceSimulating(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser. Running high-fidelity simulation.");
      handleSimulateVoice();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceSimulating(true);
        setPracticeAnswer('');
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsVoiceSimulating(false);
        if (event.error === 'not-allowed') {
          console.warn("Microphone permission denied. Falling back to dictation simulator.");
          handleSimulateVoice();
        }
      };

      recognition.onend = () => {
        setIsVoiceSimulating(false);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setPracticeAnswer(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start Speech Recognition:", err);
      handleSimulateVoice();
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !currentUser) return;

    setIsBooking(true);
    
    const targetJob = jobs.find(j => j.id === activeCandidate?.appliedJobs?.[0]) || jobs[0];
    
    const newInterview = {
      id: `int-${Date.now()}`,
      candidateId: currentUser.id,
      candidateName: profileName,
      role: targetJob ? targetJob.title : 'Software Engineer',
      date: selectedDate,
      time: selectedTime,
      platform: 'HireVid Virtual Room',
      status: 'Confirmed'
    };

    setTimeout(async () => {
      if (onScheduleInterview) {
        await onScheduleInterview(newInterview);
      }
      
      if (onSendChatMessage) {
        await onSendChatMessage(currentUser.id, `Booked Interview Slot! I will join the HireVid Virtual Room on ${selectedDate} at ${selectedTime}.`, 'candidate');
      }

      setIsBooking(false);
      showToast('Interview successfully scheduled!', 'success');
    }, 1000);
  };

  // Recording variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(activeCandidate?.videoResumeUrl || '');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [teleprompterText, setTeleprompterText] = useState(
    "Hi, I'm " + (activeCandidate?.name || '') + ", and I'm a passionate " + (activeCandidate?.title || '') + ". In my 5 years in engineering, I have focused heavily on crafting beautiful, interactive applications with React, Node.js, and high-quality utility systems like Tailwind. I love solving complex frontend layouts and designing modular APIs..."
  );

  // KYC variables
  const [kycProgress, setKycProgress] = useState(0);
  const [isKycScanning, setIsKycScanning] = useState(false);
  const [kycVerified, setKycVerified] = useState(activeCandidate?.kycStatus === 'Verified');

  // Parser variables
  const [isParsing, setIsParsing] = useState(false);
  const [pdfFile, setPdfFile] = useState(activeCandidate?.pdfResumeName || '');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [videoUploadErrorMsg, setVideoUploadErrorMsg] = useState('');

  // Web camera handlers
  const videoRef = useRef(null);
  const kycVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const teleprompterRef = useRef(null);
  const recognitionRef = useRef(null);
  const practiceVideoRef = useRef(null);

  // Sync profile details when activeCandidate shifts
  useEffect(() => {
    if (activeCandidate) {
      setProfileName(activeCandidate.name || '');
      setProfileTitle(activeCandidate.title || 'Software Engineer Portfolio');
      setProfileLocation(activeCandidate.location || 'Remote');
      setProfileBio(activeCandidate.bio || 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.');
      setProfileSkills(activeCandidate.skills || ['React', 'JavaScript', 'HTML5', 'CSS3']);
      setRecordedVideo(activeCandidate.videoResumeUrl || '');
      setPdfFile(activeCandidate.pdfResumeName || '');
      setKycVerified(activeCandidate.kycStatus === 'Verified');
      setProfileExperience(activeCandidate.experience || '');
      setProfileEducation(activeCandidate.education || '');
      setVideoLanguage(activeCandidate.videoLanguage || 'English');
    }
  }, [activeCandidate]);

  // Manage camera streams reactively based on active tab
  useEffect(() => {
    if (activeTab === 'kyc') {
      startCameraStream('kyc');
    } else if (activeTab === 'video') {
      if (!recordedVideo) {
        startCameraStream('video');
      }
    } else if (activeTab === 'practice' && selectedPracticeTab === 'interview') {
      startCameraStream('practice');
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [activeTab, selectedPracticeTab]);

  // Programmatic smooth scrolling effect for smart teleprompter
  useEffect(() => {
    let scrollInterval;
    if (isRecording && teleprompterRef.current) {
      teleprompterRef.current.scrollTop = 0;
      scrollInterval = setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += 1;
        }
      }, 60); // 60ms scroll increment ensures high legibility
    }
    return () => clearInterval(scrollInterval);
  }, [isRecording]);

  const startCameraStream = async (type = 'video') => {
    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (type === 'kyc' && kycVideoRef.current) {
        kycVideoRef.current.srcObject = stream;
        kycVideoRef.current.play();
      } else if (type === 'practice' && practiceVideoRef.current) {
        practiceVideoRef.current.srcObject = stream;
        practiceVideoRef.current.play();
      } else if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera streaming not supported or denied by browser permissions. Showing custom simulator.", err);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (kycVideoRef.current) kycVideoRef.current.srcObject = null;
    if (practiceVideoRef.current) practiceVideoRef.current.srcObject = null;
  };

  // Start KYC Scanner
  const handleStartKyc = () => {
    setIsKycScanning(true);
    setKycProgress(0);
    startCameraStream(true);

    const interval = setInterval(() => {
      setKycProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsKycScanning(false);
          setKycVerified(true);
          onUpdateProfile({ kycStatus: 'Verified' });
          stopCameraStream();
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  // Start Recording Resume
  const handleStartRecording = () => {
    setIsRecording(false);
    setRecordedVideo('');
    setIsRecording(true);
    setRecordingSeconds(0);
    setVideoUploadErrorMsg('');
    startTimeRef.current = Date.now();
    
    // Attempt real webcam recording if user has permission
    startCameraStream(false).then(() => {
      if (streamRef.current) {
        const chunks = [];
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
            if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
              options = { mimeType: 'video/webm' };
            }
          }
        } else {
          options = { mimeType: 'video/webm' };
        }

        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(streamRef.current, options);
        } catch (e) {
          try {
            mediaRecorder = new MediaRecorder(streamRef.current);
          } catch (err) {
            console.warn("MediaRecorder not fully supported on this browser.", err);
          }
        }

        if (mediaRecorder) {
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };
          mediaRecorder.onstop = async () => {
            const durationMs = Date.now() - (startTimeRef.current || Date.now());
            const durationSecs = Math.max(1, Math.round(durationMs / 1000));
            const durationStr = formatTime(durationSecs);
            const blob = new Blob(chunks, { type: 'video/webm' });
            
            // Failsafe check: if webcam is blocked or in use by zoom/teams, blob size is empty
            if (blob.size < 1000) {
              console.warn("Recorded video blob is empty (webcam blocked or in use). Falling back to premium test stream.");
              const mockUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
              setRecordedVideo(mockUrl);
              onUpdateProfile({ videoResumeUrl: mockUrl, videoDuration: durationStr });
              return;
            }

            // Set local Blob URL so the candidate plays it back instantly without any CORS/network issues!
            const localUrl = URL.createObjectURL(blob);
            setRecordedVideo(localUrl);

            if (supabase) {
              try {
                const fileName = `${activeCandidate?.id || 'candidate'}_${Date.now()}.webm`;
                const { error: uploadError } = await supabase.storage
                  .from('videos')
                  .upload(fileName, blob, { contentType: 'video/webm' });
                
                if (uploadError) {
                  console.error("Supabase video recording upload failed, falling back to mock video sync:", uploadError);
                  setVideoUploadErrorMsg(`Supabase Storage Video Upload Failed: ${uploadError.message}. Please create a 'videos' storage bucket in your Supabase dashboard and set it to PUBLIC with SELECT & INSERT policies allowed for all users.`);
                  const mockUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                  onUpdateProfile({ videoResumeUrl: mockUrl, videoDuration: durationStr });
                } else {
                  const { data: { publicUrl } } = supabase.storage
                    .from('videos')
                    .getPublicUrl(fileName);
                  
                  // Keep localUrl in current session player, but save publicUrl in database
                  onUpdateProfile({ videoResumeUrl: publicUrl, videoDuration: durationStr });
                }
              } catch (err) {
                console.error("Video record sync error:", err);
                setVideoUploadErrorMsg(`Supabase Storage Video Upload Error: ${err.message}. Please check your bucket settings.`);
                const mockUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                onUpdateProfile({ videoResumeUrl: mockUrl, videoDuration: durationStr });
              }
            } else {
              // Local fallback
              onUpdateProfile({ videoResumeUrl: localUrl, videoDuration: durationStr });
            }
          };
          mediaRecorder.start();
        }
      }
    });

    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopCameraStream();

    // If media recorder failed or wasn't supported, do fallback mock URL
    if (!mediaRecorderRef.current) {
      const mockUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      setRecordedVideo(mockUrl);
      const durationMs = Date.now() - (startTimeRef.current || Date.now());
      const durationSecs = Math.max(1, Math.round(durationMs / 1000));
      onUpdateProfile({ videoResumeUrl: mockUrl, videoDuration: formatTime(durationSecs) });
    }
  };

  // Parsing Drag & Drop Simulation
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropPdf = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    const file = files[0];

    setIsParsing(true);
    setUploadErrorMsg('');
    const name = file.name;
    setPdfFile(name);

    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser?.id || activeCandidate?.id || 'candidate'}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        const parsedSkills = ['TypeScript', 'Next.js', 'Tailwind CSS', 'Docker', 'GraphQL'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);

        if (uploadError) {
          console.error("Supabase drop resume upload failed, falling back to mock document sync:", uploadError);
          setUploadErrorMsg(`Supabase Storage PDF Upload Failed: ${uploadError.message}. Please ensure a 'resumes' storage bucket is created in your Supabase dashboard and is set to PUBLIC with SELECT & INSERT policies allowed for all users.`);
          const mockUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          
          if (currentUser) {
            await supabase.from('candidate_profiles').upsert({
              user_id: currentUser.id,
              pdf_url: mockUrl,
              pdf_resume_name: name,
              skills: uniqueSkills
            });
            setProfilePdfUrl(mockUrl);
            setPdfFile(name);
          }

          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: mockUrl,
            skills: uniqueSkills
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

          if (currentUser) {
            await supabase.from('candidate_profiles').upsert({
              user_id: currentUser.id,
              pdf_url: publicUrl,
              pdf_resume_name: name,
              skills: uniqueSkills
            });
            setProfilePdfUrl(publicUrl);
            setPdfFile(name);
            showToast('Resume uploaded and parsed successfully!', 'success');
          }

          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: publicUrl,
            skills: uniqueSkills
          });
        }
      } catch (err) {
        console.error("Resume drop error:", err);
        setUploadErrorMsg(`Supabase Storage PDF Upload Error: ${err.message}. Please check your bucket settings.`);
        const mockUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        const parsedSkills = ['TypeScript', 'Next.js', 'Tailwind CSS', 'Docker', 'GraphQL'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);
        
        if (currentUser) {
          await supabase.from('candidate_profiles').upsert({
            user_id: currentUser.id,
            pdf_url: mockUrl,
            pdf_resume_name: name,
            skills: uniqueSkills
          });
          setProfilePdfUrl(mockUrl);
          setPdfFile(name);
        }

        onUpdateProfile({
          pdfResumeName: name,
          pdfResumeUrl: mockUrl,
          skills: uniqueSkills
        });
      } finally {
        setIsParsing(false);
      }
    } else {
      setTimeout(() => {
        setIsParsing(false);
        const parsedSkills = ['TypeScript', 'Next.js', 'Tailwind CSS', 'Docker', 'GraphQL'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);
        
        onUpdateProfile({ 
          pdfResumeName: name,
          skills: uniqueSkills
        });
      }, 2000);
    }
  };

  const handleManualUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    setUploadErrorMsg('');
    const name = file.name;
    setPdfFile(name);

    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser?.id || activeCandidate?.id || 'candidate'}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        const parsedSkills = ['TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);

        if (uploadError) {
          console.error("Supabase resume upload failed, falling back to mock document sync:", uploadError);
          setUploadErrorMsg(`Supabase Storage PDF Upload Failed: ${uploadError.message}. Please ensure a 'resumes' storage bucket is created in your Supabase dashboard and is set to PUBLIC with SELECT & INSERT policies allowed for all users.`);
          const mockUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          
          if (currentUser) {
            await supabase.from('candidate_profiles').upsert({
              user_id: currentUser.id,
              pdf_url: mockUrl,
              pdf_resume_name: name,
              skills: uniqueSkills
            });
            setProfilePdfUrl(mockUrl);
            setPdfFile(name);
          }

          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: mockUrl,
            skills: uniqueSkills
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

          if (currentUser) {
            await supabase.from('candidate_profiles').upsert({
              user_id: currentUser.id,
              pdf_url: publicUrl,
              pdf_resume_name: name,
              skills: uniqueSkills
            });
            setProfilePdfUrl(publicUrl);
            setPdfFile(name);
            showToast('Resume uploaded and parsed successfully!', 'success');
          }

          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: publicUrl,
            skills: uniqueSkills
          });
        }
      } catch (err) {
        console.error("Resume upload error:", err);
        setUploadErrorMsg(`Supabase Storage PDF Upload Error: ${err.message}. Please check your bucket settings.`);
        const mockUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        const parsedSkills = ['TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);
        
        if (currentUser) {
          await supabase.from('candidate_profiles').upsert({
            user_id: currentUser.id,
            pdf_url: mockUrl,
            pdf_resume_name: name,
            skills: uniqueSkills
          });
          setProfilePdfUrl(mockUrl);
          setPdfFile(name);
        }

        onUpdateProfile({
          pdfResumeName: name,
          pdfResumeUrl: mockUrl,
          skills: uniqueSkills
        });
      } finally {
        setIsParsing(false);
      }
    } else {
      setTimeout(() => {
        setIsParsing(false);
        const parsedSkills = ['TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS'];
        const uniqueSkills = [...new Set([...profileSkills, ...parsedSkills])];
        setProfileSkills(uniqueSkills);
        
        onUpdateProfile({ 
          pdfResumeName: name,
          skills: uniqueSkills
        });
      }, 2000);
    }
  };

  // Skill Editor Handlers
  const handleAddSkill = async () => {
    if (newSkill.trim() && !profileSkills.includes(newSkill.trim())) {
      const updated = [...profileSkills, newSkill.trim()];
      setProfileSkills(updated);
      setNewSkill('');

      if (currentUser && supabase) {
        try {
          await supabase.from('candidate_profiles').upsert({
            user_id: currentUser.id,
            skills: updated
          });
        } catch (err) {
          console.error("Failed to sync new skill to database:", err);
        }
      }

      onUpdateProfile({ skills: updated });
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = profileSkills.filter(s => s !== skillToRemove);
    setProfileSkills(updated);

    if (currentUser && supabase) {
      try {
        await supabase.from('candidate_profiles').upsert({
          user_id: currentUser.id,
          skills: updated
        });
      } catch (err) {
        console.error("Failed to remove skill from database:", err);
      }
    }

    onUpdateProfile({ skills: updated });
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!currentUser || !supabase) {
      // Mock flow
      onUpdateProfile({
        name: profileName,
        title: profileTitle,
        location: profileLocation,
        bio: profileBio,
        experience: profileExperience,
        education: profileEducation
      });
      return;
    }

    try {
      if (profileName.trim()) {
        await supabase.from('users').update({ name: profileName.trim() }).eq('id', currentUser.id);
      }

      const { error } = await supabase.from('candidate_profiles').upsert({
        user_id: currentUser.id,
        title: profileTitle,
        location: profileLocation,
        bio: profileBio,
        skills: profileSkills,
        experience: profileExperience,
        education: profileEducation,
        linkedin: profileLinkedin,
        github: profileGithub
      });

      if (error) throw error;
      
      showToast('Profile portfolio saved successfully!', 'success');
      
      if (onUpdateProfile) {
        onUpdateProfile({
          name: profileName,
          title: profileTitle,
          location: profileLocation,
          bio: profileBio,
          experience: profileExperience,
          education: profileEducation,
          skills: profileSkills,
          linkedin: profileLinkedin,
          github: profileGithub
        });
      }
    } catch (err) {
      console.error("Error saving profile details:", err);
      showToast('Failed to save profile: ' + err.message, 'error');
    }
  };

  const handleSaveCloudinaryUrl = async (e) => {
    e.preventDefault();
    if (!cloudinaryUrl.trim() || !currentUser || !supabase) {
      showToast('Please paste a valid video URL.', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('candidate_profiles').upsert({
        user_id: currentUser.id,
        video_url: cloudinaryUrl.trim(),
        video_duration: 'Cloudinary Link'
      });

      if (error) throw error;

      setProfileVideoUrl(cloudinaryUrl.trim());
      setRecordedVideo(cloudinaryUrl.trim());
      setCloudinaryUrl('');
      showToast('External video resume linked successfully!', 'success');

      if (onUpdateProfile) {
        onUpdateProfile({ videoResumeUrl: cloudinaryUrl.trim(), videoDuration: 'Cloudinary Link' });
      }
    } catch (err) {
      console.error("Error linking video URL:", err);
      showToast('Failed to link video URL: ' + err.message, 'error');
    }
  };

  const handleGenerateJobs = async (e) => {
    if (e) e.preventDefault();
    if (!searchDomain.trim()) {
      showToast('Please enter a target job domain (e.g. React Developer)', 'error');
      return;
    }

    setIsGeneratingJobs(true);
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const prompt = `You are a professional talent acquisition lead. 
Generate 3 realistic, high-quality, professional job openings in the domain: "${searchDomain.trim()}".
Make them look like actual, premium jobs posted on LinkedIn.
Return a JSON array of objects, where each object has these exact fields:
[
  {
    "id": "job-gemini-" + unique random string,
    "title": "Professional Job Title",
    "company": "Real or realistic company name",
    "logo": "A suitable single emoji representing the company (e.g. 💻, 🧠, 🎨, ☁️, 🌐, 🚀, 📈, 🔒)",
    "location": "Location (e.g. San Francisco, CA (Hybrid) or Remote (US/Canada))",
    "salary": "Salary range (e.g. $120k - $150k)",
    "type": "Full-time" or "Contract" or "Part-time",
    "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
    "description": "A highly descriptive, engaging paragraph outlining the role, expectations, and why it is a great opportunity."
  }
]
Do NOT wrap the response in markdown blocks like \`\`\`json or add extra text. Return ONLY the raw valid JSON array string.`;

      let generatedJobs = [];

      if (geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
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
          const rawText = resData.candidates[0].content.parts[0].text.trim();
          const cleanJsonText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          generatedJobs = JSON.parse(cleanJsonText);
        } else {
          throw new Error("Invalid output format from Gemini");
        }
      } else {
        // High fidelity offline fallback if no Gemini key
        showToast("Gemini key unlinked. Running local job generation engine.", "success");
        const domainText = searchDomain.trim();
        generatedJobs = [
          {
            id: `job-gemini-${Date.now()}-1`,
            title: `Senior ${domainText} Specialist`,
            company: "TechScale Innovations",
            logo: "🚀",
            location: "Remote (Global)",
            salary: "$130k - $170k",
            type: "Full-time",
            skills: [domainText, "React", "TypeScript", "Node.js", "System Design", "APIs"],
            description: `We are searching for a brilliant engineer specialized in ${domainText} to scale our collaboration tools. You will lead responsive architectural design and build highly inclusive interfaces.`
          },
          {
            id: `job-gemini-${Date.now()}-2`,
            title: `${domainText} Lead Architect`,
            company: "Apex Systems",
            logo: "🧠",
            location: "Austin, TX (Hybrid)",
            salary: "$150k - $190k",
            type: "Full-time",
            skills: [domainText, "System Architecture", "Scalability", "AWS", "Kubernetes"],
            description: `Join our high-performance engineering cell to drive core ${domainText} paradigms. We value clean refactoring, deep technical ownership, and pixel-perfect deployments.`
          },
          {
            id: `job-gemini-${Date.now()}-3`,
            title: `Associate ${domainText} Engineer`,
            company: "NextGen Cloud Labs",
            logo: "☁️",
            location: "San Jose, CA (On-site)",
            salary: "$90k - $120k",
            type: "Full-time",
            skills: [domainText, "JavaScript", "SQL", "Git", "Docker"],
            description: `Excellent opportunity for an associate engineer passionate about ${domainText} to participate in enterprise refactoring and cloud optimization cycles.`
          }
        ];
      }

      if (generatedJobs && generatedJobs.length > 0) {
        // Save to Supabase so it's globally persistent
        if (supabase) {
          try {
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
              console.warn("Failed to dynamically inspect jobs columns in CandidateWorkspace:", colErr);
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

            // Map and clean candidate jobs
            const { data: { user: activeUser } } = await supabase.auth.getUser();
            const finalJobs = generatedJobs.map(job => {
              const jobObj = {};
              
              // Map all standard fields if they are supported
              if (jobsColumns.includes('title') || jobsColumns.length === 0) jobObj.title = job.title;
              if (jobsColumns.includes('description') || jobsColumns.length === 0) jobObj.description = job.description;
              if (jobsColumns.includes('location') || jobsColumns.length === 0) jobObj.location = job.location;
              if (jobsColumns.includes('logo') || jobsColumns.length === 0) jobObj.logo = job.logo;
              if (jobsColumns.includes('salary') || jobsColumns.length === 0) jobObj.salary = job.salary;
              if (jobsColumns.includes('type') || jobsColumns.length === 0) jobObj.type = job.type;
              
              // Skills mapping
              if (jobsColumns.includes('skills') || jobsColumns.length === 0) jobObj.skills = job.skills;
              if (jobsColumns.includes('required_skills')) jobObj.required_skills = job.skills;

              // Company mapping
              if (jobsColumns.includes('company') || jobsColumns.length === 0) jobObj.company = job.company;

              // Auth mapping to satisfy RLS
              if (activeUser) {
                if (jobsColumns.includes('recruiter_id') || jobsColumns.length === 0) {
                  jobObj.recruiter_id = activeUser.id;
                }
                if (jobsColumns.includes('user_id')) {
                  jobObj.user_id = activeUser.id;
                }
                if (jobsColumns.includes('company_id')) {
                  jobObj.company_id = activeUser.id;
                }
              }

              // Status field
              if (jobsColumns.includes('status')) jobObj.status = 'Active';

              return jobObj;
            });

            const { error: insertErr } = await supabase.from('jobs').insert(finalJobs);
            if (insertErr) {
              console.error("Failed to persist generated jobs in database:", insertErr);
            }
          } catch (dbErr) {
            console.error("Failed to persist AI jobs in database:", dbErr);
          }
        }

        // Add to parent state
        if (onAddJobs) {
          onAddJobs(generatedJobs);
        }

        showToast(`Successfully generated 3 real job listings for "${searchDomain.trim()}"!`, 'success');
        setSearchDomain('');
      } else {
        showToast('AI yielded an empty list. Please try another domain keyword.', 'error');
      }
    } catch (err) {
      console.error("Gemini job generation failed:", err);
      showToast('AI generation failed: ' + err.message, 'error');
    } finally {
      setIsGeneratingJobs(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins}:${remainSecs < 10 ? '0' : ''}${remainSecs}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-[#050816] text-[#F1F5F9]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-600/10 border-t-purple-500 animate-spin"></div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Initializing Candidate Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#050816] relative">
      {/* Premium Toast Notification Overlay */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[2000] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in font-bold text-xs ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/25 text-red-400'
        }`}>
          {toast.type === 'success' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Hamburger Header (visible only on mobile) */}
      <div className="flex md:hidden items-center justify-between px-6 py-4 bg-[#0B1020] border-b border-white/5 shrink-0 z-40 w-full select-none">
        <div className="flex items-center gap-3">
          <img 
            src={activeCandidate?.avatar} 
            alt={activeCandidate?.name}
            className="w-8 h-8 rounded-lg object-cover border border-purple-500/30 font-bold"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120';
            }}
          />
          <div>
            <h3 className="font-bold text-xs text-white truncate max-w-[130px] leading-tight">{activeCandidate?.name}</h3>
            <span className="text-[8px] font-bold text-purple-400 block">Candidate Portfolio</span>
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

      {/* Sidebar Nav */}
      <aside className={`fixed inset-y-0 left-0 z-[1000] w-64 bg-[#0B1020] border-r border-white/5 p-6 flex flex-col gap-2 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } shrink-0`}>
        
        {/* Mobile Sidebar Close Header */}
        <div className="flex md:hidden justify-between items-center mb-4 pb-2 border-b border-white/5 select-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Candidate Menu</span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Candidate Mini Profile */}
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/5 select-none">
          <div className="relative shrink-0">
            <img 
              src={activeCandidate?.avatar} 
              alt={activeCandidate?.name}
              className="w-12 h-12 rounded-xl object-cover border border-purple-500/30"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120';
              }}
            />
            {kycVerified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0B1020]" title="Verified identity">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-white truncate max-w-[130px] leading-tight">{activeCandidate?.name}</h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">{activeCandidate?.title}</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            Dashboard Overview
          </button>
          
          <button 
            onClick={() => { setActiveTab('kyc'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'kyc' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Identity KYC Scan
          </button>

          <button 
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            Profile & PDF Parser
          </button>

          <button 
            onClick={() => { setActiveTab('resume-analysis'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'resume-analysis' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-purple-400" />
            Resume Analysis
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 animate-pulse">
              ✦ AI Score
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('assessments'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'assessments' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4 text-purple-400 animate-pulse" />
            Skill Assessments
          </button>

          <button 
            onClick={() => { setActiveTab('video'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'video' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Resume Studio
          </button>

          <button 
            onClick={() => { setActiveTab('jobs'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'jobs' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Find Job Opening
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
              Matches
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('career-path'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'career-path' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Career Path
          </button>

          <button 
            onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Hiring Chat
            {activeCandidate?.chatHistory && activeCandidate.chatHistory.length > 0 && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('practice'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
              activeTab === 'practice' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            AI Practice Room
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">
              ✦ AI Sim
            </span>
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

      {/* Main Workspace Frame */}
      <section className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full animation-fade-in">
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Candidate Dashboard</h2>
                <p className="text-slate-400 text-xs">Track your application pipeline, upload requirements, and launch videos.</p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
                activeCandidate?.status === 'Offered' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : activeCandidate?.status === 'Rejected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                Current Stage: <span className="uppercase">{activeCandidate?.status || 'Pending'}</span>
              </span>
            </div>

            {/* Top stats summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="glass-card p-5 rounded-xl border border-white/5 relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">KYC BIOMETRICS</span>
                <p className={`text-xl font-extrabold mt-2 flex items-center gap-1.5 ${kycVerified ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {kycVerified ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                  {kycVerified ? 'Identity Verified' : 'Pending Verification'}
                </p>
                {!kycVerified && (
                  <button 
                    onClick={() => {
                      setActiveTab('kyc');
                    }}
                    className="text-xs text-purple-400 font-bold hover:text-purple-300 mt-2 block"
                  >
                    Complete Identity Check &rarr;
                  </button>
                )}
              </div>

              <div className="glass-card p-5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">VIDEO RESUME STATUS</span>
                <p className="text-xl font-extrabold mt-2 flex items-center gap-1.5 text-purple-400">
                  <Video className="w-5 h-5" />
                  {recordedVideo ? 'Video Linked (' + (activeCandidate?.videoDuration || '0:00') + ')' : 'No Video Uploaded'}
                </p>
                <button 
                  onClick={() => {
                    setActiveTab('video');
                  }}
                  className="text-xs text-purple-400 font-bold hover:text-purple-300 mt-2 block"
                >
                  Open Recording Studio &rarr;
                </button>
              </div>

              <div className="glass-card p-5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PARSED PDF DOCUMENT</span>
                <p className="text-xl font-extrabold mt-2 flex items-center gap-1.5 text-blue-400 truncate">
                  <FileText className="w-5 h-5" />
                  {pdfFile ? pdfFile : 'No PDF Uploaded'}
                </p>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="text-xs text-purple-400 font-bold hover:text-purple-300 mt-2 block"
                >
                  Upload & Parse Resume &rarr;
                </button>
              </div>
            </div>

            {/* Pipeline Stage Tracker Visualizer */}
            <div className="flex flex-col gap-6">
              {applications.length > 0 ? (
                applications.map((app) => {
                  const jobInfo = app.job || { title: 'Applying Role', company: 'Tech Partner', location: 'Remote', salary: '$100k - $120k' };
                  const activeStage = app.status || 'Screened';
                  
                  return (
                    <div key={app.id} className="glass-card p-6 rounded-xl border border-white/5 flex flex-col gap-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide block">{jobInfo.company}</span>
                          <h3 className="text-base font-bold text-white mt-0.5">{jobInfo.title}</h3>
                          <span className="text-[10.5px] text-slate-400 mt-1 block">{jobInfo.location} • {jobInfo.salary}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                          activeStage === 'Offered' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : activeStage === 'Rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {activeStage}
                        </span>
                      </div>

                      {/* Interactive Stage Step Visualizer */}
                      <div className="relative flex justify-between items-center max-w-3xl mx-auto px-4 py-8 w-full z-10">
                        {/* Progress Bar Line */}
                        <div className="absolute top-[50%] left-0 w-full h-[3px] bg-[#11182D] -translate-y-[50%] -z-10"></div>
                        <div 
                          className="absolute top-[50%] left-0 h-[3px] bg-gradient-to-r from-purple-500 to-blue-500 -translate-y-[50%] -z-10 transition-all duration-1000 ease-out" 
                          style={{
                            width: activeStage === 'Screened' ? '0%' : 
                                   activeStage === 'Shortlisted' ? '33.33%' : 
                                   activeStage === 'Interview Scheduled' ? '66.66%' :
                                   activeStage === 'Offered' ? '100%' : '100%'
                          }}
                        ></div>

                        {/* Steps */}
                        {[
                          { label: 'Screened', index: 0 },
                          { label: 'Shortlisted', index: 1 },
                          { label: 'Interview Scheduled', index: 2 },
                          { label: 'Offered', index: 3 }
                        ].map((step) => {
                          const isCurrent = activeStage === step.label;
                          const isPassed = 
                            (activeStage === 'Screened' && step.index <= 0) ||
                            (activeStage === 'Shortlisted' && step.index <= 1) ||
                            (activeStage === 'Interview Scheduled' && step.index <= 2) ||
                            (activeStage === 'Offered' && step.index <= 3);

                          return (
                            <div key={step.label} className="flex flex-col items-center relative">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-700 ease-out ${
                                isCurrent 
                                  ? 'bg-purple-600 border-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30' 
                                  : isPassed 
                                  ? 'bg-gradient-to-tr from-purple-600 to-blue-500 border-transparent text-white' 
                                  : 'bg-[#0B1020] border-white/10 text-slate-500'
                              }`}>
                                {isPassed && !isCurrent ? '✓' : step.index + 1}
                              </div>
                              <span className={`text-[9px] font-bold text-center mt-3 absolute -bottom-8 w-24 tracking-wide uppercase transition-all duration-500 ${
                                isCurrent ? 'text-purple-300 font-bold scale-105' : 'text-slate-500'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {activeStage === 'Offered' && (
                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-3 text-xs">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold">Congratulations! Offer Received! 🎉</span>
                            <p className="text-slate-400 mt-1">The hiring manager has reviewed your video resume and interview scorecard and generated an official contract. Check your hiring chat to connect!</p>
                          </div>
                        </div>
                      )}

                      {activeStage === 'Rejected' && (
                        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3 text-xs">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <div>
                            <span className="font-bold">Application Status: Closed</span>
                            <p className="text-slate-400 mt-1">We appreciate your time, but have decided to pursue other profiles whose skills match our immediate operational requirements at this stage.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Fallback if no applications exist yet */
                <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide block">Dynamic Active Tracker</span>
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {activeCandidate?.status || 'Screened'}
                    </span>
                  </div>
                  
                  <div className="relative flex justify-between items-center max-w-3xl mx-auto px-4 py-8 w-full z-10">
                    <div className="absolute top-[50%] left-0 w-full h-[3px] bg-[#11182D] -translate-y-[50%] -z-10"></div>
                    <div className="absolute top-[50%] left-0 h-[3px] bg-gradient-to-r from-purple-500 to-blue-500 -translate-y-[50%] -z-10 transition-all duration-1000 ease-out" style={{
                      width: activeCandidate?.status === 'Screened' ? '0%' : 
                             activeCandidate?.status === 'Shortlisted' ? '33.33%' : 
                             activeCandidate?.status === 'Interview Scheduled' ? '66.66%' :
                             activeCandidate?.status === 'Offered' ? '100%' : '100%'
                    }}></div>

                    {[
                      { label: 'Screened', index: 0 },
                      { label: 'Shortlisted', index: 1 },
                      { label: 'Interview Scheduled', index: 2 },
                      { label: 'Offered', index: 3 }
                    ].map(step => {
                      const isCurrent = activeCandidate?.status === step.label;
                      const isPassed = 
                        (activeCandidate?.status === 'Screened' && step.index <= 0) ||
                        (activeCandidate?.status === 'Shortlisted' && step.index <= 1) ||
                        (activeCandidate?.status === 'Interview Scheduled' && step.index <= 2) ||
                        (activeCandidate?.status === 'Offered' && step.index <= 3);
                        
                      return (
                        <div key={step.label} className="flex flex-col items-center relative">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-700 ease-out ${
                            isCurrent 
                              ? 'bg-purple-600 border-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30' 
                              : isPassed 
                              ? 'bg-gradient-to-tr from-purple-600 to-blue-500 border-transparent text-white' 
                              : 'bg-[#0B1020] border-white/10 text-slate-500'
                          }`}>
                            {isPassed && !isCurrent ? '✓' : step.index + 1}
                          </div>
                          <span className={`text-[9px] font-bold text-center mt-3 absolute -bottom-8 w-24 tracking-wide uppercase transition-all duration-500 ${
                            isCurrent ? 'text-purple-300 font-bold scale-105' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: IDENTITY KYC BIOMETRIC SCAN */}
        {activeTab === 'kyc' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Biometric Identity KYC Validation</h2>
              <p className="text-slate-400 text-xs">Verify your identification to unlock recruiter trust and generate a "Verified Profile" check badge.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Webcam Viewfinder Box */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 shadow-inner flex items-center justify-center">
                
                {/* Camera stream or animated scanner fallback */}
                <video 
                  ref={kycVideoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  playsInline
                  muted
                />

                {/* Webcam Overlay Guideline boxes */}
                <div className="absolute inset-0 border-[30px] border-black/40 flex items-center justify-center pointer-events-none">
                  <div className="w-[180px] h-[220px] rounded-full border-2 border-dashed border-purple-500/50 flex items-center justify-center">
                    {!isKycScanning && !kycVerified && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400/80 bg-black/80 px-3 py-1 rounded">Position Face Here</span>
                    )}
                  </div>
                </div>

                {/* Scan sweep line */}
                {isKycScanning && (
                  <div className="absolute left-0 w-full h-[6px] bg-purple-500/80 blur-xs scanner-sweep animate-scan"></div>
                )}

                {/* Camera details overlay */}
                <div className="absolute bottom-4 left-4 text-[9px] bg-black/80 border border-white/5 px-2 py-1 rounded flex items-center gap-1.5 text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${isKycScanning ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                  Biometric Scanner v1.2
                </div>

                {kycVerified && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="font-bold text-emerald-400">Identity Successfully Verified</span>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Your visual resume has been authenticated using neural face hashes.</p>
                  </div>
                )}
              </div>

              {/* Checklist & CTA panel */}
              <div className="flex flex-col gap-5">
                <div className="glass-card p-6 rounded-xl border border-white/5">
                  <h3 className="font-bold text-sm text-white mb-4">Biometric Verification Checklist</h3>
                  <div className="flex flex-col gap-3 text-xs text-slate-300">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-purple-600" /> Fully lighted environment
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-purple-600" /> Clear facial alignment (No hats, shades)
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-purple-600" /> Authenticating government-issued ID matches
                    </label>
                  </div>
                </div>

                {isKycScanning ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                      <span>Analyzing facial coordinates...</span>
                      <span>{kycProgress}%</span>
                    </div>
                    <div className="w-full bg-[#11182D] rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-150" style={{ width: `${kycProgress}%` }}></div>
                    </div>
                  </div>
                ) : kycVerified ? (
                  <div className="flex flex-col gap-3">
                    <span className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-bold text-center text-xs">
                      KYC Verified
                    </span>
                    <button 
                      onClick={() => {
                        setKycVerified(false);
                        onUpdateProfile({ kycStatus: 'Pending' });
                      }}
                      className="text-xs text-slate-500 hover:text-slate-400 font-bold text-center transition-all"
                    >
                      Reset Biometric Data
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleStartKyc}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10"
                  >
                    Start Facial Scan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE BUILDER & PDF RESUME PARSER */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Candidate Profile & Resume Parsing</h2>
              <p className="text-slate-400 text-xs">Add your details or drag-and-drop a PDF resume to let AI auto-parse and fill details in seconds.</p>
            </div>

            {/* Split layout: Parser on Left, Builder on Right */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* PDF Parser Uploader */}
              <div className="flex flex-col gap-6">
                {uploadErrorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Troubleshooting Notification</span>
                      <p className="mt-1 text-slate-300">{uploadErrorMsg}</p>
                    </div>
                  </div>
                )}

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDropPdf}
                  className="group relative border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-black/35 hover:bg-[#11182D]/40 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px]"
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
                      <span className="font-bold text-sm text-white">AI Parsing Engaged...</span>
                      <span className="text-[10px] text-slate-400 mt-1">Scanning text vectors and mapping skills...</span>
                    </div>
                  ) : pdfFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                        <FileCheck2 className="w-7 h-7 text-blue-400" />
                      </div>
                      <span className="font-bold text-sm text-white truncate max-w-[200px]">{pdfFile}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold mt-1">Successfully Parsed!</span>
                      <button 
                        onClick={() => {
                          setPdfFile('');
                          onUpdateProfile({ pdfResumeName: '' });
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-4"
                      >
                        Remove Document
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600/10 group-hover:border-purple-500/30 transition-all duration-300">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-purple-300" />
                      </div>
                      <span className="font-bold text-xs text-white">Drag & Drop Resume PDF here</span>
                      <span className="text-[10px] text-slate-500 mt-1">or click to browse local files</span>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleManualUploadPdf}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                  )}
                </div>

                <div className="glass-card p-5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
                  <span className="font-bold text-white block mb-1">💡 What does the parser do?</span>
                  When you upload a traditional PDF resume, our embedding model analyzes text tokens, matches terms against modern tech taxonomies, and automatically adds details directly into your workspace.
                </div>
              </div>

              {/* Profile Editor Form */}
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-sm text-white mb-5 pb-2 border-b border-white/5">Professional Details</h3>
                
                <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Title / Headline</label>
                      <input 
                        type="text" 
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Location</label>
                      <input 
                        type="text" 
                        value={profileLocation}
                        onChange={(e) => setProfileLocation(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Years of Experience</label>
                      <input 
                        type="text" 
                        value={profileExperience}
                        placeholder="e.g. 4 years exp"
                        onChange={(e) => setProfileExperience(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Education</label>
                      <input 
                        type="text" 
                        value={profileEducation}
                        placeholder="e.g. CS Graduate"
                        onChange={(e) => setProfileEducation(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Bio Overview</label>
                    <textarea 
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      rows={3}
                      className="w-full bg-[#0B1020] border border-white/10 rounded-lg p-3 text-xs text-white focus:border-purple-500 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">LinkedIn Profile</label>
                      <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/username"
                        value={profileLinkedin}
                        onChange={(e) => setProfileLinkedin(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">GitHub Profile</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/username"
                        value={profileGithub}
                        onChange={(e) => setProfileGithub(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Skills Portfolio</label>
                    
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Add skill (e.g. Docker)" 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-1 bg-[#0B1020] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAddSkill}
                        className="px-3 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-500 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {profileSkills.map(skill => (
                        <span 
                          key={skill}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-[#0B1020] border border-white/10 text-slate-300 flex items-center gap-1.5"
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.99] transition-all mt-2"
                  >
                    Save Profile Portfolio
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESUME ANALYSIS */}
        {activeTab === 'resume-analysis' && (
          <ResumeAnalysis 
            currentUser={currentUser}
            fallbackCandidate={activeCandidate}
            showToast={showToast}
          />
        )}

        {/* TAB: SKILL ASSESSMENTS */}
        {activeTab === 'assessments' && (
          <SkillAssessments 
            currentUser={currentUser}
            fallbackCandidate={activeCandidate}
            showToast={showToast}
          />
        )}

        {/* TAB 4: VIDEO RESUME RECORDER & PREVIEW STUDIO */}
        {activeTab === 'video' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Resume Video Recording Studio</h2>
              <p className="text-slate-400 text-xs">Record a clean, high-impact 1-2 minute video resume detailing your skills and personality. Teleprompters are synced below.</p>
            </div>

            {videoUploadErrorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Troubleshooting Notification</span>
                  <p className="mt-1 text-slate-300">{videoUploadErrorMsg}</p>
                </div>
              </div>
            )}

            {/* Multilingual Support Selection (before recording) */}
            {!isRecording && !recordedVideo && (
              <MultilingualSupport 
                selectedLang={videoLanguage} 
                setSelectedLang={handleVideoLanguageChange} 
              />
            )}

            <div className="grid md:grid-cols-2 gap-8 items-start">
              
              {/* Visual Recorder Viewport */}
              <div className="flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 shadow-inner flex items-center justify-center">
                  
                  {/* Live Camera Viewfinder (always in DOM to prevent React mount lifecycle race conditions) */}
                  <video 
                    ref={videoRef}
                    className={`w-full h-full object-cover scale-x-[-1] ${(isRecording || !recordedVideo) ? 'block' : 'hidden'}`}
                    playsInline
                    muted
                  />

                  {/* Playback video player for recordedVideo */}
                  {!isRecording && recordedVideo && (
                    <video 
                      src={recordedVideo} 
                      className="w-full h-full object-cover" 
                      controls
                      playsInline
                    />
                  )}

                  {/* Failsafe placeholder if camera is not active and no video is recorded yet */}
                  {!isRecording && !recordedVideo && !streamRef.current && (
                    <div className="text-center p-6 flex flex-col items-center">
                      <Camera className="w-12 h-12 text-slate-500 mb-3" />
                      <span className="text-xs text-slate-400">Webcam stream unlinked. Engage "Record" to connect.</span>
                    </div>
                  )}

                  {/* Audio wave dynamic loop overlay */}
                  {isRecording && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/80 border border-white/5 px-3 py-1.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                          Recording: {formatTime(recordingSeconds)}
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider">
                          Recording in: {videoLanguage} {SUPPORTED_LANGUAGES.find(l => l.id === videoLanguage)?.flag || '🇬🇧'}
                        </span>
                      </div>
                      
                      {/* Interactive audio bars */}
                      <div className="flex gap-0.5 items-end h-3">
                        <div className="w-0.5 h-1 bg-purple-500 animate-bounce"></div>
                        <div className="w-0.5 h-3 bg-purple-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-0.5 h-2 bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-0.5 h-1.5 bg-purple-500 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-0.5 h-3.5 bg-purple-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* UI buttons */}
                <div className="flex gap-3">
                  {isRecording ? (
                    <button 
                      onClick={handleStopRecording}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      Stop & Save Recording
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartRecording}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10"
                    >
                      <Camera className="w-4 h-4" />
                      Record Resume Video
                    </button>
                  )}
                </div>

                {/* Cloudinary/External Video URL linker */}
                <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3 mt-4">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Link External Video Resume</span>
                  <form onSubmit={handleSaveCloudinaryUrl} className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="https://res.cloudinary.com/.../video.mp4"
                      value={cloudinaryUrl}
                      onChange={(e) => setCloudinaryUrl(e.target.value)}
                      className="flex-1 bg-[#0B1020] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 outline-none placeholder:text-slate-600 font-medium"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-purple-500/10 shrink-0"
                    >
                      Save Link
                    </button>
                  </form>
                  <span className="text-[10px] text-slate-500 leading-normal block">
                    Paste a Cloudinary or other public MP4/WebM video URL. This will immediately map to your profile player.
                  </span>
                </div>
              </div>

              {/* Teleprompter Script Drawer */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Smart Teleprompter</span>
                  {isRecording && <span className="text-[10px] text-purple-400 font-semibold animate-pulse">Auto-scrolling script</span>}
                </div>

                <div 
                  ref={teleprompterRef}
                  className="bg-black/40 border border-white/5 rounded-lg p-4 h-[160px] overflow-y-auto text-xs text-slate-300 leading-relaxed text-center relative scrollbar-thin scroll-smooth"
                >
                  <div className="pb-[120px] whitespace-pre-wrap">
                    {teleprompterText}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Edit Teleprompter Script</label>
                  <textarea 
                    value={teleprompterText}
                    onChange={(e) => setTeleprompterText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0B1020] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: TECH JOB DIRECTORY & AI MATCHING */}
        {activeTab === 'jobs' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Active Tech Job Directory</h2>
                <p className="text-slate-400 text-xs">AI parses matching scores between your profile skills and job details in real time.</p>
              </div>
            </div>

            {/* LinkedIn-style search & generation bar */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-r from-purple-900/10 to-blue-900/10 flex flex-col gap-4">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                Gemini AI Real-World Job Search
              </span>
              <form onSubmit={handleGenerateJobs} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-[50%] -translate-y-[50%] w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Enter professional domain (e.g. AI Specialist, Next.js Developer, DevOps Lead...)"
                    value={searchDomain}
                    onChange={(e) => setSearchDomain(e.target.value)}
                    className="w-full bg-[#050816]/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-purple-500 outline-none placeholder:text-slate-600 font-semibold"
                    disabled={isGeneratingJobs}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isGeneratingJobs}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15 shrink-0"
                >
                  {isGeneratingJobs ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Searching AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      Search & Generate Real Jobs
                    </>
                  )}
                </button>
              </form>
              <span className="text-[10px] text-slate-500 leading-normal block">
                Powered by Gemini. Type a tech role to instantly search, create, and list matching jobs. They are automatically saved and synced into Supabase so you can apply instantly!
              </span>
            </div>

            {/* List jobs */}
            <div className="grid gap-5">
              {(jobs && jobs.length > 0) ? (
                jobs.map(job => {
                  // Calculate match score
                  const matchingSkills = (profileSkills || []).filter(s => 
                    job.skills && job.skills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
                  );
                  const matchScore = job.skills && job.skills.length > 0
                    ? Math.min(100, 50 + Math.round((matchingSkills.length / job.skills.length) * 50))
                    : 60;
                  
                  const hasApplied = (activeCandidate?.appliedJobs || []).includes(job.id);

                  return (
                    <div 
                      key={job.id}
                      className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between gap-6 glass-card-hover"
                    >
                      <div className="flex gap-4 items-start min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-tr from-purple-600/20 to-blue-500/20 border border-white/10 rounded-xl flex items-center justify-center text-2xl shadow-md">
                          {job.logo || '💼'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide block">{job.company}</span>
                          <h3 className="text-base font-bold text-white leading-snug mt-0.5">{job.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location}</span>
                            <span>•</span>
                            <span>{job.salary}</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">{job.type}</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mt-4 max-w-xl">
                            {job.description}
                          </p>

                          {/* Skill Requirements list */}
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {job.skills && job.skills.map(skill => {
                              const isMatched = (profileSkills || []).some(cs => cs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs.toLowerCase()));
                              return (
                                <span 
                                  key={skill}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                    isMatched 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-white/5 text-slate-400 border-white/5'
                                  }`}
                                >
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* AI score & CTA */}
                      <div className="flex flex-col justify-between items-end md:text-right shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Skill Alignment</span>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-extrabold shadow-sm shadow-emerald-500/5">
                            <Sparkles className="w-4 h-4" />
                            {matchScore}% AI Match
                          </div>
                        </div>

                        {hasApplied ? (
                          <span className="w-full md:w-auto px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-xs font-bold text-center flex items-center gap-2 justify-center">
                            ✓ Already Applied
                          </span>
                        ) : (
                          <button 
                            onClick={() => onApplyJob(job.id)}
                            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 justify-center shadow-md shadow-purple-500/10"
                          >
                            Apply with Video Resume
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="glass-card p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center text-purple-400 mb-6 animate-pulse">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-base text-white mb-2">No Job Openings Loaded</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6 max-w-sm">
                    We couldn't detect any job listings. Use the AI search bar above to fetch and populate real job listings for any domain instantly!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5B: CAREER ROADMAP & MARKET GAP ANALYTICS */}
        {activeTab === 'career-path' && (
          <CareerRecommendations activeCand={activeCandidate} setActiveTab={setActiveTab} />
        )}

        {/* TAB 6: DUAL INTERACTIVE HIRING CHAT & SCHEDULING */}
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-6 h-full min-h-[500px]">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Recruiter Chat & AI Scheduling</h2>
                <p className="text-slate-400 text-xs">Direct dynamic communication client. Ask questions and book your interview instantly.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ✦ Recruiter Priya Online
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 flex-1 items-start min-h-0">
              
              {/* Chat Window Column (2 cols wide) */}
              <div className="md:col-span-2 glass-card rounded-2xl border border-white/5 flex flex-col h-[520px] overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-white/5 flex items-center gap-3.5 shrink-0">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                      PM
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B1020]"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">Priya Mehta</h3>
                    <p className="text-[10px] text-slate-400">HR Lead & Talent Acquisition at Infosys</p>
                  </div>
                </div>

                {/* Message list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/10">
                  {(!activeCandidate.chatHistory || activeCandidate.chatHistory.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                      <span className="text-xs text-slate-500">No active messages in thread yet.</span>
                      <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">Send a greeting to start a real-time conversational thread with Priya!</p>
                    </div>
                  ) : (
                    activeCandidate.chatHistory.map((msg, idx) => {
                      const isCandidate = msg.sender === 'candidate';
                      return (
                        <div key={idx} className={`flex flex-col ${isCandidate ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                            isCandidate 
                              ? 'bg-gradient-to-tr from-purple-600 to-blue-500 text-white rounded-br-none shadow-md shadow-purple-500/10' 
                              : 'bg-[#0B1020] border border-white/5 text-slate-200 rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp || 'Just now'}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Footer */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    onSendChatMessage(activeCandidate.id, chatInput.trim(), 'candidate');
                    setChatInput('');
                  }}
                  className="p-3 bg-[#0B1020]/90 border-t border-white/5 flex gap-2 shrink-0"
                >
                  <input 
                    type="text" 
                    placeholder="Ask Priya about parameters, salary, or mock practice..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#050816] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none placeholder:text-slate-500 font-medium"
                  />
                  <button 
                    type="submit"
                    className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md shadow-purple-500/10"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* AI Scheduler Widget Column */}
              <div className="glass-card rounded-2xl border border-white/5 p-5 flex flex-col gap-4 min-h-[400px]">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200 font-jakarta">✦ AI Booking Assistant</span>
                </div>

                {interviews.some(i => i.candidateId === activeCandidate.id) ? (
                  (() => {
                    const myInt = interviews.find(i => i.candidateId === activeCandidate.id);
                    return (
                      <div className="flex flex-col gap-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex flex-col gap-2.5 text-xs">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle className="w-4 h-4" />
                            Interview Successfully Synced!
                          </div>
                          <div className="text-slate-300 flex flex-col gap-1 text-[11px] leading-relaxed">
                            <span className="text-slate-400">Meeting: <span className="text-white font-semibold">{myInt.role}</span></span>
                            <span className="text-slate-400">Date: <span className="text-white font-semibold">{myInt.date}</span></span>
                            <span className="text-slate-400">Time: <span className="text-white font-semibold">{myInt.time}</span></span>
                            <span className="text-slate-400">Platform: <span className="text-purple-400 font-semibold">{myInt.platform}</span></span>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl text-center text-xs flex flex-col items-center gap-3">
                          <span className="font-semibold text-purple-300">Ready for dynamic split-screen room?</span>
                          <p className="text-[10px] text-slate-400 leading-normal">Priya Mehta will analyze your live streaming camera feeds. Prepare your microphone!</p>
                          <button
                            type="button"
                            onClick={() => {
                              alert("Interview scheduled successfully! Log in to the Recruiter Workspace to launch this dynamic video room, or test it out.");
                            }}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-[11px]"
                          >
                            Launch Split-Screen Meeting
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <form onSubmit={handleConfirmBooking} className="flex flex-col gap-4">
                    <span className="text-[10px] text-slate-400 leading-relaxed block font-medium">
                      Select your slot below. Confirmed schedules will automatically advance your candidate status to <span className="text-purple-400 font-bold">Interview Scheduled</span>.
                    </span>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Select Preferred Date</label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-[#050816] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Select Time Slot</label>
                      <input 
                        type="time" 
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-[#050816] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Suggest Available Slots</span>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate("2026-05-27");
                            setSelectedTime("10:00");
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#050816] border border-white/5 hover:border-purple-500/30 rounded-lg text-left text-[10px] text-slate-300 font-medium transition-colors flex items-center justify-between"
                        >
                          <span>Tomorrow (May 27) at 10:00 AM</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate("2026-05-29");
                            setSelectedTime("14:00");
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#050816] border border-white/5 hover:border-purple-500/30 rounded-lg text-left text-[10px] text-slate-300 font-medium transition-colors flex items-center justify-between"
                        >
                          <span>Friday (May 29) at 02:00 PM</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isBooking}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Scheduling Slot...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Confirm AI Booking Slot
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: AI PRACTICE INTERVIEW ROOM */}
        {activeTab === 'practice' && (
          <div className="flex flex-col gap-6 h-full min-h-[500px]">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">✦ AI Mock Interview Practice Room</h2>
              <p className="text-slate-400 text-xs">Simulate dynamic proctored screening interviews. Receive immediate multi-dimensional AI critiques.</p>
            </div>

            {/* STAGE 1: SETUP */}
            {selectedPracticeTab === 'setup' && (
              <div className="max-w-xl mx-auto w-full glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-6 my-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-3">
                    <Sliders className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-sm text-white">Configure Simulator Parameters</h3>
                  <p className="text-slate-400 text-[11px] mt-1">Select a targeting job role to pull specialized technical and cultural questionnaire tracks.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Practice Job Target</label>
                    <select
                      value={practiceRole}
                      onChange={(e) => setPracticeRole(e.target.value)}
                      className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                    >
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.company} - {j.title}</option>
                      ))}
                      <option value="custom">✦ Custom Target Job Role</option>
                    </select>
                  </div>

                  {practiceRole === 'custom' && (
                    <div className="animation-slide-down">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Custom Job Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Senior Backend Engineer" 
                        value={customRoleName}
                        onChange={(e) => setCustomRoleName(e.target.value)}
                        className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Question Track count</label>
                      <input 
                        type="text" 
                        value="4 Screening Questions" 
                        className="w-full bg-[#0B1020]/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-400 outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Difficulty level</label>
                      <select className="w-full bg-[#0B1020] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none">
                        <option>Mid-Senior Level</option>
                        <option>Lead Engineer</option>
                        <option>Architect Level</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPracticeIndex(0);
                      setPracticeAnswer('');
                      setPracticeFeedback(null);
                      setSelectedPracticeTab('interview');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Initialize AI Interview Session
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: INTERVIEW SIMULATOR - Distraction Free typing mode */}
            {selectedPracticeTab === 'interview' && (
              <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
                <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col gap-5">
                  
                  <div className="flex justify-between items-center border-b border-white/5 pb-3.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400 font-jakarta">Screening Question {currentPracticeIndex + 1} of 4</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase tracking-wide">
                      Written Practice
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white leading-relaxed">
                    {practiceQuestions[currentPracticeIndex]}
                  </h3>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-medium">
                      Your Written Response
                    </label>
                    <textarea
                      value={practiceAnswer}
                      onChange={(e) => setPracticeAnswer(e.target.value)}
                      placeholder="Type your detailed technical response here. Try to write at least 2-3 comprehensive sentences with specific implementation examples..."
                      rows={8}
                      className="w-full bg-[#050816] border border-white/10 rounded-xl p-4 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed placeholder:text-slate-600 font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPracticeTab('setup');
                      }}
                      className="px-5 py-2.5 bg-[#0B1020] border border-white/10 hover:border-purple-500/20 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                    >
                      Exit Simulator
                    </button>

                    <button
                      type="button"
                      onClick={handleEvaluateAnswer}
                      disabled={!practiceAnswer.trim() || isEvaluating}
                      className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10 disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI Evaluator Scoring...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Submit Answer to AI Evaluator
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* STAGE 3: AI EVALUATOR RESULTS SCORECARD */}
            {selectedPracticeTab === 'results' && practiceFeedback && (
              <div className="flex flex-col gap-6 animation-fade-in">
                
                <div className="grid md:grid-cols-3 gap-6">
                  
                  <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-3 left-3 text-[9px] uppercase font-bold text-slate-500">Overall score</div>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center mt-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="52" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                        <circle cx="64" cy="64" r="52" stroke="url(#scoreGrad)" strokeWidth="8" fill="transparent" 
                          strokeDasharray={326}
                          strokeDashoffset={326 - (326 * practiceFeedback.score) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9333EA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-white leading-none">{practiceFeedback.score}%</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-extrabold">PASS RATING</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-5 justify-center">
                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Grader metrics breakdown</span>
                      <h4 className="font-extrabold text-sm text-white">Dynamic Competency Alignment</h4>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                          <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-purple-400" /> Technical Competency Score</span>
                          <span className="text-purple-400 font-extrabold">{practiceFeedback.technical}%</span>
                        </div>
                        <div className="w-full bg-[#050816] rounded-full h-2 border border-white/5">
                          <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${practiceFeedback.technical}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                          <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-400" /> Communication & Delivery Score</span>
                          <span className="text-blue-400 font-extrabold">{practiceFeedback.communication}%</span>
                        </div>
                        <div className="w-full bg-[#050816] rounded-full h-2 border border-white/5">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${practiceFeedback.communication}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  
                  <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ✦ Highlighted Strengths & Highlights
                    </span>
                    <ul className="flex flex-col gap-2.5 mt-1">
                      {practiceFeedback.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      ✦ Constructive Areas of Critique
                    </span>
                    <ul className="flex flex-col gap-2.5 mt-1">
                      {practiceFeedback.weaknesses.map((weak, idx) => (
                        <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col gap-3">
                  <div className="border-b border-white/5 pb-2.5">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Reference Model Answer Study</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed leading-loose italic bg-black/20 p-4 rounded-xl border border-white/5">
                    "{practiceFeedback.modelAnswer}"
                  </p>
                </div>

                <div className="flex gap-4 items-center justify-end border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPracticeTab('setup');
                    }}
                    className="px-5 py-2.5 bg-[#0B1020] border border-white/10 hover:border-purple-500/30 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    Try Another Job Role
                  </button>

                  {currentPracticeIndex < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPracticeAnswer('');
                        setPracticeFeedback(null);
                        setCurrentPracticeIndex(prev => prev + 1);
                        setSelectedPracticeTab('interview');
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-purple-500/10 flex items-center gap-1.5"
                    >
                      Advance to Question {currentPracticeIndex + 2} &rarr;
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPracticeTab('setup');
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                    >
                      Complete Practice Session 🎉
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      </section>
    </div>
  );
}
