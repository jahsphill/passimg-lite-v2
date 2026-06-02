/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, SaleRecord } from '../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  BadgeDollarSign, 
  RefreshCw,
  Gift,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';

interface WalletViewProps {
  currentUser: User | null;
  saleRecords: SaleRecord[];
  onTriggerBalanceAdjust: (userId: string, quantity: number) => void;
  addToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function WalletView({
  currentUser,
  saleRecords,
  onTriggerBalanceAdjust,
  addToast
}: WalletViewProps) {
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [isRotating, setIsRotating] = useState(false);

  if (!currentUser) return null;

  // Filter transaction ledger actions related to active signed-in key
  const myPurchases = saleRecords.filter(s => s.buyerId === currentUser.id);
  const mySales = saleRecords.filter(s => s.sellerId === currentUser.id);

  const handleTopUp = (amount: number) => {
    onTriggerBalanceAdjust(currentUser.id, amount);
    addToast(`Successfully topped up ledger account with ${formatCurrency(amount)} Sandbox credits!`, 'success');
  };

  const reloadLedger = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
      addToast('Synced cryptographic ledger balance state with local block node.', 'info');
    }, 600);
  };

  return (
    <div className="space-y-6" id="wallet-view-section">
      
      {/* Header text info block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">Cryptographic Wallet & Balances</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Monitor currency ledger exchanges, purchase metadata certificates, and handle dynamic test-net sandbox tokens.
          </p>
        </div>
        <button
          onClick={reloadLedger}
          className="flex items-center space-x-1.5 self-start sm:self-center px-3 py-1.5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>Sync Node</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="wallet-dashboard-rows">
        
        {/* Dynamic Glowing Ledger Credit Card Widget */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-white/10 p-6 shadow-xl flex flex-col justify-between min-h-[220px]" id="wallet-neon-card">
            {/* Ambient neon radial glows */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#1eff00]/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start z-10">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400">Security Vault Card</span>
                <h3 className="text-sm font-semibold text-white">PassIMG Sandbox Ledger</h3>
              </div>
              <Wallet className="h-6 w-6 text-[#1eff00]" />
            </div>

            <div className="space-y-1.5 text-left z-10 my-4">
              <span className="text-[10px] text-indigo-300/80 font-mono font-bold tracking-tight">AVAILABLE PLATFORM FUNDS</span>
              <div className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-center">
                <span>{formatCurrency(currentUser.balance)}</span>
                <span className="text-[11px] text-[#1eff00] ml-2 font-bold uppercase font-mono">T-USD</span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1.5 text-left text-[10px] font-mono text-slate-400 z-10">
              <div>
                <span>CREATOR ADDRESS</span>
                <div className="text-white font-bold mt-0.5 tracking-wide">0xIMG...{currentUser.id.substring(4).toUpperCase()}</div>
              </div>
              <span className="text-emerald-400 font-bold flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" /> ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Credit top ups */}
          <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-left space-y-4" id="wallet-topup-actions">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Sandbox Top-Up Node</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Top-up instantly to purchase licensed image registry mock listings.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleTopUp(amount)}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-mono font-bold hover:border-indigo-500/50 transition-all cursor-pointer"
                >
                  +{amount}
                </button>
              ))}
            </div>

            <div className="flex gap-2" id="wallet-custom-funding">
              <input 
                type="number" 
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Math.max(1, Number(e.target.value)))}
                placeholder="Custom USD Mock Input"
                className="flex-1 bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleTopUp(topUpAmount)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>

        {/* Transaction ledger list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl text-left flex flex-col justify-between" id="wallet-accounting">
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Transaction Registry History</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 rounded-full px-2.5 py-1 font-mono font-bold uppercase">
                {myPurchases.length + mySales.length} Total Logs
              </span>
            </div>

            {/* Union of lists */}
            {myPurchases.length === 0 && mySales.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <BadgeDollarSign className="h-10 w-10 text-slate-600 animate-pulse" />
                <p className="text-xs">No cryptographic ledger transactions registered to this address.</p>
                <p className="text-[10px] text-slate-600 max-w-xs">Acquiring publisher licenses in the Marketplace or listing images will generate audit log transactions here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1.5" id="wallet-ledger-items">
                {/* 1. Purchase Actions list */}
                {myPurchases.map((purchase) => (
                  <div 
                    key={purchase.id} 
                    className="flex justify-between items-center p-3.5 rounded-xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">Acquired License: {purchase.imageTitle}</p>
                        <p className="text-[9px] text-slate-500 mt-1">{formatDate(purchase.timestamp)} • TxID: {purchase.id.substring(4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-red-400">-{formatCurrency(purchase.price)}</p>
                      <p className="text-[8px] text-slate-600">DEBIT CONFIRMED</p>
                    </div>
                  </div>
                ))}

                {/* 2. Sales earnings list */}
                {mySales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex justify-between items-center p-3.5 rounded-xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ArrowDownLeft className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">Commercial Sale: {sale.imageTitle}</p>
                        <p className="text-[9px] text-slate-500 mt-1">{formatDate(sale.timestamp)} • Buyer: {sale.buyerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">+{formatCurrency(sale.price)}</p>
                      <p className="text-[8px] text-slate-600">CREDIT SYNCED</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
