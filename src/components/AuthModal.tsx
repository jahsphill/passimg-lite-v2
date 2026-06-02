/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCircle, Edit3, Mail, Lock, Sparkles, Plus, Wallet, Save } from 'lucide-react';
import { generateRegistrationId } from '../utils';
import Logo from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers: User[];
  onLogin: (user: User) => void;
  onSignUp: (user: User) => void;
  onUpdateProfile: (user: User) => void;
  initialMode?: 'login' | 'signup' | 'reset' | 'profile';
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onLogin,
  onSignUp,
  onUpdateProfile,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'profile'>(initialMode);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOnboardingRole, setSignupOnboardingRole] = useState('Digital Artist / Creator');
  
  // Password Reset States
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileBalance, setProfileBalance] = useState(500.00);
  const [profileOnboardingRole, setProfileOnboardingRole] = useState('Digital Artist / Creator');

  // Status/Error states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setFeedbackMsg(null);
    setResetSuccess(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (currentUser && mode === 'profile') {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileBio(currentUser.bio);
      setProfileAvatar(currentUser.avatar);
      setProfileBalance(currentUser.balance);
      setProfileOnboardingRole(currentUser.onboardingRole || 'Digital Artist / Creator');
    }
  }, [currentUser, mode]);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handlePresetLogin = (presetUser: User) => {
    onLogin(presetUser);
    showFeedback(`Logged in as ${presetUser.name}`, 'success');
    onClose();
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showFeedback('Please fill in both fields', 'error');
      return;
    }

    // Try to match preset emails or make a user
    const foundUser = allUsers.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (foundUser) {
      onLogin(foundUser);
      onClose();
    } else {
      // Create a temporary user if not found
      const newUser: User = {
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name: loginEmail.split('@')[0],
        email: loginEmail,
        bio: "PassIMG verified digital creator.",
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        isAdmin: false,
        joinedAt: new Date().toISOString(),
        balance: 100.00
      };
      onSignUp(newUser);
      onLogin(newUser);
      onClose();
    }
  };

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail) {
      showFeedback('Name and Email are required', 'error');
      return;
    }

    const newUser: User = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      name: signupName,
      email: signupEmail,
      bio: signupBio || "Digital content creator and imagery expert.",
      avatar: `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1527983359383-4758693f760c'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&w=150&q=80`,
      isAdmin: false,
      joinedAt: new Date().toISOString(),
      balance: 100.00, // Default sign up funding
      onboardingRole: signupOnboardingRole
    };

    onSignUp(newUser);
    onLogin(newUser);
    showFeedback('Registration successful! Welcome.', 'success');
    onClose();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      showFeedback('Please specify your email address', 'error');
      return;
    }
    setResetSuccess(true);
    showFeedback('Password reset instructions emailed!', 'success');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileName || !profileEmail) {
      showFeedback('Name and Email cannot be empty', 'error');
      return;
    }

    const updated: User = {
      ...currentUser,
      name: profileName,
      email: profileEmail,
      bio: profileBio,
      avatar: profileAvatar || currentUser.avatar,
      balance: profileBalance,
      onboardingRole: profileOnboardingRole
    };

    onUpdateProfile(updated);
    showFeedback('Profile updated successfully!', 'success');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" id="auth-modal-overlay">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl glass shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200"
        id="auth-modal-card"
      >
        {/* Modal Header */}
        <div className="bg-white/5 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 shrink-0 flex items-center justify-center">
              <Logo size={24} />
            </div>
            <h2 className="font-sans text-lg font-bold text-white tracking-wide">
              {mode === 'login' && 'Sign In to PassIMG'}
              {mode === 'signup' && 'Create PassIMG Account'}
              {mode === 'reset' && 'Reset Secure Access'}
              {mode === 'profile' && 'Manage Creator Profile'}
            </h2>
          </div>
          <button 
            id="auth-close-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Feedback Area */}
        {feedbackMsg && (
          <div className={`px-6 py-3 text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border-b border-rose-500/20'
          }`}>
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <div className="p-6">
          {/* PROFILE EDIT MODE */}
          {mode === 'profile' && currentUser && (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-left" id="form-profile-edit">
              <div className="flex items-center space-x-4 pb-3 border-b border-white/10">
                <img 
                  src={profileAvatar || currentUser.avatar} 
                  alt="Avatar preview" 
                  className="h-16 w-16 rounded-xl object-cover border border-white/15 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5 w-full glass-input px-3 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">FullName</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Creator Bio</label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Introduce yourself to potential buyers or platform auditors..."
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">What best describes you? (Role)</label>
                <select
                  value={profileOnboardingRole}
                  onChange={(e) => setProfileOnboardingRole(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white bg-slate-900 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="Digital Artist / Creator">Digital Artist / Creator</option>
                  <option value="Independent Photojournalist">Independent Photojournalist</option>
                  <option value="Lead Creative Director / Buyer">Lead Creative Director / Buyer</option>
                  <option value="Hobbyist / Collector">Hobbyist / Collector</option>
                  <option value="Platform Integrity Admin">Platform Integrity Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Simulated Wallet Balance ($)</span>
                  <span className="text-[10px] text-indigo-400 tracking-wide font-mono font-bold">Sandbox Tuning</span>
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-400 text-xs font-mono">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={profileBalance}
                    onChange={(e) => setProfileBalance(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input py-2 pl-7 pr-3 text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all flex items-center justify-center space-x-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)] cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* STANDARD LOGIN FORM */}
          {mode === 'login' && (
            <div className="space-y-4 text-left">
              <form onSubmit={handleEmailLogin} className="space-y-3.5" id="form-login">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full glass-input py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-400">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full glass-input py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-semibold text-white tracking-wide hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                >
                  Sign In
                </button>
              </form>
 
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-[10px] text-zinc-400 font-bold tracking-wider uppercase">Quick Sandbox Presets</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
 
              {/* Sandbox Fast Profiles Trigger */}
              <div className="grid grid-cols-2 gap-2" id="login-presets">
                {allUsers.map((user) => (
                  <button
                    key={user.id}
                    id={`login-preset-${user.id}`}
                    onClick={() => handlePresetLogin(user)}
                    className="flex items-center space-x-2.5 rounded-xl border border-white/5 bg-white/5 p-2.5 text-left transition-all hover:border-indigo-500/25 hover:bg-white/10 cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate font-sans">
                      <p className="text-[10px] font-bold text-white truncate">{user.name.split(' ')[0]}</p>
                      <span className="text-[8px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
                        {user.isAdmin ? 'Admin' : user.id === 'usr_buyer' ? 'Buyer Agency' : 'Creator'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
 
              <p className="text-center text-xs text-slate-400 pt-2 font-sans">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            </div>
          )}
 
          {/* SIGN UP SECURE MODE */}
          {mode === 'signup' && (
            <div className="space-y-4 text-left">
              <form onSubmit={handleEmailSignUp} className="space-y-3.5" id="form-signup">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">FullName</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@creatives.net"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-[#6366f1]"
                  />
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Creator Bio (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your digital artwork, camera gears or publisher credentials..."
                    value={signupBio}
                    onChange={(e) => setSignupBio(e.target.value)}
                    className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 animate-pulse">What best describes you during onboarding? (Role)</label>
                  <select
                    value={signupOnboardingRole}
                    onChange={(e) => setSignupOnboardingRole(e.target.value)}
                    className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white bg-slate-900 focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="Digital Artist / Creator">Digital Artist / Creator</option>
                    <option value="Independent Photojournalist">Independent Photojournalist</option>
                    <option value="Lead Creative Director / Buyer">Lead Creative Director / Buyer</option>
                    <option value="Hobbyist / Collector">Hobbyist / Collector</option>
                    <option value="Platform Integrity Admin">Platform Integrity Admin</option>
                  </select>
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Create Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
 
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-semibold text-white tracking-wide hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                >
                  Create Creator Wallet
                </button>
              </form>
 
              <p className="text-center text-xs text-slate-400 pt-2 font-sans">
                Already registered?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
 
          {/* SECURE PASSWORD RESET */}
          {mode === 'reset' && (
            <div className="space-y-4 text-left">
              {!resetSuccess ? (
                <form onSubmit={handleResetPassword} className="space-y-4" id="form-reset">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Enter your certified email address. We will transmit a cryptographically signed recovery key to reset your wallet passcodes.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Certified Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-semibold text-white tracking-wide hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                  >
                    Transmit Recovery Key
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center py-4 font-sans">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Security Transmission Dispatched</h3>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                      A secured recovery validation token has been transmitted to <span className="font-semibold text-white">{resetEmail}</span>.
                    </p>
                  </div>
                </div>
              )}
 
              <p className="text-center text-xs text-slate-400 pt-2 font-sans">
                Back to{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
