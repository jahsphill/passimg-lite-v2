/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Key,
  Loader2,
  Check
} from 'lucide-react';
import Logo from './Logo';
import { User as UserType } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

interface AuthPageProps {
  allUsers: UserType[];
  onLogin: (user: UserType) => void;
  onSignUp: (user: UserType) => void;
  onNavigateToWelcome: () => void;
  onRedirectToOnboarding: () => void;
  onRedirectToDashboard: () => void;
}

export default function AuthPage({
  allUsers,
  onLogin,
  onSignUp,
  onNavigateToWelcome,
  onRedirectToOnboarding,
  onRedirectToDashboard
}: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Refined Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (activeTab === 'signup') {
      if (!name.trim()) {
        newErrors.name = 'Full Name is required';
      } else if (name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!email.trim()) {
        newErrors.email = 'Email Address is required';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'Please provide a valid email format';
      }

      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Login validation
      if (!email.trim()) {
        newErrors.email = 'Email Address is required';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email format';
      }

      if (!password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    console.log("[AuthPage] Starting authentication workflow. Configuration check:", isSupabaseConfigured());

    // Timeout automatic fallback to prevent infinite spinner
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ general: 'The request timed out. Please check your network connection and try again.' });
      console.warn("[AuthPage] Authentication timed out after 10000ms. Safety loading state cleared.");
    }, 10000);

    // 1. Supabase Auth integrated flow
    if (isSupabaseConfigured()) {
      try {
        if (activeTab === 'signup') {
          const lowerEmail = email.trim().toLowerCase();
          console.log("[AuthPage] Signup started via Supabase for email:", lowerEmail);
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: lowerEmail,
            password: password,
            options: {
              data: {
                full_name: name.trim()
              }
            }
          });

          if (signUpError) {
            console.error("[AuthPage] Signup error from Supabase SDK:", signUpError);
            setErrors({ general: signUpError.message });
            setIsLoading(false);
            clearTimeout(timeoutId);
            return;
          }

          const sessionUser = data.user;
          const session = data.session;
          console.log("[AuthPage] Signup success. sessionUser:", sessionUser?.id, "sessionCreated:", !!session);

          if (sessionUser) {
            console.log("User authenticated");
            // INSERT / UPSERT profile record
            console.log("[AuthPage] Profile creation initiated for User ID:", sessionUser.id);
            let profile = null;
            try {
              const { data: upsertedProfile, error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: sessionUser.id,
                  full_name: name.trim(),
                  role: 'Photographer', // default starting role
                  onboarding_completed: false
                })
                .select('*')
                .single();
              
              if (profileError) {
                console.error("[AuthPage] Supabase Profile creation failed (handled, non-blocking):", profileError);
              } else {
                profile = upsertedProfile;
                console.log("[AuthPage] Profile creation completed successfully inside profiles table.");
              }
            } catch (profileEx) {
              console.error("[AuthPage] profile creation query threw exception (caught, non-blocking):", profileEx);
            }

            console.log("Profile fetched");

            const newUser: UserType = {
              id: sessionUser.id,
              name: name.trim(),
              email: lowerEmail,
              bio: "PassIMG certified creator.",
              avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
              isAdmin: false,
              joinedAt: sessionUser.created_at || new Date().toISOString(),
              balance: 100.00,
              onboardingRole: profile?.role || 'Photographer',
              onboardingCompleted: profile?.onboarding_completed ?? false
            };

            onSignUp(newUser);
            
            if (session) {
              console.log("[AuthPage] Session exists (Email auto-confirmed). Triggering onLogin router.");
              onLogin(newUser);
              setIsLoading(false);
              clearTimeout(timeoutId);
              console.log("Redirecting to onboarding");
              onRedirectToOnboarding();
            } else {
              console.log("[AuthPage] No session returned. Email verification must be enabled. Notifying user.");
              setErrors({ general: 'Sign up completed successfully! Please check your email inbox for a confirmation link to activate your account.' });
              setIsLoading(false);
              clearTimeout(timeoutId);
            }
          } else {
            console.warn("[AuthPage] Signup returned null user without throw.");
            setErrors({ general: 'Sign up completed. Check email for authentication confirmation link.' });
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        } else {
          // Returning User Logic with Supabase Authentication
          const lowerEmail = email.trim().toLowerCase();
          console.log("[AuthPage] Signin started for email:", lowerEmail);
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: lowerEmail,
            password: password
          });

          if (signInError) {
            console.error("[AuthPage] Signin error from Supabase SDK:", signInError);
            setErrors({ general: signInError.message });
            setIsLoading(false);
            clearTimeout(timeoutId);
            return;
          }

          const sessionUser = data.user;
          const session = data.session;
          console.log("[AuthPage] Signin success. sessionUser ID:", sessionUser?.id, "sessionCreated:", !!session);

          if (sessionUser) {
            console.log("User authenticated");
            // Fetch existing profile details
            let profile = null;
            try {
              console.log("[AuthPage] Fetching profile information for:", sessionUser.id);
              let { data: fetchedProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

              if (profileError || !fetchedProfile) {
                console.warn("[AuthPage] Profile fetch failed or returned null (non-blocking). Re-registering user metadata to profile. Error:", profileError);
                // Create profile if missing
                const { data: createdProfile, error: createError } = await supabase
                  .from('profiles')
                  .upsert({
                    id: sessionUser.id,
                    full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Authenticated Creator',
                    role: 'Photographer',
                    onboarding_completed: false
                  })
                  .select('*')
                  .single();
                if (!createError && createdProfile) {
                  profile = createdProfile;
                }
              } else {
                profile = fetchedProfile;
                console.log("[AuthPage] Profile loaded successfully from DB:", profile);
              }
            } catch (profileFetchEx) {
              console.error("[AuthPage] Fetching profile on login threw exception (caught, non-blocking):", profileFetchEx);
            }

            console.log("Profile fetched");

            const matchedUser: UserType = {
              id: sessionUser.id,
              name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Authenticated Creator',
              email: sessionUser.email || lowerEmail,
              bio: profile?.bio || "PassIMG certified creator.",
              avatar: profile?.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
              isAdmin: false,
              joinedAt: sessionUser.created_at || new Date().toISOString(),
              balance: profile?.balance ?? 100.00,
              onboardingRole: profile?.role || 'Photographer',
              onboardingCompleted: profile?.onboarding_completed ?? false
            };

            onLogin(matchedUser);
            setIsLoading(false);
            clearTimeout(timeoutId);

            if (matchedUser.onboardingCompleted) {
              console.log("Redirecting to dashboard");
              onRedirectToDashboard();
            } else {
              console.log("Redirecting to onboarding");
              onRedirectToOnboarding();
            }
          } else {
            console.warn("[AuthPage] Signin succeeded but no sessionUser found.");
            setErrors({ general: 'Authentication completed but no user record returned.' });
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        }
      } catch (err: any) {
        console.error("[AuthPage] Caught general authentication exception:", err);
        setErrors({ general: err.message || 'An error occurred during authentication.' });
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
      return;
    }

    // 2. Sandbox Fallback when Supabase keys are not set yet (keeps app fully usable in preview)
    clearTimeout(timeoutId);
    if (activeTab === 'signup') {
      const lowerEmail = email.trim().toLowerCase();
      
      const userExists = allUsers.some(u => u.email.toLowerCase() === lowerEmail);
      if (userExists) {
        setErrors({ email: 'An account with this email already exists' });
        setIsLoading(false);
        return;
      }

      const newUser: UserType = {
        id: `usr_${Math.random().toString(36).substring(2, 11)}`,
        name: name.trim(),
        email: lowerEmail,
        bio: "PassIMG certified creator.",
        avatar: `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1527983359383-4758693f760c'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&w=150&q=80`,
        isAdmin: false,
        joinedAt: new Date().toISOString(),
        balance: 100.00,
        onboardingCompleted: false
      };

      onSignUp(newUser);
      onLogin(newUser);
      setIsLoading(false);
      onRedirectToOnboarding();
    } else {
      const lowerEmail = email.trim().toLowerCase();
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === lowerEmail);

      if (matchedUser) {
        onLogin(matchedUser);
        setIsLoading(false);
        if (matchedUser.onboardingCompleted) {
          onRedirectToDashboard();
        } else {
          onRedirectToOnboarding();
        }
      } else {
        const tempUser: UserType = {
          id: `usr_${Math.random().toString(36).substring(2, 11)}`,
          name: email.split('@')[0],
          email: lowerEmail,
          bio: "PassIMG registered tester.",
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
          isAdmin: false,
          joinedAt: new Date().toISOString(),
          balance: 100.00,
          onboardingCompleted: false
        };

        onSignUp(tempUser);
        onLogin(tempUser);
        setIsLoading(false);
        onRedirectToOnboarding();
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setErrors({ reset: 'Please specify a valid email address' });
      return;
    }
    setErrors({});
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
          redirectTo: window.location.origin
        });
        if (error) {
          setErrors({ reset: error.message });
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        setErrors({ reset: err.message || 'Error executing password reset link' });
        setIsLoading(false);
        return;
      }
    }

    setResetSent(true);
    setIsLoading(false);
  };


  return (
    <div className="py-10 max-w-lg mx-auto w-full px-4 select-none" id="auth-page-container">
      {/* Return back to Welcome Link */}
      <button 
        onClick={onNavigateToWelcome}
        className="mb-4 flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer group"
        id="auth-back-to-portal-btn"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
        <span>Return to welcome portal</span>
      </button>

      {/* Configuration Status Indicator */}
      {typeof window !== 'undefined' && localStorage.getItem('passimg_sandbox_override') === 'true' ? (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-start space-x-2">
            <span className="relative flex h-2 w-2 mt-1 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <div>
              <p className="font-semibold text-amber-200">Local Sandbox Mode Enabled</p>
              <p className="text-[11px] text-slate-400 leading-normal">Bypassing Supabase connection limits. Using mock demo profiles.</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('passimg_sandbox_override');
              window.location.reload();
            }}
            className="px-3 py-1.5 self-start sm:self-center bg-amber-400/15 hover:bg-amber-400/30 text-amber-200 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            Switch to Supabase Mode
          </button>
        </div>
      ) : isSupabaseConfigured() ? (
        <div className="mb-6 p-4 bg-indigo-500/15 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-300">
          <div className="flex items-start space-x-2">
            <span className="relative flex h-2 w-2 mt-1 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <div>
              <p className="font-semibold text-indigo-200">Supabase Connected</p>
              <p className="text-[11px] text-slate-400 leading-normal">Running real cloud auth. Check connection parameters below if experiencing delays.</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('passimg_sandbox_override', 'true');
              window.location.reload();
            }}
            className="px-3 py-1.5 self-start sm:self-center bg-indigo-400/15 hover:bg-indigo-400/30 text-indigo-200 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            Switch to Sandbox Mode
          </button>
        </div>
      ) : null}

      {/* Forgot Password Container Mode */}
      {forgotPasswordMode ? (
        <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl relative overflow-hidden" id="forgot-password-card">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-[#1eff00]" />
          
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <Key className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Forgotten Password</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Provide your PassIMG certified email address and we will dispatch a cryptographic challenge reset sequence instruction sheet.
              </p>
            </div>

            {resetSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3" id="reset-success-block">
                <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Reset Credentials Forwarded!</p>
                <p className="text-[10px] text-slate-300 leading-normal">
                  Our system dispatch has initialized a link to <span className="font-mono text-[#1eff00]">{resetEmail}</span> with safe access instructions.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <input 
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setErrors({});
                      }}
                      placeholder="e.g. creative@org.com"
                      className="w-full glass-input pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  {errors.reset && (
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.reset}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-115 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Deliver Reset Sequence
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setForgotPasswordMode(false);
                setResetSent(false);
                setErrors({});
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition-all cursor-pointer block text-center"
            >
              ← Return to Sign-In Tab
            </button>
          </div>
        </div>
      ) : (
        /* Regular Login / Signup Card */
        <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl relative overflow-hidden" id="auth-flow-card">
          {/* Accent decoration */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00]" />

          <div className="p-8 sm:p-10 space-y-6">
            
            {/* Header Identity */}
            <div className="text-center space-y-2">
              <div className="relative h-11 w-11 mx-auto flex items-center justify-center">
                <Logo size={44} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                {activeTab === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'signup' 
                  ? 'Sign up to begin registering and protecting digital assets.'
                  : 'Log in to audit certificates and manage commercial licensing.'
                }
              </p>
            </div>

            {/* Custom Interactive Tab Selectors */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/40 rounded-xl border border-white/5" id="auth-tab">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrors({});
                }}
                className={`py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signup' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                id="auth-signup-tab-btn"
              >
                Sign Up
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrors({});
                }}
                className={`py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  activeTab === 'login' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                id="auth-login-tab-btn"
              >
                Log In
              </button>
            </div>

            {/* Credential Form */}
            <form onSubmit={handleSubmit} className="space-y-4" id="auth-credentials-form">
              {errors.general && (
                errors.general.includes('successfully') ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-xl flex items-start space-x-2 text-emerald-400 text-xs text-left">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                ) : (
                  <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl flex flex-col space-y-3 text-rose-450 text-xs text-left">
                    <div className="flex items-start space-x-2 text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{errors.general}</span>
                    </div>
                    {isSupabaseConfigured() && (
                      <div className="pt-3 border-t border-red-900/40 space-y-2">
                        <p className="text-[11px] text-slate-400 leading-normal">
                          💡 <strong>Supabase Limits/Error?</strong> Hit email rate limits or credential conflicts? You can seamlessly play/evaluate the app using <strong>Local Sandbox Mode</strong> with mock credentials instead!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem('passimg_sandbox_override', 'true');
                            window.location.reload();
                          }}
                          className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white hover:text-white rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer text-center border border-white/10"
                        >
                          Bypass (Switch to Sandbox Mode)
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Full Name field (Signup Only) */}
              {activeTab === 'signup' && (
                <div className="space-y-1.5 text-left" id="group-signup-name">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <input 
                      type="text"
                      value={name}
                      disabled={isLoading}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) {
                          setErrors(prev => {
                            const { name, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="e.g. Marcus Sterling"
                      className="w-full glass-input pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl disabled:opacity-50"
                      id="input-signup-name"
                    />
                  </div>
                  {errors.name && (
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400 font-sans">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5 text-left" id="group-email">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input 
                    type="email"
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors(prev => {
                          const { email, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="e.g. marcus.sterling@studio.com"
                    className="w-full glass-input pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl disabled:opacity-50"
                    id="input-email"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400 font-sans">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left" id="group-password">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => {
                          const { password, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="Enter key sequence"
                    className="w-full glass-input pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl disabled:opacity-50"
                    id="input-password"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password (Signup Only) */}
              {activeTab === 'signup' && (
                <div className="space-y-1.5 text-left" id="group-signup-confirm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      disabled={isLoading}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors(prev => {
                            const { confirmPassword, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="Confirm signature key"
                      className="w-full glass-input pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl disabled:opacity-50"
                      id="input-signup-confirm"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Additional options: Remember Me and Forgot Password links */}
              <div className="flex items-center justify-between pt-1 select-none text-[11px]" id="auth-extra-row">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isLoading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-slate-950 text-indigo-505 text-indigo-500 h-3.5 w-3.5 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                  />
                  <span>Remember me</span>
                </label>
                
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setErrors({});
                  }}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
                  id="btn-forgot-password"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00]/95 hover:brightness-110 active:scale-98 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                id="btn-auth-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing authentication...</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'signup' ? 'Complete Account Creation' : 'Validate Credential Identity'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
