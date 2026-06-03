/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { 
  Settings, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Flame, 
  FileLock2, 
  Check, 
  SlidersHorizontal,
  BadgeAlert
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User | null;
  addToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function SettingsView({
  currentUser,
  addToast
}: SettingsViewProps) {
  const [ledgerSyncInterval, setLedgerSyncInterval] = useState('5s');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [hashComparisonAlgorithm, setHashComparisonAlgorithm] = useState('sha256');
  const [compressBeforeStorage, setCompressBeforeStorage] = useState(true);
  const [dmcaAutomatedAction, setDmcaAutomatedAction] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('pro');

  if (!currentUser) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("Workspace Node properties updated and propagated to ledger!", "success");
  };

  return (
    <div className="space-y-6" id="settings-view-section">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">Workspace Settings</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Configure cryptographic hash registers, automate copyright alerts compliance, and configure localized node protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="settings-main-row">
        
        {/* Left block: Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-left space-y-4" id="settings-status-card">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
              <Cpu className="h-4 w-4 text-indigo-400 mr-2" />
              Node Configuration Status
            </h3>

            <div className="space-y-3 font-mono text-[10px] text-slate-400 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>Client Engine</span>
                <span className="text-slate-300">Vite v5.1 / React 18</span>
              </div>
              <div className="flex justify-between">
                <span>W3C Verifier Specs</span>
                <span className="text-indigo-400 font-bold">Standard Spec-v2</span>
              </div>
              <div className="flex justify-between">
                <span>Active Ledger ID</span>
                <span className="text-slate-300">BLOCK_IMG_LEDGER_MAIN</span>
              </div>
              <div className="flex justify-between">
                <span>Local Time Offset</span>
                <span className="text-slate-300">UTC 15:20 (Locked)</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-3 mt-3">
                <span>Subscribed Tier</span>
                <span className="text-[#1eff00] font-bold uppercase">Enterprise Tier</span>
              </div>
            </div>
            
            <div className="bg-[#1eff00]/5 border border-[#1eff00]/25 rounded-xl p-3 text-[10px] text-[#1eff00] leading-relaxed font-mono">
              <strong>Ledger Sandbox Active:</strong> Modifying options below adjusts simulated ledger client headers. All hashes auto-signed with temporary developer keys.
            </div>
          </div>
        </div>

        {/* Right block: Main form editor settings */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveSettings} className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 text-left space-y-5" id="settings-properties-form">
            
            {/* Header subtext category */}
            <div className="border-b border-white/5 pb-2.5">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-widest font-mono flex items-center">
                <SlidersHorizontal className="h-4 w-4 text-indigo-400 mr-2" />
                Ledger Integration Options
              </h4>
            </div>

            {/* Form grid blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sync Interval */}
              <div className="space-y-1.5Col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Block Ledger Sync Interval
                </label>
                <select 
                  value={ledgerSyncInterval}
                  onChange={(e) => setLedgerSyncInterval(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:outline-none rounded-xl text-xs px-3.5 py-2.5"
                >
                  <option value="1s">Real-time (1 second)</option>
                  <option value="5s">Optimistic (5 seconds)</option>
                  <option value="30s">Batch Modes (30 seconds)</option>
                  <option value="manual">Manual Pull Pulls</option>
                </select>
              </div>

              {/* Hash Algs */}
              <div className="space-y-1.5Col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  Default Checksum Algos
                </label>
                <select 
                  value={hashComparisonAlgorithm}
                  onChange={(e) => setHashComparisonAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:outline-none rounded-xl text-xs px-3.5 py-2.5"
                >
                  <option value="sha256">SHA-256 (Highly Secure)</option>
                  <option value="sha512">SHA-512 (Advanced Registry)</option>
                  <option value="md5">MD5 Hex (Fast Legacy check)</option>
                </select>
              </div>

            </div>

            <div className="border-b border-white/5 pb-1 pt-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-widest font-mono flex items-center">
                <Database className="h-4 w-4 text-indigo-400 mr-2" />
                Compliance & Security
              </h4>
            </div>

            {/* Checkbox Rows settings */}
            <div className="space-y-3 pt-1">
              
              <label className="flex items-start space-x-3.5 p-3 rounded-xl bg-zinc-950/20 border border-white/5 cursor-pointer hover:border-white/10 select-none">
                <input 
                  type="checkbox" 
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-indigo-500 h-4 w-4 mt-0.5"
                />
                <div className="text-xs text-left">
                  <p className="font-semibold text-white">Require Multi-factor Signature Keys</p>
                  <p className="text-[10px] text-slate-550 text-slate-500 leading-normal">Forces confirmation challenge modals before transferring owned assets to buyers in marketplace.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3.5 p-3 rounded-xl bg-zinc-950/20 border border-white/5 cursor-pointer hover:border-white/10 select-none">
                <input 
                  type="checkbox" 
                  checked={compressBeforeStorage}
                  onChange={(e) => setCompressBeforeStorage(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-indigo-500 h-4 w-4 mt-0.5"
                />
                <div className="text-xs text-left">
                  <p className="font-semibold text-white">Lossless Compression Pre-upload</p>
                  <p className="text-[10px] text-slate-500 leading-normal">Automatically compress pixel telemetry data to save payload costs without changing the unique hash certificate output values.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3.5 p-3 rounded-xl bg-zinc-950/20 border border-white/5 cursor-pointer hover:border-white/10 select-none">
                <input 
                  type="checkbox" 
                  checked={dmcaAutomatedAction}
                  onChange={(e) => setDmcaAutomatedAction(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-indigo-500 h-4 w-4 mt-0.5"
                />
                <div className="text-xs text-left">
                  <p className="font-semibold text-white">Automate DMCA Copyright Takedowns</p>
                  <p className="text-[10px] text-slate-500 leading-normal">If a duplicate canvas copy is verified outside this server with 100% block match, automatically emit legal takedowns with signed license headers.</p>
                </div>
              </label>

            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center space-x-2.5 cursor-pointer ml-auto"
                id="btn-settings-save"
              >
                <Check className="h-4 w-4" />
                <span>Save Workspace Preference</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
