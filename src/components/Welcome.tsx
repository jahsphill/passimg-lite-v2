/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  FileImage, 
  ShieldCheck, 
  Lock, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles,
  Zap,
  Fingerprint
} from 'lucide-react';
import Logo from './Logo';

interface WelcomeProps {
  onGetStarted: () => void;
}

export default function Welcome({ onGetStarted }: WelcomeProps) {
  // Vibrant saturated neon green to represent brand consistency
  const neonGreen = '#1eff00';

  // Step cards configurations
  const steps = [
    {
      id: 'register',
      title: 'Register Image',
      description: 'Upload your original asset to generate immutable standard crypt signatures and digital SHA-256 fingerprints.',
      icon: FileImage,
      color: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/20 hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      tagColor: 'bg-amber-500/10 text-amber-300'
    },
    {
      id: 'verify',
      title: 'Verify Authenticity',
      description: 'Instantly auditable matching engine. Check secondary copies or uploaded specimens against registered ledger state.',
      icon: ShieldCheck,
      color: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconColor: 'text-emerald-400',
      tagColor: 'bg-emerald-500/10 text-emerald-300'
    },
    {
      id: 'store',
      title: 'Store Securely',
      description: 'Keep certified assets tucked inside a secured, personal ledger protected by active cryptographic credentials.',
      icon: Lock,
      color: 'from-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/20 hover:border-blue-500/50',
      iconColor: 'text-blue-400',
      tagColor: 'bg-blue-500/10 text-blue-300'
    },
    {
      id: 'monetize',
      title: 'Sell in Marketplace',
      description: 'Publish verified digital signatures, transfer commercial ownership licenses, and earn directly without middleman risk.',
      icon: ShoppingBag,
      color: 'from-indigo-500/10 to-transparent',
      borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
      iconColor: 'text-indigo-400',
      tagColor: 'bg-indigo-500/10 text-indigo-300'
    }
  ];

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 select-none overflow-hidden" id="welcome-page-landing">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] opacity-70" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl space-y-12 z-10 text-center">
        
        {/* PassIMG Lite Logo Area */}
        <div className="flex flex-col items-center justify-center space-y-2" id="welcome-logo-area">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 animate-pulse">
            <Logo size="100%" />
            <div className="absolute -inset-1 rounded-3xl bg-[#1eff00]/10 blur-md -z-10" />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-xs font-bold tracking-[0.2em] font-mono text-slate-500 uppercase">PassIMG Lite Enterprise</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[9px] font-bold uppercase tracking-wider border border-indigo-500/20">V2.4 Active</span>
          </div>
        </div>

        {/* Headline Section */}
        <div className="space-y-4 max-w-3xl mx-auto" id="welcome-caption-area">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white line-clamp-2 md:leading-[1.15]">
            Authenticate. Protect. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#1eff00] to-teal-400">Monetize Your Images.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            The standard secure registry for digital image ownership. Keep your metadata sealed with dynamic, mathematically verified cryptographic hashes.
          </p>
        </div>

        {/* Beautiful Dynamic Flowchart / Illustration Box */}
        <div className="glass rounded-3xl border border-white/10 bg-slate-900/10 p-6 sm:p-8 relative overflow-hidden group shadow-2xl" id="welcome-illustration-board">
          
          {/* subtle mesh overlay inside board */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />

          {/* Interactive Flow line indicator (visible on md+) */}
          <div className="absolute top-[32%] left-[10%] right-[10%] h-px bg-gradient-to-r from-amber-500/40 via-emerald-500/40 to-indigo-500/40 hidden md:block z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1eff00]/50 to-transparent w-full animate-[shimmer_3s_infinite]" style={{ backgroundSize: '200% 100%' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10" id="welcome-flowchart-grid">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center p-5 rounded-2xl border bg-slate-950/20 backdrop-blur-sm transition-all duration-300 relative group overflow-hidden ${step.borderColor}`}
                  id={`welcome-step-card-${step.id}`}
                >
                  {/* Visual card glow back */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b ${step.color} duration-300 pointer-events-none -z-10`} />

                  {/* Flow Badge Indicator */}
                  <div className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${step.tagColor}`}>
                    0{index + 1}
                  </div>

                  {/* Icon Area */}
                  <div className={`h-11 w-11 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center ${step.iconColor} mb-3.5 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Body Text */}
                  <h4 className="text-xs font-bold text-white tracking-wide mb-1.5">{step.title}</h4>
                  <p className="text-[10px] text-slate-400 text-center leading-normal max-w-[170px] font-medium">
                    {step.description}
                  </p>

                  {/* Connect arrow helper for mobile, step indicators */}
                  {index < 3 && (
                    <div className="absolute bottom-2 md:hidden text-slate-600 animate-bounce">
                      ↓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Secure Standard Watermark Label */}
          <div className="flex items-center justify-center space-x-2 pt-6 mt-6 border-t border-white/5 text-[10px] text-slate-500 font-mono">
            <Fingerprint className="h-3 w-3 text-[#1eff00]" />
            <span>PassIMG Certified Dynamic Ownership Handoff Standard (W3C Checked)</span>
          </div>
        </div>

        {/* CTA Button Block */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4" id="welcome-cta-action">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1eff00]/90 text-white font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_24px_rgba(99,102,241,0.25)] flex items-center justify-center space-x-2.5 cursor-pointer"
            id="welcome-btn-get-started"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
