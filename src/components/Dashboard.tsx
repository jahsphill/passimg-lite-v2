/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, RegisteredImage, VerificationEvent, SaleRecord } from '../types';
import { 
  DollarSign, 
  ShoppingBag, 
  Files, 
  Search,
  Eye, 
  Calendar,
  Layers, 
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Award,
  BookOpen
} from 'lucide-react';
import { formatDate, formatCurrency, formatBytes } from '../utils';

interface DashboardProps {
  currentUser: User | null;
  registeredImages: RegisteredImage[];
  verificationEvents: VerificationEvent[];
  saleRecords: SaleRecord[];
  onTriggerAuth: () => void;
  onUpdateImage: (image: RegisteredImage) => void;
}

export default function Dashboard({
  currentUser,
  registeredImages,
  verificationEvents,
  saleRecords,
  onTriggerAuth,
  onUpdateImage
}: DashboardProps) {
  const [editingPriceImage, setEditingPriceImage] = useState<RegisteredImage | null>(null);
  const [newPrice, setNewPrice] = useState<number>(100);

  if (!currentUser) {
    return (
      <div className="flex h-96 flex-col items-center justify-center glass p-8 text-center text-slate-400">
        <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 mb-4 border border-indigo-500/20 animate-pulse">
          <Files className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Dashboard is Locked</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          Accessing specialized publisher logs requires authentication. Please toggle a creator account to investigate earnings matrices.
        </p>
        <button
          onClick={onTriggerAuth}
          className="mt-6 rounded-xl bg-indigo-500 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-600 transition-all font-sans tracking-wider uppercase shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          Authorize Dashboard
        </button>
      </div>
    );
  }

  // Filter content created/managed by active creator
  const myImages = registeredImages.filter(img => img.creatorId === currentUser.id);
  const myActiveListings = myImages.filter(img => img.isForSale);
  
  // Calculate analytics
  const mySales = saleRecords.filter(sale => sale.sellerId === currentUser.id);
  const totalEarnings = mySales.reduce((acc, sale) => acc + sale.price, 0);
  const totalVerifications = myImages.reduce((acc, img) => acc + img.verificationCount, 0);

  // Filter verification events related to creator's files
  const relatedVerifications = verificationEvents.filter(event => {
    if (!event.imageId) return false;
    const isMine = myImages.some(img => img.id === event.imageId);
    return isMine;
  });

  // Handle fast price change
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceImage) return;

    const updated: RegisteredImage = {
      ...editingPriceImage,
      price: newPrice
    };

    onUpdateImage(updated);
    setEditingPriceImage(null);
  };

  const handleDeListImage = (img: RegisteredImage) => {
    const updated: RegisteredImage = {
      ...img,
      isForSale: false,
      price: 0
    };
    onUpdateImage(updated);
  };

  return (
    <div className="space-y-6" id="dashboard-component">
      {/* Analytics stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" id="dashboard-stats-grid">
        <div className="glass p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <DollarSign className="h-4 w-4 text-indigo-400" />
            <span>Studio Revenue</span>
          </p>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{formatCurrency(totalEarnings)}</h3>
          <p className="text-[10px] text-slate-400 opacity-60 mt-1">From licensing sales</p>
        </div>

        <div className="glass p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <ShoppingBag className="h-4 w-4 text-indigo-400" />
            <span>Licensing Sales</span>
          </p>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{mySales.length} items</h3>
          <p className="text-[10px] text-slate-400 opacity-60 mt-1">Acquired copyrights</p>
        </div>

        <div className="glass p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Files className="h-4 w-4 text-indigo-400" />
            <span>Registered Files</span>
          </p>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{myImages.length} images</h3>
          <p className="text-[10px] text-slate-400 opacity-60 mt-1">Fingerprinted on ledger</p>
        </div>

        <div className="glass p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <RefreshCw className="h-4 w-4 text-indigo-400" />
            <span>Security Audits</span>
          </p>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{relatedVerifications.length} checked</h3>
          <p className="text-[10px] text-slate-400 opacity-60 mt-1">Verify integrity requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="dashboard-splits">
        
        {/* Active listings tracking / Management */}
        <div className="glass p-5 space-y-4 text-left lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h4 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Active Marketplace Listings</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Control pricing metrics and licensings.</p>
            </div>
            <span className="rounded-lg bg-indigo-500/10 text-indigo-400 px-2.5 py-1 text-[10px] font-mono font-bold border border-indigo-500/20">
              {myActiveListings.length} Active
            </span>
          </div>

          {myActiveListings.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center text-center text-slate-400">
              <ShoppingBag className="h-8 w-8 text-slate-400 opacity-20 mb-1" />
              <p className="text-xs font-semibold text-white">No active listings</p>
              <p className="text-[11px] text-slate-400">Choose images from your Personal Gallery to list on sale.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1" id="creator-active-panel">
              {myActiveListings.map((img) => (
                <div key={img.id} className="rounded-xl bg-white/5 p-3 flex items-center justify-between border border-white/5 hover:border-indigo-500/20 transition-all text-left">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img src={img.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-xs">{img.title}</p>
                      <div className="flex space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>ID: {img.id}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-semibold">{img.licenseType}</span>
                        <span>•</span>
                        <span className="font-semibold text-white">{formatCurrency(img.price)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setEditingPriceImage(img);
                        setNewPrice(img.price);
                      }}
                      className="rounded-lg bg-white/5 p-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      title="Adjust Pricing"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeListImage(img)}
                      className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Remove Listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales history tracker */}
        <div className="glass p-5 space-y-4 text-left">
          <div className="border-b border-white/10 pb-3">
            <h4 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Track Image Sales</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded license copy orders</p>
          </div>

          {mySales.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center text-center text-slate-400">
              <FileSpreadsheet className="h-8 w-8 text-slate-400 opacity-20 mb-1" />
              <p className="text-xs font-semibold text-white">No sales logged yet</p>
              <p className="text-[11px] text-slate-400">Keep assets verified to attract multi-media publishers.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1" id="sales-history-log">
              {mySales.map((sale) => (
                <div key={sale.id} className="rounded-xl bg-white/5 p-3 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-white/10 pb-1">
                    <span>TX: {sale.id}</span>
                    <span>{formatDate(sale.timestamp).split(',')[0]}</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-white truncate max-w-[200px]">{sale.imageTitle}</h5>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Buyer: {sale.buyerName}</span>
                      <span className="font-mono text-indigo-400 font-bold">+{formatCurrency(sale.price)}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-1.5 text-center font-bold text-[9px] tracking-widest text-slate-400 uppercase border border-white/5">
                    {sale.licenseType} Use Licence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monitoring image verification / Integrity History */}
      <div className="glass p-5 text-left" id="creator-audit-history">
        <div className="border-b border-white/10 pb-3">
          <h4 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Image Verification History</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Audit checking request traces performed on your intellectual property certificates.</p>
        </div>

        {relatedVerifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-sans">
            <RefreshCw className="h-8 w-8 text-slate-400 opacity-20 mx-auto mb-1 animate-spin" style={{ animationDuration: '4s' }} />
            <p className="text-xs font-semibold text-white">No verification requests logged</p>
            <p className="text-[11px] text-slate-400 mt-1">External audits are logged permanently to preserve copyright chains.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto" id="creator-verification-table-container">
            <table className="w-full text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 text-left font-semibold">Audit Check ID</th>
                  <th className="py-2.5 text-left font-semibold">Asset Name</th>
                  <th className="py-2.5 text-left font-semibold">Filename Uploaded</th>
                  <th className="py-2.5 text-left font-semibold">Audit Checked By</th>
                  <th className="py-2.5 text-left font-semibold">Timestamp</th>
                  <th className="py-2.5 text-right font-semibold">Status / Checkbox</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {relatedVerifications.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-900/40">
                    <td className="py-3 font-mono text-[10.5px] text-zinc-500">{event.id}</td>
                    <td className="py-3 font-semibold text-white">{event.imageTitle}</td>
                    <td className="py-3 font-mono text-[10.5px] text-zinc-450 truncate max-w-[150px]">{event.uploadedFileName}</td>
                    <td className="py-3 text-zinc-400">{event.triggeredBy}</td>
                    <td className="py-3 text-zinc-500">{formatDate(event.timestamp)}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center space-x-1 rounded px-2 py-0.5 text-[9.5px] font-bold leading-none ${
                        event.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {event.status === 'verified' ? 'Verified (100%)' : `Failed (${event.similarity}%)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK PRICE ADJSUT DIALOG */}
      {editingPriceImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" id="dashboard-price-modal">
          <form onSubmit={handleSavePrice} className="w-full max-w-xs rounded-2xl border border-zinc-850 bg-zinc-900 p-6 space-y-4">
            <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider text-left">Modify License Price</h3>
            
            <div className="space-y-1.5 text-left">
              <label className="block text-xs text-zinc-400 font-semibold">License Valuation ($)</label>
              <input 
                type="number"
                min="1"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white font-mono focus:border-teal-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPriceImage(null)}
                className="flex-1 rounded-lg border border-zinc-805 py-2 text-xs font-bold text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-teal-500 py-2 text-xs font-bold text-zinc-950"
              >
                Save Price
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
