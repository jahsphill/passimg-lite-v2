/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, RegisteredImage, VerificationEvent, SaleRecord } from '../types';
import { 
  ShieldAlert, 
  Users, 
  Database, 
  Activity, 
  ShieldCheck, 
  DollarSign, 
  Trash2, 
  Filter, 
  Search,
  BookOpen,
  Mail,
  Sliders,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils';

interface AdminDashboardProps {
  currentUser: User | null;
  allUsers: User[];
  registeredImages: RegisteredImage[];
  verificationEvents: VerificationEvent[];
  saleRecords: SaleRecord[];
  onTriggerAuth: () => void;
  onUpdateUser: (user: User) => void;
  onRemoveFraudulentImage: (id: string) => void;
  onAddSystemLog: (msg: string) => void;
}

export default function AdminDashboard({
  currentUser,
  allUsers,
  registeredImages,
  verificationEvents,
  saleRecords,
  onTriggerAuth,
  onUpdateUser,
  onRemoveFraudulentImage,
  onAddSystemLog
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'listings' | 'audits'>('analytics');
  
  // Tuning state
  const [tuningUser, setTuningUser] = useState<User | null>(null);
  const [tunedBalance, setTunedBalance] = useState<number>(0);

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="flex h-96 flex-col items-center justify-center glass p-8 text-center text-slate-400" id="admin-forbidden-card">
        <div className="rounded-full bg-rose-500/10 p-4 font-mono text-rose-500 mb-4 border border-rose-500/20 animate-pulse">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Administrator Access Restricted</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          The Admin Dashboard requires professional platform auditing credentials. Please switch your active role to "Sarah Jenkins" at the top selector to access the security controls.
        </p>
      </div>
    );
  }

  // PLATFORM ANALYTICS CALCULATIONS
  const totalVolumeTraded = saleRecords.reduce((acc, sale) => acc + sale.price, 0);
  const totalCheckVolume = verificationEvents.length;
  const verifiedMatchCount = verificationEvents.filter(e => e.status === 'verified').length;
  const failedCheckCount = verificationEvents.filter(e => e.status === 'failed').length;

  const handleTuneBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tuningUser) return;

    const updated: User = {
      ...tuningUser,
      balance: tunedBalance
    };

    onUpdateUser(updated);
    onAddSystemLog(`Security Audit: Admin Sarah updated balance for user ${tuningUser.name} to ${formatCurrency(tunedBalance)}.`);
    setTuningUser(null);
  };

  const handleRemoveFraudulentListing = (imgId: string, title: string) => {
    if (confirm(`CRITICAL SECURITY ACTION: Are you sure you want to flag and remove "${title}" as fraudulent/copyright-violating content?`)) {
      onRemoveFraudulentImage(imgId);
      onAddSystemLog(`Security Audit: Automated DMCA takedown. Admin Sarah removed copyright listed image: ${title} (${imgId}).`);
    }
  };

  return (
    <div className="space-y-6" id="admin-dashboard-view">
      {/* Tab bar header */}
      <div className="flex overflow-x-auto space-x-1.5 border-b border-white/10 pb-1" id="admin-dashboard-tabs">
        {[
          { id: 'analytics', name: 'Platform Analytics', icon: Activity },
          { id: 'users', name: 'Manage Users', icon: Users },
          { id: 'listings', name: 'Review Listings', icon: ShieldAlert },
          { id: 'audits', name: 'Audits Trace', icon: Database }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 whitespace-nowrap px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white border-t-2 border-indigo-500 shadow-[0_-2px_10px_rgba(99,102,241,0.1)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComp className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* 1. PLATFORM ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6" id="admin-analytics-tab">
          {/* Main big numbers grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="glass p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ledgers Registered</p>
              <h3 className="text-xl font-bold text-indigo-400 font-mono mt-2">{registeredImages.length} Certificates</h3>
              <p className="text-[10px] text-slate-400 opacity-60 mt-1">Certified copyrights files</p>
            </div>

            <div className="glass p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Check Volume</p>
              <h3 className="text-xl font-bold text-white font-mono mt-2">{totalCheckVolume} Audits</h3>
              <p className="text-[10px] text-slate-400 opacity-60 mt-1">Processed checksum verifiers</p>
            </div>

            <div className="glass p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Traded Value</p>
              <h3 className="text-xl font-bold text-indigo-400 font-mono mt-2">{formatCurrency(totalVolumeTraded)}</h3>
              <p className="text-[10px] text-slate-400 opacity-60 mt-1">Processed peer-to-peer licenses</p>
            </div>

            <div className="glass p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Registered Users</p>
              <h3 className="text-xl font-bold text-indigo-300 font-mono mt-2">{allUsers.length} profiles</h3>
              <p className="text-[10px] text-slate-400 opacity-60 mt-1">Verified creator nodes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Integrity Audit breakdown ratios charts */}
            <div className="glass p-5 text-left space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Integrity Checks Breakdown Ratio</h4>
              <div className="flex h-4 rounded-full overflow-hidden bg-slate-950/60 border border-white/10">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${(verifiedMatchCount / Math.max(1, totalCheckVolume)) * 100}%` }}
                  title={`Authentics matches: ${verifiedMatchCount}`}
                ></div>
                <div 
                  className="bg-rose-500 h-full" 
                  style={{ width: `${(failedCheckCount / Math.max(1, totalCheckVolume)) * 100}%` }}
                  title={`Tampered warnings: ${failedCheckCount}`}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-emerald-500 rounded"></div>
                  <div className="min-w-0">
                    <p className="text-slate-400">Authentic Matches (100%):</p>
                    <p className="text-white text-sm font-semibold mt-0.5">{verifiedMatchCount} checks ({((verifiedMatchCount / Math.max(1, totalCheckVolume)) * 100).toFixed(1)}%)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-rose-500 rounded"></div>
                  <div className="min-w-0">
                    <p className="text-slate-400">Tampered Warnings / Mismatch:</p>
                    <p className="text-white text-sm font-semibold mt-0.5">{failedCheckCount} warnings ({((failedCheckCount / Math.max(1, totalCheckVolume)) * 100).toFixed(1)}%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform licensing split categories volumes */}
            <div className="glass p-5 text-left space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sub-Categories Distribution Checklist</h4>
              <div className="space-y-2">
                {['Photography', 'Journalism', 'Digital Art', 'Illustration', 'Design'].map((cat) => {
                  const countInCat = registeredImages.filter(img => img.category === cat).length;
                  const percent = (countInCat / Math.max(1, registeredImages.length)) * 100;
                  return (
                    <div key={cat} className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between font-medium">
                        <span>{cat}</span>
                        <span className="text-white text-[11px]">{countInCat} files ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1 rounded bg-slate-950/60 overflow-hidden">
                        <div className="bg-indigo-400 h-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4" id="admin-users-tab">
          <div className="glass p-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-left">Active Platform Nodes list</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {allUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-start justify-between hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center space-x-3.5 min-w-0 text-left">
                    <img src={user.avatar} className="h-12 w-12 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white flex items-center">
                        {user.name}
                        {user.isAdmin && <span className="ml-1.5 text-[8px] border border-red-500/10 bg-red-500/10 text-red-400 px-1 py-0.5 rounded font-mono uppercase font-bold text-center">Platform Admin</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">{user.email}</p>
                      <div className="flex space-x-2 text-[10px] text-slate-400 font-mono mt-1.5 font-sans">
                        <span>Balance: <strong className="text-indigo-400">{formatCurrency(user.balance)}</strong></span>
                        <span>•</span>
                        <span>Joined: {formatDate(user.joinedAt).split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      id={`tune-user-${user.id}`}
                      onClick={() => {
                        setTuningUser(user);
                        setTunedBalance(user.balance);
                      }}
                      className="rounded-lg bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 text-[10px] text-indigo-400 hover:text-white hover:bg-indigo-500 transition-all font-semibold cursor-pointer"
                    >
                      Tune Wallet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. REVIEW LISTINGS (FRAUD DETECTION TAKEDOWNS) */}
      {activeTab === 'listings' && (
        <div className="space-y-4" id="admin-listings-tab">
          <div className="glass p-5 space-y-4">
            <div className="border-b border-white/10 pb-3 text-left">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Review Active Marketplace Content</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Scrutinize copyright compliance and plagiarism reports. Take down plagiarised files instantly.</p>
            </div>

            <div className="space-y-3" id="admin-listed-review-container">
              {registeredImages.map((img) => (
                <div key={img.id} className="rounded-xl bg-white/5 p-4 flex items-center justify-between border border-white/5 hover:border-indigo-500/20 transition-all text-left">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img src={img.imageUrl} className="h-11 w-11 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">{img.title}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono mt-1">
                        <span>ID: {img.id}</span>
                        <span>•</span>
                        <span>Author: {img.creatorName}</span>
                        <span>•</span>
                        <span>Licensing Value: <strong className="text-white">{formatCurrency(img.price)}</strong></span>
                        <span>•</span>
                        {img.isForSale ? (
                          <span className="text-indigo-400 font-semibold">ACTIVE LISTING</span>
                        ) : (
                          <span className="text-slate-500">NOT LISTED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <button
                      id={`admin-delist-${img.id}`}
                      onClick={() => handleRemoveFraudulentListing(img.id, img.title)}
                      className="rounded-lg bg-red-500/10 hover:bg-indigo-500 hover:text-white border border-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400 transition-colors cursor-pointer"
                    >
                      Takedown (DMCA)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDITS LOG TRACE MONITOR */}
      {activeTab === 'audits' && (
        <div className="space-y-4" id="admin-audits-tab">
          <div className="glass p-5 text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Audit Check occurrences history (Platform audits)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-350">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 text-left font-semibold">Verification Code</th>
                    <th className="py-2.5 text-left font-semibold">Filename Processed</th>
                    <th className="py-2.5 text-left font-semibold">Matched Asset ID</th>
                    <th className="py-2.5 text-left font-semibold">Triggered By</th>
                    <th className="py-2.5 text-left font-semibold">Date/Time</th>
                    <th className="py-2.5 text-right font-semibold">Outcome / Similarity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {verificationEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono text-slate-400 text-[10.5px]">{ev.id}</td>
                      <td className="py-3 font-mono text-white text-[10.5px] truncate max-w-[150px]" title={ev.uploadedFileName}>{ev.uploadedFileName}</td>
                      <td className="py-3 font-mono text-[10.5px] text-indigo-400 font-semibold">{ev.imageId || 'UNREGISTERED'}</td>
                      <td className="py-3 text-slate-400">{ev.triggeredBy}</td>
                      <td className="py-3 text-slate-400">{formatDate(ev.timestamp)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-[9px] font-bold font-mono ${
                          ev.status === 'verified' ? 'verified-glow text-emerald-400 bg-emerald-500/10' : 'tampered-glow text-red-400 bg-red-400/10'
                        }`}>
                          {ev.status === 'verified' ? 'Verified (100%)' : `Failed (${ev.similarity}%)`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USER WALLET BALANCE TUNER DIALOG */}
      {tuningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" id="admin-tune-wallet-modal">
          <form onSubmit={handleTuneBalanceSubmit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 glass p-6 space-y-4">
            <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider text-left flex items-center space-x-1.5">
              <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
              <span>Tune User Sandbox Wallet Balance</span>
            </h3>

            <p className="text-xs text-slate-400 text-left leading-normal">
              Directly adjust wallet balance for <span className="font-bold text-white">{tuningUser.name}</span> to simulate credit additions, payments, or platform service rewards.
            </p>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs text-slate-400 font-semibold">Configure Balance Amount ($)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                required
                value={tunedBalance}
                onChange={(e) => setTunedBalance(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 glass-input"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTuningUser(null)}
                className="flex-1 rounded-lg border border-white/15 py-2 text-xs font-bold text-slate-400 cursor-pointer hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-indigo-500 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                Commit Balance Tuning
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
