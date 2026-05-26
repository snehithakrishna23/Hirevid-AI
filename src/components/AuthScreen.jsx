import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, Mail, Lock, User, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthScreen({
  view,
  setView,
  users,
  setUsers,
  setCurrentUser,
  initialRole,
  setInitialRole,
  candidates,
  setCandidates,
  setCurrentCandidateId
}) {
  // Toggle role in forms
  const [formRole, setFormRole] = useState(initialRole || 'candidate');

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep formRole in sync with initialRole updates from parent triggers
  useEffect(() => {
    if (initialRole) {
      setFormRole(initialRole);
    }
  }, [initialRole]);

  // Clean inputs on toggle
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [view, formRole]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Fields validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (formRole === 'recruiter' && !companyName.trim()) {
      setErrorMsg('Please fill in your company name.');
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    if (supabase) {
      try {
        // 1. Sign up user in Supabase Auth with metadata payload
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              name: fullName.trim(),
              role: formRole,
              company: formRole === 'recruiter' ? companyName.trim() : ''
            }
          }
        });

        if (authError) {
          setErrorMsg(authError.message);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setErrorMsg("Failed to create auth account.");
          return;
        }

        // 2. Check if the profile was already created (e.g. by PostgreSQL trigger)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingUser) {
          // Trigger did not run, execute manual insert fallback
          const { error: dbError } = await supabase.from('users').insert({
            id: user.id,
            email: email.trim().toLowerCase(),
            name: fullName.trim(),
            role: formRole,
            company: formRole === 'recruiter' ? companyName.trim() : ''
          });

          if (dbError) {
            setErrorMsg("Auth succeeded, but profile creation failed: " + dbError.message);
            return;
          }

          // Seeding Candidate Profiles manual fallback
          if (formRole === 'candidate') {
            const { error: profileError } = await supabase.from('candidate_profiles').insert({
              id: user.id,
              name: fullName.trim(),
              email: email.trim().toLowerCase(),
              title: 'Software Engineer Portfolio',
              location: 'Remote',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
              skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
              bio: 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.',
              kyc_status: 'Pending',
              pdf_resume_name: '',
              pdf_resume_url: '',
              video_resume_url: '',
              video_duration: '0:00',
              status: 'Screened',
              ai_match_score: 60,
              chat_history: []
            });

            if (profileError) {
              console.error("Failed to seed candidate profile fallback:", profileError);
            }
          }
        }

        // Set references
        setCurrentCandidateId(user.id);

        setSuccessMsg('Account created successfully! Redirecting...');

        setTimeout(() => {
          const sessionUser = {
            id: user.id,
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            role: formRole,
            company: formRole === 'recruiter' ? companyName.trim() : ''
          };
          setCurrentUser(sessionUser);
          localStorage.setItem('hirevid_currentUser', JSON.stringify(sessionUser));
          setView(formRole); // redirects to correct dashboard
          localStorage.setItem('hirevid_view', formRole);
        }, 1000);

      } catch (err) {
        setErrorMsg("Supabase communication failed: " + err.message);
      }
    } else {
      // Email duplicate check in local mocks
      const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (duplicate) {
        setErrorMsg('An account with this email already exists.');
        return;
      }

      // Create User structure
      const newUser = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: formRole,
        company: formRole === 'recruiter' ? companyName.trim() : ''
      };

      // Save user
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('hirevid_users', JSON.stringify(updatedUsers));

      // If candidate, seed a blank profile slot in candidates list so recruiter kanban/search syncs
      if (formRole === 'candidate') {
        const newCandId = 'cand-' + Date.now();
        const newCandSlot = {
          id: newCandId,
          name: fullName.trim(),
          title: 'Software Engineer Portfolio',
          location: 'Remote',
          email: email.trim().toLowerCase(),
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
          chatHistory: []
        };

        const updatedCands = [...candidates, newCandSlot];
        setCandidates(updatedCands);
        localStorage.setItem('hirevid_candidates', JSON.stringify(updatedCands));
        setCurrentCandidateId(newCandId);
      } else {
        // Seed default candidate for recruiter view
        setCurrentCandidateId('cand-1');
      }

      setSuccessMsg('Account created successfully! Redirecting...');
      
      // Auto login
      setTimeout(() => {
        setCurrentUser(newUser);
        localStorage.setItem('hirevid_currentUser', JSON.stringify(newUser));
        setView(formRole); // redirects to correct dashboard
        localStorage.setItem('hirevid_view', formRole);
      }, 1000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (supabase) {
      try {
        // Bypass Supabase Auth only for the pre-seeded demo testing accounts!
        if (email.trim().toLowerCase() === 'sarah.j@devmail.com' || email.trim().toLowerCase() === 'recruiter@vividai.com') {
          setSuccessMsg('Success! Logging in with Demo Session...');
          setTimeout(() => {
            const mockSessionUser = email.trim().toLowerCase() === 'sarah.j@devmail.com' 
              ? { id: 'cand-1', name: 'Sarah Jenkins', email: 'sarah.j@devmail.com', role: 'candidate', company: '' }
              : { id: 'recruiter-team', name: 'VividAI Team', email: 'recruiter@vividai.com', role: 'recruiter', company: companyName || 'VividAI Systems' };
            
            if (formRole === 'candidate') {
              setCurrentCandidateId('cand-1');
            } else {
              setCurrentCandidateId('cand-1'); // recruiter reviews cand-1
            }
            
            setCurrentUser(mockSessionUser);
            localStorage.setItem('hirevid_currentUser', JSON.stringify(mockSessionUser));
            setView(formRole);
            localStorage.setItem('hirevid_view', formRole);
          }, 1000);
          return;
        }

        // 1. Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        });

        if (authError) {
          setErrorMsg(authError.message);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setErrorMsg("Failed to retrieve user session.");
          return;
        }

        // 2. Fetch role & metadata from public.users table
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (dbError || !dbUser) {
          setErrorMsg("Login succeeded, but profile check failed: " + (dbError?.message || "User profile not found."));
          return;
        }

        if (dbUser.role !== formRole) {
          setErrorMsg(`Incorrect workspace. This account is registered as a ${dbUser.role}.`);
          return;
        }

        // 3. Set Candidate Profile ID references
        if (formRole === 'candidate') {
          setCurrentCandidateId(user.id);
        } else {
          // Recruiter
          setCurrentCandidateId(user.id);
        }

        setSuccessMsg('Success! Logging in...');

        setTimeout(() => {
          const sessionUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            company: dbUser.company || ''
          };
          setCurrentUser(sessionUser);
          localStorage.setItem('hirevid_currentUser', JSON.stringify(sessionUser));
          setView(formRole); // redirects to correct dashboard
          localStorage.setItem('hirevid_view', formRole);
        }, 1000);

      } catch (err) {
        setErrorMsg("Supabase login failed: " + err.message);
      }
    } else {
      // Lookup matched user in local storage
      const matchedUser = users.find(u => 
        u.email.toLowerCase() === email.trim().toLowerCase() && 
        u.password === password && 
        u.role === formRole
      );

      if (!matchedUser) {
        setErrorMsg('Invalid credentials. Check your email, password, and active role.');
        return;
      }

      // Set Candidate Profile ID references
      if (formRole === 'candidate') {
        // Find matching candidate by email
        const matchedCand = candidates.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
        if (matchedCand) {
          setCurrentCandidateId(matchedCand.id);
        } else {
          // Fallback to pre-seeded cand-1
          setCurrentCandidateId('cand-1');
        }
      } else {
        // Recruiter
        setCurrentCandidateId('cand-1');
      }

      setSuccessMsg('Success! Logging in...');

      setTimeout(() => {
        setCurrentUser(matchedUser);
        localStorage.setItem('hirevid_currentUser', JSON.stringify(matchedUser));
        setView(formRole); // redirects to correct dashboard
        localStorage.setItem('hirevid_view', formRole);
      }, 1000);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#050816] min-h-[calc(100vh-73px)] relative overflow-hidden animation-fade-in">
      
      {/* 1. LEFT PANEL: GRADIENT INFO FRAME */}
      <div className="w-full md:w-[42%] bg-gradient-to-br from-[#9333EA] to-[#3B82F6] p-6 md:p-10 flex flex-col justify-between relative text-white shrink-0 min-h-[350px] md:min-h-0 overflow-y-auto scrollbar-thin">
        
        {/* Glow grid visual overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-30 pointer-events-none"></div>

        {/* Top brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">HireVid AI</h2>
            <span className="text-[9px] uppercase tracking-widest text-purple-200 font-semibold block leading-none">
              Video-First Hiring Platform
            </span>
          </div>
        </div>

        {/* Tagline Middle */}
        <div className="my-6 md:my-8 relative z-10 max-w-sm">
          <h3 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
            Resumes tell your history.<br/>
            <span className="text-purple-100">Videos show your talent.</span>
          </h3>
          <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
            Create premium video profiles, complete facial scan KYC checks, and unlock AI matching scores directly. Empower hiring managers to assess communication, personality, and coding style in seconds.
          </p>
        </div>

        {/* Testimonial Bottom */}
        <div className="relative z-10 mt-6 md:mt-auto bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg shadow-purple-500/10 max-w-sm hover:scale-[1.01] transition-transform duration-300">
          <p className="text-white text-xs font-semibold italic leading-relaxed">
            "Creating a video resume on HireVid took me 2 minutes, and recruiters reached out within a day. Seeing my confidence directly was a game-changer!"
          </p>
          <div className="flex items-center gap-3 mt-4">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=60&h=60" 
              className="w-8 h-8 rounded-full object-cover border-2 border-white/30" 
              alt="User Portrait"
            />
            <div>
              <span className="text-white text-xs font-bold block leading-none">Sarah Jenkins</span>
              <span className="text-purple-200 text-[9px] mt-0.5 block leading-none">Full Stack Engineer</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: FORM BOX */}
      <div className="flex-1 bg-[#0B1020] px-6 py-12 md:py-16 flex flex-col justify-start items-center relative overflow-y-auto min-h-[calc(100vh-73px)]">
        
        {/* Visual glow ring backdrops */}
        <div className="absolute top-[10%] right-[10%] w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-sm relative z-10 my-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold tracking-tight">
              {view === 'signup' ? 'Create an Account' : 'Welcome Back'}
            </h3>
            <p className="text-slate-400 text-xs mt-1.5">
              {view === 'signup' ? 'Choose your active role and start building' : 'Select your workspace credentials below'}
            </p>
          </div>

          {/* Role switcher capsule */}
          <div className="flex bg-[#050816] p-1 rounded-full border border-white/5 w-fit mx-auto mb-6 shadow-inner">
            <button 
              type="button" 
              onClick={() => setFormRole('candidate')} 
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                formRole === 'candidate' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👤 Candidate
            </button>
            <button 
              type="button" 
              onClick={() => setFormRole('recruiter')} 
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                formRole === 'recruiter' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 Recruiter
            </button>
          </div>

          {/* Status alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGNUP FORM */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="email" 
                    placeholder="john@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Show company name ONLY if Recruiter role is selected */}
              {formRole === 'recruiter' && (
                <div className="animate-slide-up duration-300">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      placeholder="VividAI Systems"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="password" 
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Confirm</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="password" 
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10 mt-3"
              >
                Create Account
              </button>



              <p className="text-center text-[11px] text-slate-400 mt-4">
                Already have account?{' '}
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  className="text-purple-400 font-bold hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

          {/* LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="email" 
                    placeholder="sarah.j@devmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Password</label>
                  <button type="button" className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors">Forgot Password?</button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="password" 
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10 mt-3"
              >
                Log In
              </button>

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setFormRole('candidate');
                    setEmail('sarah.j@devmail.com');
                    setPassword('password');
                  }}
                  className="flex-1 py-2 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-300 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                >
                  ⚡ Demo Candidate
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setFormRole('recruiter');
                    setEmail('recruiter@vividai.com');
                    setPassword('password');
                  }}
                  className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-300 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                >
                  ⚡ Demo Recruiter
                </button>
              </div>



              <p className="text-center text-[11px] text-slate-400 mt-4">
                Don't have account?{' '}
                <button 
                  type="button" 
                  onClick={() => setView('signup')} 
                  className="text-purple-400 font-bold hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
