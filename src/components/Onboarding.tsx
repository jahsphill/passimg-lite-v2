/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Sparkles, 
  User, 
  Lock, 
  Briefcase, 
  Compass, 
  FileText,
  BadgeAlert,
  PartyPopper,
  Upload
} from 'lucide-react';
import { User as UserType } from '../types';

interface OnboardingProps {
  currentUser: UserType | null;
  onComplete: (onboardingData: {
    onboardingRole: string;
    bio: string;
    avatar: string;
  }) => void;
}

export default function Onboarding({ currentUser, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // STEP 2 STATE: Roles selection
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSeeMoreExpanded, setIsSeeMoreExpanded] = useState(false);

  // STEP 3 STATE: Intended use-cases
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // STEP 4 STATE: Profile and Bio configuration
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Profile picture size must be under 2MB");
        return;
      }
      setUploadError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload a valid image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Profile picture size must be under 2MB");
        return;
      }
      setUploadError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // High contrast Neon brand color matching previous layout design
  const brandColor = '#1eff00';

  // Primary quick select roles
  const primaryRoles = [
    "Photographer",
    "Journalist",
    "Designer",
    "Content Creator",
    "Business Owner",
    "Media Organization",
    "Developer"
  ];

  // See More extended roles
  const extendedRoles = [
    "Investigative Journalist",
    "OSINT Researcher / Analyst",
    "Archivist / Librarian",
    "Legal / Compliance Professional",
    "Security / Intelligence Analyst",
    "Academic / Researcher",
    "Other"
  ];

  // Use cases options
  const goalsOptions = [
    "Protect my images",
    "Verify image authenticity",
    "Sell my images",
    "Build an image portfolio"
  ];

  // Saffron/Teal preset premium clean avatar illustrations
  const presetAvatars = [
    { name: 'Amber Neon', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { name: 'Emerald Lens', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Indigo Aura', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' },
    { name: 'Cyber Blue', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Hologram Teal', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80' }
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal) 
        : [...prev, goal]
    );
  };

  const handleFinish = () => {
    onComplete({
      onboardingRole: selectedRole || "SaaS Practitioner",
      bio: bio.trim() || "PassIMG verified original image register creator.",
      avatar: selectedAvatar || currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    });
  };

  return (
    <div className="py-12 max-w-xl mx-auto w-full px-4 select-none" id="onboarding-flow-container">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-slate-950/20">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] opacity-40" />
      </div>

      {/* Modern Progress Top Header */}
      <div className="mb-8 space-y-3" id="onboarding-stepper-header">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          <span>SaaS Setup Status</span>
          <span className="text-[#1eff00]">Step {step} of {totalSteps}</span>
        </div>
        
        {/* Sleek dynamic progress rail */}
        <div className="h-1 text-slate-800 rounded-full w-full bg-slate-900 border border-white/5 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00] transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Small step names visually indicator (on sm+) */}
        <div className="hidden sm:flex justify-between text-[9px] text-slate-500 font-mono tracking-tight pt-1">
          <span className={step >= 1 ? 'text-indigo-400 font-bold' : ''}>1. Welcome</span>
          <span className={step >= 2 ? 'text-indigo-400 font-bold' : ''}>2. Role Select</span>
          <span className={step >= 3 ? 'text-indigo-400 font-bold' : ''}>3. Intention</span>
          <span className={step >= 4 ? 'text-indigo-400 font-bold' : ''}>4. Profile Custom</span>
          <span className={step >= 5 ? 'text-[#1eff00] font-bold' : ''}>5. Success</span>
        </div>
      </div>

      {/* Main SaaS Card */}
      <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl relative overflow-hidden" id="onboarding-card-body">
        {/* Subtle decorative edge */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00]" />

        <div className="p-8 sm:p-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: WELCOME */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
                id="onboarding-s1"
              >
                <div className="h-16 w-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 relative">
                  <Sparkles className="h-8 w-8 text-[#1eff00]" />
                  <div className="absolute -inset-1 rounded-3xl bg-indigo-500/10 blur-sm -z-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome to PassIMG Lite</h2>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    Let's personalize your workspace.
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  We will configure your cryptographic signature keys, set up profile metadata identifiers, and customize standard access controls in less than a minute.
                </p>

                <div className="pt-4">
                  <button
                    onClick={handleNext}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/15 flex items-center justify-center space-x-2.5 cursor-pointer"
                    id="onboarding-s1-btn-continue"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: WHAT BEST DESCRIBES YOU? */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
                id="onboarding-s2"
              >
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">Workspace Persona</div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">What best describes you?</h3>
                  <p className="text-xs text-slate-400">
                    Select a specialization to tailor your commercial transfer rules.
                  </p>
                </div>

                {/* Primary Quick Select Options */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2" id="s2-chips-container">
                  {primaryRoles.map((role) => {
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' 
                            : 'bg-zinc-950/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>

                {/* See More Expandable Trigger Block */}
                <div className="border-t border-white/5 pt-3 mt-4 text-left">
                  <button
                    type="button"
                    onClick={() => setIsSeeMoreExpanded(!isSeeMoreExpanded)}
                    className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold tracking-tight focus:outline-none cursor-pointer"
                    id="s2-btn-see-more"
                  >
                    <span>{isSeeMoreExpanded ? 'Collapse additional options' : '+ See more roles'}</span>
                    {isSeeMoreExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {/* Expanded Additional Roles */}
                  <AnimatePresence>
                    {isSeeMoreExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-950/20 border border-white/5">
                          {extendedRoles.map((role) => {
                            const isSelected = selectedRole === role;
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className={`px-3 py-2 text-[11px] font-semibold rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-slate-800 border-indigo-500/50 text-[#1eff00]' 
                                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{role}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[#1eff00]" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons for S2 */}
                <div className="flex items-center space-x-3 pt-6" id="s2-action-block">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedRole}
                    className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      selectedRole 
                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md' 
                        : 'bg-zinc-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: WHAT WOULD YOU LIKE TO DO? */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
                id="onboarding-s3"
              >
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#1eff00] font-bold">Objectives Selection</div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">What would you like to do with PassIMG Lite?</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Check all options that match your current registry workflow requirements.
                  </p>
                </div>

                {/* Option list */}
                <div className="space-y-2.5 max-w-sm mx-auto text-left pt-2" id="s3-options-checklist">
                  {goalsOptions.map((goal) => {
                    const isChecked = selectedGoals.includes(goal);
                    return (
                      <div 
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`flex items-center space-x-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-zinc-900 border-[#1eff00]/40 text-white shadow-sm' 
                            : 'bg-slate-950/20 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/25'
                        }`}
                      >
                        <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                          isChecked 
                            ? 'bg-[#1eff00] border-[#1eff00] text-black' 
                            : 'border-slate-600'
                        }`}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold">{goal}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons for S3 */}
                <div className="flex items-center space-x-3 pt-6" id="s3-action-block">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={selectedGoals.length === 0}
                    className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      selectedGoals.length > 0 
                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md' 
                        : 'bg-zinc-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PROFILE SETUP */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
                id="onboarding-s4"
              >
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#1eff00] font-bold font-sans">Identifier Metadata</div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Profile Setup</h3>
                  <p className="text-xs text-slate-400">
                    Add standard digital identity details below (both parameters are optional).
                  </p>
                </div>

                <div className="space-y-5 text-left pt-2">
                  
                  {/* Optional Avatar chooser */}
                  <div className="space-y-2.5" id="s4-avatar-customizer">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      Select Custom Avatar or Upload Image
                    </label>
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-5">
                        {/* Active profile image container */}
                        <div className="relative group shrink-0">
                          <img 
                            src={selectedAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                            alt="Selected profile spec"
                            className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl"
                          />
                          <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Camera className="h-4 w-4 text-white" />
                          </div>
                        </div>

                        {/* Presets Grid row selection */}
                        <div className="flex-1 space-y-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">Or choose quick preset:</span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[280px] sm:max-w-none">
                            {presetAvatars.map((preset) => {
                              const isSelectAv = selectedAvatar === preset.url;
                              return (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => setSelectedAvatar(preset.url)}
                                  className={`h-9 w-9 rounded-xl overflow-hidden shrink-0 transition-transform relative border-2 cursor-pointer ${
                                    isSelectAv ? 'border-[#1eff00] scale-105' : 'border-transparent hover:scale-102'
                                  }`}
                                  title={preset.name}
                                >
                                  <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                                  {isSelectAv && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <Check className="h-3.5 w-3.5 text-[#1eff00]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Custom Drag & Drop/Click Upload Area */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border border-dashed rounded-xl p-4 text-center transition-all ${
                          isDragging 
                            ? 'border-[#1eff00] bg-[#1eff00]/5' 
                            : 'border-white/10 hover:border-white/20 bg-slate-950/40'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="onboarding-pic-upload"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor="onboarding-pic-upload"
                          className="cursor-pointer flex flex-col items-center space-y-1.5"
                        >
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Upload className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-white">
                              Upload your chosen profile picture, or <span className="text-[#1eff00] hover:underline">browse</span>
                            </p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Drag-and-drop works too! SVG, PNG, JPG, or WEBP (Max 2MB)
                            </p>
                          </div>
                        </label>
                      </div>

                      {uploadError && (
                        <p className="text-[10px] text-rose-500 font-semibold">{uploadError}</p>
                      )}

                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase font-sans tracking-wider block">
                          Paste any image link directly:
                        </label>
                        <input 
                          type="text"
                          value={selectedAvatar.startsWith("data:") ? "" : selectedAvatar}
                          onChange={(e) => setSelectedAvatar(e.target.value)}
                          placeholder="Or paste an image URL..."
                          className="w-full bg-slate-950/80 border border-white/5 py-1.5 px-3 rounded-lg text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Bio textarea */}
                  <div className="space-y-1.5" id="s4-bio-customizer">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                      Creator Bio Statement
                    </label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Media photographer focusing on architectural structures and standard blockchain audits..."
                      maxLength={180}
                      rows={3}
                      className="w-full glass-input p-3 text-xs text-white placeholder-slate-500 focus:outline-none rounded-xl resize-none"
                      id="input-ononboard-bio"
                    />
                    <div className="text-[10px] text-right text-slate-500 font-mono">
                      {bio.length}/180 characters limit
                    </div>
                  </div>

                </div>

                {/* Navigation Buttons for S4 */}
                <div className="flex items-center space-x-3 pt-4" id="s4-action-block">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-500/10"
                    id="onboarding-s4-continue"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS SCREEN */}
            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
                id="onboarding-s5"
              >
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 relative">
                  <PartyPopper className="h-8 w-8 text-[#1eff00]" />
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-sm -z-10 animate-ping" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">Welcome, {currentUser?.name || "Creator"}</h3>
                  <p className="text-sm font-semibold text-indigo-400">Your workspace is ready</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed pt-1">
                    You are ready to register, verify, store, and monetize your images.
                  </p>
                </div>

                {/* Visual Metadata verification summary */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 max-w-md mx-auto text-left font-mono text-[10px] space-y-1.5" id="s5-verified-receipt">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Identity Status</span>
                    <span className="text-[#1eff00] font-bold">✓ Credentials Sealed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Assigned Persona</span>
                    <span className="text-slate-300 font-semibold">{selectedRole}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Registry Focus</span>
                    <span className="text-slate-300">{selectedGoals.length} criteria active</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 border-t border-white/5 pt-1.5 mt-1.5">
                    <span>Ledger Funding Block ID</span>
                    <span className="text-slate-500">HSH-{(Math.random() * 100000).toFixed(0)}-LITE</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleFinish}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-[#1eff00] text-black font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_24px_rgba(16,185,129,0.25)] flex items-center justify-center space-x-2.5 cursor-pointer"
                    id="onboarding-s5-btn-finish"
                  >
                    <span>Go To Dashboard</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
