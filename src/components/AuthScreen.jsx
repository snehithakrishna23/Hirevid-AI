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
  const [loading, setLoading] = useState(false);

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
    if (loading) return;

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

    setLoading(true);

    try {
      if (supabase) {
        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              name: fullName.trim(),
              role: formRole
            }
          }
        });

        if (authError) {
          setErrorMsg(authError.message);
          setLoading(false);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setErrorMsg("Failed to create auth account.");
          setLoading(false);
          return;
        }

        // 2. Insert to public.users table
        const { error: dbError } = await supabase.from('users').insert({
          id: user.id,
          email: email.trim().toLowerCase(),
          name: fullName.trim(),
          role: formRole
        });

        if (dbError) {
          if (!dbError.message.includes('duplicate key')) {
            setErrorMsg("Auth succeeded, but profile creation failed: " + dbError.message);
            setLoading(false);
            return;
          }
        }

        // 3. If Candidate, insert to candidate_profiles {user_id}
        if (formRole === 'candidate') {
          const { error: profileError } = await supabase.from('candidate_profiles').insert({
            user_id: user.id,
            skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
            bio: 'Welcome to your portfolio! Update your details, skills, and record a video resume to stand out.',
            location: 'Remote',
            experience: '',
            linkedin: '',
            github: '',
            video_url: '',
            pdf_url: ''
          });

          if (profileError && !profileError.message.includes('duplicate key')) {
            console.error("Failed to seed candidate profile:", profileError);
          }
        }

        // 4. If Recruiter, insert to companies {recruiter_id, company_name}
        if (formRole === 'recruiter') {
          const { error: companyError } = await supabase.from('companies').insert({
            recruiter_id: user.id,
            company_name: companyName.trim(),
            logo_url: '✨',
            description: '',
            website: ''
          });

          if (companyError && !companyError.message.includes('duplicate key')) {
            console.error("Failed to seed company:", companyError);
          }
        }

        // Save user to local storage fallback users list for offline/fallback matching
        const localUser = {
          id: user.id,
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: formRole,
          company: formRole === 'recruiter' ? companyName.trim() : ''
        };
        const updatedUsers = [...users.filter(u => u.email.toLowerCase() !== localUser.email), localUser];
        setUsers(updatedUsers);
        localStorage.setItem('hirevid_users', JSON.stringify(updatedUsers));

        // Check if email confirmation is required (session is null)
        if (!authData.session) {
          setSuccessMsg('Account created successfully! Check your inbox to confirm your email before logging in.');
          setFullName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setCompanyName('');
          setTimeout(() => {
            setView('login');
          }, 3000);
          return;
        }

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
          setView(formRole);
          localStorage.setItem('hirevid_view', formRole);
        }, 1000);

      } else {
        // Email duplicate check in local mocks
        const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (duplicate) {
          setErrorMsg('An account with this email already exists.');
          setLoading(false);
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

        // If candidate, seed a blank profile slot in candidates list
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
          setCurrentCandidateId('cand-1');
        }

        setSuccessMsg('Account created successfully! Redirecting...');

        setTimeout(() => {
          setCurrentUser(newUser);
          localStorage.setItem('hirevid_currentUser', JSON.stringify(newUser));
          setView(formRole);
          localStorage.setItem('hirevid_view', formRole);
        }, 1000);
      }
    } catch (err) {
      setErrorMsg("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Instantly log in without any network calls (used by demo buttons + fallback)
  const doInstantLogin = (role) => {
    const mockUser = role === 'candidate'
      ? { id: 'cand-1', name: 'Sarah Jenkins', email: 'sarah.j@devmail.com', role: 'candidate', company: '' }
      : { id: 'recruiter-team', name: 'VividAI Team', email: 'recruiter@vividai.com', role: 'recruiter', company: 'VividAI Systems' };
    setCurrentCandidateId('cand-1');
    setCurrentUser(mockUser);
    localStorage.setItem('hirevid_currentUser', JSON.stringify(mockUser));
    localStorage.setItem('hirevid_view', mockUser.role);
    setView(mockUser.role);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    // Demo accounts — instant bypass, no network needed
    const emailLower = email.trim().toLowerCase();
    if (emailLower === 'sarah.j@devmail.com' || emailLower === 'recruiter@vividai.com') {
      doInstantLogin(emailLower === 'sarah.j@devmail.com' ? 'candidate' : 'recruiter');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        setSuccessMsg('Signing in...');
        
        let authData = null;
        let authError = null;

        try {
          const result = await supabase.auth.signInWithPassword({
            email: emailLower,
            password
          });
          authData = result.data;
          authError = result.error;
        } catch (netErr) {
          console.warn('Supabase login failed due to network error, checking local fallback:', netErr);
          const matchedUser = users.find(u =>
            u.email.toLowerCase() === emailLower &&
            u.password === password &&
            u.role === formRole
          );
          if (matchedUser) {
            setSuccessMsg('');
            setCurrentUser(matchedUser);
            localStorage.setItem('hirevid_currentUser', JSON.stringify(matchedUser));
            localStorage.setItem('hirevid_view', formRole);
            setView(formRole);
            return;
          }
          throw netErr;
        }

        if (authError) {
          setSuccessMsg('');
          
          // If error is network related or server 500, attempt fallback
          if (authError.message?.includes('fetch') || authError.status === 0 || authError.status === 500) {
            const matchedUser = users.find(u =>
              u.email.toLowerCase() === emailLower &&
              u.password === password &&
              u.role === formRole
            );
            if (matchedUser) {
              setCurrentUser(matchedUser);
              localStorage.setItem('hirevid_currentUser', JSON.stringify(matchedUser));
              localStorage.setItem('hirevid_view', formRole);
              setView(formRole);
              return;
            }
          }

          if (authError.message.includes('Email not confirmed')) {
            setErrorMsg('Please confirm your email address first. Check your inbox for a confirmation link.');
          } else if (authError.message.includes('Invalid login credentials') || authError.message.includes('invalid_credentials')) {
            setErrorMsg('Wrong email or password. Please check and try again.');
          } else {
            setErrorMsg(authError.message);
          }
          return;
        }

        const user = authData?.user;
        if (!user) {
          setSuccessMsg('');
          setErrorMsg('Failed to retrieve session. Please try again.');
          return;
        }

        // Fetch user profile from DB
        const { data: dbUser, error: dbError } = await supabase
          .from('users').select('*').eq('id', user.id).single();

        let resolvedUser = dbUser;
        if (dbError || !dbUser) {
          const meta = user.user_metadata || {};
          const role = meta.role || formRole;
          await supabase.from('users').insert({ id: user.id, email: user.email, name: meta.name || user.email, role });
          resolvedUser = { id: user.id, email: user.email, name: meta.name || user.email, role };
        }

        const userRole = resolvedUser.role || formRole;
        let userCompany = '';
        if (userRole === 'recruiter') {
          const { data: comp } = await supabase
            .from('companies').select('company_name').eq('recruiter_id', user.id).maybeSingle();
          userCompany = comp?.company_name || '';
        }

        // Cache real user session locally for offline matching
        const localUser = {
          id: user.id,
          name: resolvedUser.name || user.email,
          email: user.email,
          password: password,
          role: userRole,
          company: userCompany
        };
        const updatedUsers = [...users.filter(u => u.email.toLowerCase() !== localUser.email), localUser];
        setUsers(updatedUsers);
        localStorage.setItem('hirevid_users', JSON.stringify(updatedUsers));

        setCurrentCandidateId(user.id);
        const sessionUser = { id: resolvedUser.id, name: resolvedUser.name, email: resolvedUser.email, role: userRole, company: userCompany };
        setCurrentUser(sessionUser);
        localStorage.setItem('hirevid_currentUser', JSON.stringify(sessionUser));
        localStorage.setItem('hirevid_view', userRole);
        setView(userRole);

      } else {
        // No Supabase — pure local mock
        const matchedUser = users.find(u =>
          u.email.toLowerCase() === emailLower &&
          u.password === password &&
          u.role === formRole
        );
        if (!matchedUser) {
          setErrorMsg('Invalid credentials. Check your email, password, and active role.');
          return;
        }
        if (formRole === 'candidate') {
          const matchedCand = candidates.find(c => c.email?.toLowerCase() === emailLower);
          setCurrentCandidateId(matchedCand?.id || 'cand-1');
        } else {
          setCurrentCandidateId('cand-1');
        }
        setCurrentUser(matchedUser);
        localStorage.setItem('hirevid_currentUser', JSON.stringify(matchedUser));
        localStorage.setItem('hirevid_view', formRole);
        setView(formRole);
      }
    } catch (err) {
      setSuccessMsg('');
      setErrorMsg('Login failed: ' + err.message);
    } finally {
      setLoading(false);
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
              disabled={loading}
              onClick={() => setFormRole('candidate')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                formRole === 'candidate'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              👤 Candidate
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setFormRole('recruiter')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                formRole === 'recruiter'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🏢 Recruiter
            </button>
          </div>

          {/* Status alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
                    disabled={loading}
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={loading}
                    placeholder="john@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Show company name ONLY if Recruiter role is selected */}
              {formRole === 'recruiter' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="VividAI Systems"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={loading}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={loading}
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10 mt-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
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
                    disabled={loading}
                    placeholder="sarah.j@devmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Password</label>
                  <button
                    type="button"
                    disabled={loading}
                    className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (!email.trim()) { setErrorMsg('Enter your email above first.'); return; }
                      if (!supabase) { setErrorMsg('Password reset requires Supabase connection.'); return; }
                      setLoading(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                          redirectTo: window.location.origin
                        });
                        if (error) setErrorMsg(error.message);
                        else setSuccessMsg('Reset link sent! Check your inbox.');
                      } catch (err) {
                        setErrorMsg(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    disabled={loading}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 focus:shadow-md focus:shadow-purple-500/5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10 mt-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Logging In...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </button>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => doInstantLogin('candidate')}
                  className="flex-1 py-2 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-300 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⚡ Demo Candidate
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => doInstantLogin('recruiter')}
                  className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-300 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⚡ Demo Recruiter
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400 mt-4">
                Don't have account?{' '}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setView('signup')}
                  className="text-purple-400 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {view === 'resetPassword' && (
            <ResetPasswordForm setView={setView} />
          )}

        </div>
      </div>

    </div>
  );
}

