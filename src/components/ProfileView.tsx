/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { 
  User as UserIcon, 
  MapPin, 
  Mail, 
  Sparkles, 
  Briefcase, 
  ShieldCheck,
  Calendar,
  Save,
  Check
} from 'lucide-react';
import { formatDate } from '../utils';

interface ProfileViewProps {
  currentUser: User | null;
  onUpdateProfile: (user: User) => void;
  addToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function ProfileView({
  currentUser,
  onUpdateProfile,
  addToast
}: ProfileViewProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [role, setRole] = useState(currentUser?.onboardingRole || 'Photographer');

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Full Name is strict requirement.", "warning");
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim(),
      avatar: avatar.trim(),
      onboardingRole: role
    };

    onUpdateProfile(updatedUser);
  };

  const presetRoles = [
    "Photographer",
    "Journalist",
    "Designer",
    "Content Creator",
    "Business Owner",
    "Media Organization",
    "Developer",
    "OSINT Researcher / Analyst"
  ];

  return (
    <div className="space-y-6" id="profile-view-section">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">Creator Identity Profile</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Update your cryptographic passport details, biography certifications, and verified registry credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="profile-container-blocks">
        
        {/* Left pane: Profile Card Preview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-center space-y-4 relative overflow-hidden" id="profile-card-preview">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00]" />
            
            <div className="relative h-20 w-20 mx-auto rounded-2xl overflow-hidden border-2 border-[#1eff00] shadow-xl">
              <img 
                src={avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                alt={name} 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">{name || 'Creator Name'}</h3>
              <p className="text-[10px] text-[#1eff00] font-bold font-mono tracking-wide uppercase">{role}</p>
            </div>

            <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 text-[11px] text-slate-350 min-h-[60px] leading-relaxed text-left font-serif italic">
              "{bio || 'Add a bio statement in the editor to express your authentication vision.'}"
            </div>

            <div className="border-t border-white/5 pt-4 text-[10px] text-left font-mono text-slate-500 space-y-1.5" id="profile-card-details">
              <div className="flex items-center justify-between">
                <span>Account Node ID:</span>
                <span className="text-white font-bold">{currentUser.id.substring(4).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Verification State:</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <ShieldCheck className="h-3 w-3 mr-0.5" /> VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Joined Ledger:</span>
                <span>{formatDate(currentUser.joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Profile Editor module Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 text-left space-y-4" id="profile-editor-form">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full name input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Full Creator Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Sterling"
                    className="w-full glass-input pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Private Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@creative.com"
                    className="w-full glass-input pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Profile Avatar URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                Profile Photo / Avatar Image URL
              </label>
              <input 
                type="text" 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Paste picture URL here..."
                className="w-full glass-input px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none rounded-xl"
              />
            </div>

            {/* Onboarding Persona Choice selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                Onboarded Workspace Identity Persona
              </label>
              <div className="flex flex-wrap gap-2 pt-1" id="profile-onboarding-chips">
                {presetRoles.map((preset) => {
                  const isActive = role === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRole(preset)}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm font-bold' 
                          : 'bg-zinc-950/40 border-white/5 text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Biography section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                Creator Bio Statement
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief visual statement summarizing verification methods or target gallery aesthetics..."
                maxLength={180}
                rows={3}
                className="w-full glass-input p-3.5 text-xs text-white placeholder-slate-505 focus:outline-none rounded-xl resize-none"
              />
              <div className="text-[9px] text-right text-slate-500 font-mono">
                {bio.length}/180 character limit
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center space-x-2.5 cursor-pointer ml-auto"
                id="profile-btn-save"
              >
                <Save className="h-4 w-4" />
                <span>Save Passport Profile</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
