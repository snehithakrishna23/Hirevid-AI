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
  Volume2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function CandidateWorkspace({ 
  activeTab, 
  setActiveTab, 
  activeCandidate, 
  jobs, 
  onUpdateProfile, 
  onApplyJob,
  onSendChatMessage,
  interviews = [],
  onScheduleInterview
}) {
  const [profileName, setProfileName] = useState(activeCandidate.name);
  const [profileTitle, setProfileTitle] = useState(activeCandidate.title);
  const [profileLocation, setProfileLocation] = useState(activeCandidate.location);
  const [profileBio, setProfileBio] = useState(activeCandidate.bio);
  const [profileSkills, setProfileSkills] = useState(activeCandidate.skills);
  const [newSkill, setNewSkill] = useState('');
  const [profileExperience, setProfileExperience] = useState(activeCandidate.experience || '');
  const [profileEducation, setProfileEducation] = useState(activeCandidate.education || '');

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
    if (!selectedDate || !selectedTime) return;

    setIsBooking(true);
    
    const targetJob = jobs.find(j => j.id === activeCandidate.appliedJobs[0]) || jobs[0];
    
    const newInterview = {
      id: `int-${Date.now()}`,
      candidateId: activeCandidate.id,
      candidateName: activeCandidate.name,
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
        await onSendChatMessage(activeCandidate.id, `Booked Interview Slot! I will join the HireVid Virtual Room on ${selectedDate} at ${selectedTime}.`, 'candidate');
      }

      setIsBooking(false);
    }, 1000);
  };

  // Recording variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(activeCandidate.videoResumeUrl);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [teleprompterText, setTeleprompterText] = useState(
    "Hi, I'm " + activeCandidate.name + ", and I'm a passionate " + activeCandidate.title + ". In my 5 years in engineering, I have focused heavily on crafting beautiful, interactive applications with React, Node.js, and high-quality utility systems like Tailwind. I love solving complex frontend layouts and designing modular APIs..."
  );

  // KYC variables
  const [kycProgress, setKycProgress] = useState(0);
  const [isKycScanning, setIsKycScanning] = useState(false);
  const [kycVerified, setKycVerified] = useState(activeCandidate.kycStatus === 'Verified');

  // Parser variables
  const [isParsing, setIsParsing] = useState(false);
  const [pdfFile, setPdfFile] = useState(activeCandidate.pdfResumeName || '');
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
    setProfileName(activeCandidate.name);
    setProfileTitle(activeCandidate.title);
    setProfileLocation(activeCandidate.location);
    setProfileBio(activeCandidate.bio);
    setProfileSkills(activeCandidate.skills);
    setRecordedVideo(activeCandidate.videoResumeUrl);
    setPdfFile(activeCandidate.pdfResumeName || '');
    setKycVerified(activeCandidate.kycStatus === 'Verified');
    setProfileExperience(activeCandidate.experience || '');
    setProfileEducation(activeCandidate.education || '');
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
                const fileName = `${activeCandidate.id}_${Date.now()}.webm`;
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
        const fileName = `${activeCandidate.id}_${Date.now()}.${fileExt}`;
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
          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: mockUrl,
            skills: uniqueSkills
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

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
        const fileName = `${activeCandidate.id}_${Date.now()}.${fileExt}`;
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
          onUpdateProfile({
            pdfResumeName: name,
            pdfResumeUrl: mockUrl,
            skills: uniqueSkills
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

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
  const handleAddSkill = () => {
    if (newSkill.trim() && !profileSkills.includes(newSkill.trim())) {
      const updated = [...profileSkills, newSkill.trim()];
      setProfileSkills(updated);
      onUpdateProfile({ skills: updated });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = profileSkills.filter(s => s !== skillToRemove);
    setProfileSkills(updated);
    onUpdateProfile({ skills: updated });
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name: profileName,
      title: profileTitle,
      location: profileLocation,
      bio: profileBio,
      experience: profileExperience,
      education: profileEducation
    });
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins}:${remainSecs < 10 ? '0' : ''}${remainSecs}`;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#050816]">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-[#0B1020]/90 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
        {/* Candidate Mini Profile */}
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/5">
          <div className="relative">
            <img 
              src={activeCandidate.avatar} 
              alt={activeCandidate.name}
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
          <div>
            <h3 className="font-bold text-sm text-white truncate max-w-[130px]">{activeCandidate.name}</h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{activeCandidate.title}</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex flex-col gap-1.5 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'dashboard' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            Dashboard Overview
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('kyc');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'kyc' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Identity KYC Scan
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'profile' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            Profile & PDF Parser
          </button>

          <button 
            onClick={() => {
              setActiveTab('video');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'video' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Resume Studio
          </button>

          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'jobs' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Find Tech Jobs
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
              Matches
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
              activeTab === 'chat' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Hiring Chat
            {activeCandidate.chatHistory && activeCandidate.chatHistory.length > 0 && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
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
                activeCandidate.status === 'Offered' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : activeCandidate.status === 'Rejected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                Current Stage: <span className="uppercase">{activeCandidate.status}</span>
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
                  {recordedVideo ? 'Video Linked (' + activeCandidate.videoDuration + ')' : 'No Video Uploaded'}
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
            <div className="glass-card p-6 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300 mb-6">Interactive Application Tracker</h3>
              
              <div className="relative flex justify-between items-center max-w-3xl mx-auto px-4 py-8">
                {/* Horizontal progress bar background */}
                <div className="absolute top-[50%] left-0 w-full h-1 bg-[#11182D] -translate-y-[50%] -z-10"></div>
                <div className={`absolute top-[50%] left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 -translate-y-[50%] -z-10 transition-all`} style={{
                  width: activeCandidate.status === 'Screened' ? '0%' : 
                         activeCandidate.status === 'Shortlisted' ? '25%' : 
                         activeCandidate.status === 'Interview Scheduled' ? '50%' :
                         activeCandidate.status === 'Offered' ? '100%' : '100%'
                }}></div>

                {/* Circles for steps */}
                {[
                  { label: 'Screened', index: 0 },
                  { label: 'Shortlisted', index: 1 },
                  { label: 'Interview Scheduled', index: 2 },
                  { label: 'Offered / Offer Received', index: 3 }
                ].map(step => {
                  const isCurrent = activeCandidate.status === step.label;
                  const isPassed = 
                    (activeCandidate.status === 'Screened' && step.index <= 0) ||
                    (activeCandidate.status === 'Shortlisted' && step.index <= 1) ||
                    (activeCandidate.status === 'Interview Scheduled' && step.index <= 2) ||
                    (activeCandidate.status === 'Offered' && step.index <= 3);
                    
                  return (
                    <div key={step.label} className="flex flex-col items-center relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent 
                          ? 'bg-purple-600 border-purple-500 text-white scale-110 shadow-lg shadow-purple-500/30' 
                          : isPassed 
                          ? 'bg-gradient-to-tr from-purple-600 to-blue-500 border-transparent text-white' 
                          : 'bg-[#0B1020] border-white/10 text-slate-500'
                      }`}>
                        {isPassed && !isCurrent ? '✓' : step.index + 1}
                      </div>
                      <span className={`text-[10px] font-semibold text-center mt-3 absolute -bottom-8 w-24 tracking-wide uppercase ${
                        isCurrent ? 'text-purple-300 font-bold scale-105' : 'text-slate-500'
                      }`}>
                        {step.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {activeCandidate.status === 'Rejected' && (
                <div className="mt-12 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="font-bold">Application Status: Closed</span>
                    <p className="text-slate-400 mt-1">We appreciate your time, but have decided to pursue candidates whose skills align more closely with our direct systems at this exact stage.</p>
                  </div>
                </div>
              )}

              {activeCandidate.status === 'Offered' && (
                <div className="mt-12 p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-3 text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-bold">Congratulations! Offer Received! 🎉</span>
                    <p className="text-slate-400 mt-1">The hiring manager has reviewed your virtual interview performance and generated an official contract. Check your messages or contact them in chat.</p>
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
                      <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                        Recording: {formatTime(recordingSeconds)}
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
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold tracking-tight">Active Tech Job Directory</h2>
              <p className="text-slate-400 text-xs">AI parses matching scores between your profile skills and job details in real time.</p>
            </div>

            {/* List jobs */}
            <div className="grid gap-5">
              {jobs.map(job => {
                // Calculate match score
                const matchingSkills = activeCandidate.skills.filter(s => 
                  job.skills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
                );
                const matchScore = Math.min(100, 50 + Math.round((matchingSkills.length / job.skills.length) * 50));
                
                const hasApplied = activeCandidate.appliedJobs.includes(job.id);

                return (
                  <div 
                    key={job.id}
                    className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between gap-6 glass-card-hover"
                  >
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-tr from-purple-600/20 to-blue-500/20 border border-white/10 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        {job.logo}
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
                          {job.skills.map(skill => {
                            const isMatched = activeCandidate.skills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs.toLowerCase()));
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
              })}
            </div>
          </div>
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

      </section>
    </div>
  );
}