function ResetPasswordForm({ setView }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (newPassword.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPw) { setErr('Passwords do not match.'); return; }
    setLoading(true);
    try {
      // Confirm we have an active recovery session before attempting update
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setErr('Session expired or missing. Please click the reset link in your email again to initialize a new session.');
        setLoading(false);
        return;
      }

      // Race updateUser against a 12-second timeout to prevent UI hangs under any conditions
      const updatePromise = supabase.auth.updateUser({ password: newPassword });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Password update timed out. Please check your connection or click the email link again.')), 12000)
      );

      const { error } = await Promise.race([updatePromise, timeoutPromise]);
      if (error) { 
        setErr(error.message); 
      } else {
        setMsg('Password updated successfully! Redirecting to login...');
        setTimeout(() => setView('login'), 2000);
      }
    } catch (e) {
      setErr('Failed to update password: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h3 className="text-2xl font-extrabold tracking-tight">Set New Password</h3>
        <p className="text-slate-400 text-xs mt-1.5">Choose a strong new password for your account</p>
      </div>

      {err && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{err}</span>
        </div>
      )}
      {msg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              disabled={loading}
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              disabled={loading}
              placeholder="Repeat password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="w-full bg-[#050816] border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-purple-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-purple-500/10 mt-1 disabled:opacity-60"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button type="button" onClick={() => setView('login')} className="text-center text-[11px] text-slate-500 hover:text-purple-400 transition-colors mt-1">
          ← Back to Login
        </button>
      </form>
    </div>
  );
}
