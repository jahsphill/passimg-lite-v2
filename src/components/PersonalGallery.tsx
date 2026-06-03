/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegisteredImage, User, VerificationEvent } from '../types';
import { 
  ShieldCheck, 
  Tag, 
  Calendar, 
  ShoppingBag, 
  Sliders, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  FileCheck, 
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  PackageCheck,
  Globe2,
  Lock,
  Plus
} from 'lucide-react';
import { formatDate, formatCurrency, formatBytes } from '../utils';

interface PersonalGalleryProps {
  currentUser: User | null;
  registeredImages: RegisteredImage[];
  verificationEvents?: VerificationEvent[];
  onTriggerAuth: () => void;
  onUpdateImage: (image: RegisteredImage) => void;
  onDeleteImage: (id: string) => void;
  onNavigateToVerify?: (image: RegisteredImage) => void;
}

export default function PersonalGallery({
  currentUser,
  registeredImages,
  verificationEvents = [],
  onTriggerAuth,
  onUpdateImage,
  onDeleteImage,
  onNavigateToVerify
}: PersonalGalleryProps) {
  // Filters & State
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'marketplace' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog Actions
  const [selectedImageDetails, setSelectedImageDetails] = useState<RegisteredImage | null>(null);
  const [editingImage, setEditingImage] = useState<RegisteredImage | null>(null);
  const [listingForSaleImage, setListingForSaleImage] = useState<RegisteredImage | null>(null);

  // Forms editing states
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');

  // Listing for sale forms states
  const [listPrice, setListPrice] = useState<number>(100);
  const [listLicenseType, setListLicenseType] = useState<'Commercial' | 'Editorial' | 'Personal'>('Commercial');

  if (!currentUser) {
    return (
      <div className="flex h-96 flex-col items-center justify-center glass p-8 text-center text-slate-400" id="gallery-unsigned-card">
        <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 mb-4 border border-indigo-500/20 animate-pulse">
          <Lock className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Gallery is Secured</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          The Personal Gallery operates on signed cryptographic author credentials. Please sign in or trigger a preset sandbox role to audit your registered assets.
        </p>
        <button
          onClick={onTriggerAuth}
          className="mt-6 rounded-xl bg-indigo-500 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-600 transition-all font-sans tracking-wider uppercase shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          Authenticate & Unlock Gallery
        </button>
      </div>
    );
  }

  // 1. Filter active user images
  const myImages = registeredImages.filter(img => img.creatorId === currentUser.id);

  // 2. Query terms matching tags, date, ID
  const searchedImages = myImages.filter(img => {
    const term = searchQuery.toLowerCase();
    const queryMatch = img.title.toLowerCase().includes(term) ||
                       img.id.toLowerCase().includes(term) ||
                       img.tags.some(t => t.toLowerCase().includes(term)) ||
                       img.registeredAt.toLowerCase().includes(term);

    // Filter statuses
    if (activeFilter === 'verified') return queryMatch; // all registered are technically verified authentic
    if (activeFilter === 'marketplace') return queryMatch && img.isForSale;
    if (activeFilter === 'recent') {
      const datesDiff = new Date().getTime() - new Date(img.registeredAt).getTime();
      return queryMatch && (datesDiff < 1000 * 60 * 60 * 24 * 7); // within 7 days
    }
    return queryMatch;
  });

  // 3. Perform sorting of recent items
  const sortedImages = [...searchedImages].sort((a,b) => {
    if (activeFilter === 'recent') {
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    }
    return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
  });

  // 4. Trigger editing mechanics
  const openEditDialog = (img: RegisteredImage) => {
    setEditingImage(img);
    setEditTitle(img.title);
    setEditDesc(img.description);
    setEditCategory(img.category);
    setEditTags(img.tags.join(', '));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    const updated: RegisteredImage = {
      ...editingImage,
      title: editTitle,
      description: editDesc,
      category: editCategory,
      tags: editTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    };

    onUpdateImage(updated);
    setEditingImage(null);
  };

  // 5. Trigger marketplace listing settings
  const openListingDialog = (img: RegisteredImage) => {
    setListingForSaleImage(img);
    setListPrice(img.price > 0 ? img.price : 149);
    setListLicenseType(img.licenseType !== 'All' ? img.licenseType : 'Commercial');
  };

  const handleListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingForSaleImage) return;

    const updated: RegisteredImage = {
      ...listingForSaleImage,
      isForSale: true,
      price: listPrice,
      licenseType: listLicenseType
    };

    onUpdateImage(updated);
    setListingForSaleImage(null);
  };

  const handleDeListImage = (img: RegisteredImage) => {
    const updated: RegisteredImage = {
      ...img,
      isForSale: false,
      price: 0
    };
    onUpdateImage(updated);
  };

  const handleDownloadCertificate = (img: RegisteredImage) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Verification Certificate - ${img.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #09090b; color: #f4f4f5; padding: 40px; margin: 0; }
            .cert { border: 2px solid #14b8a6; padding: 40px; border-radius: 16px; max-width: 650px; margin: auto; background: #18181b; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: rgba(20,184,166,0.1); border: 1px solid #14b8a6; color: #2dd4bf; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            h1 { font-size: 26px; margin: 0 0 10px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            h2 { font-size: 14px; margin: 0 0 30px; color: #a1a1aa; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; }
            .field { border-bottom: 1px dashed #27272a; padding: 12px 0; display: flex; justify-content: space-between; font-size: 13px; }
            .label { color: #71717a; font-weight: 500; }
            .val { color: #f4f4f5; font-weight: 600; text-align: right; }
            .hash { font-family: monospace; font-size: 11px; color: #34d399; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #52525b; border-t: 1px solid #27272a; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="badge">PassIMG Cryptographic Certificate</div>
            <h1>${img.title}</h1>
            <h2>Digital Integrity & Ownership Registry</h2>
            <div class="field"><div class="label">Certificate ID / Registration ID</div><div class="val" style="color: #2dd4bf; font-family: monospace; font-weight: bold;">${img.id}</div></div>
            <div class="field"><div class="label">Author / Creator Name</div><div class="val">${img.creatorName}</div></div>
            <div class="field"><div class="label">Cryptographic Hash (SHA-256)</div><div class="val hash">${img.hash}</div></div>
            <div class="field"><div class="label">Certified Registration Date</div><div class="val">${new Date(img.registeredAt).toLocaleString()}</div></div>
            <div class="field"><div class="label">Asset Dimensions</div><div class="val font-mono">${img.dimensions}</div></div>
            <div class="field"><div class="label">Platform Integrity Standard</div><div class="val">W3C Authenticity & SHA Ledger</div></div>
            <div class="footer">This document certifies that the aforementioned graphic asset was loaded, processed, and cryptographically signed on PassIMG Lite. Any pixel manipulation, color grading modification, or EXIF injection will void future verification checkmarks.</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="gallery-component">
      
      {/* Search and Filters panel */}
      <div className="glass p-4 space-y-4 shadow-sm" id="gallery-controls">
        <div className="flex flex-col gap-3 md:flex-row">
          
          {/* Query Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="gal-search-query"
              placeholder="Search images by Title, Registration ID, Tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-xs text-white glass-input focus:outline-none transition-all"
              style={{ padding: '0.75rem 2.5rem' }}
            />
          </div>

          {/* Quick Filters Group */}
          <div className="flex overflow-x-auto space-x-1 border border-white/10 rounded-xl p-1 bg-slate-950/40">
            {[
              { id: 'all', name: 'All Images' },
              { id: 'verified', name: 'Verified' },
              { id: 'marketplace', name: 'Listed On Sale' },
              { id: 'recent', name: 'Recently Added' }
            ].map(f => (
              <button
                key={f.id}
                id={`gal-filter-${f.id}`}
                onClick={() => setActiveFilter(f.id as any)}
                className={`whitespace-nowrap px-3.5 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === f.id ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty States */}
      {sortedImages.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center glass p-6 text-center text-slate-400">
          <HelpCircle className="h-10 w-10 text-slate-400 opacity-40 mb-2" />
          <p className="text-xs font-semibold text-white">No assets found inside your Gallery and filters</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs block leading-relaxed">
             You haven't registered any files with that description.
          </p>
        </div>
      )}

      {/* GRID LAYOUT CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="gallery-vault-grid">
        {sortedImages.map((img) => (
          <div 
            key={img.id}
            id={`gal-card-${img.id}`}
            className="flex flex-col overflow-hidden glass hover:border-indigo-500/30 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] group"
          >
            {/* Thumbnail Header with Status badges */}
            <div className="relative h-44 w-full bg-slate-950/40 overflow-hidden">
              <img 
                src={img.imageUrl} 
                alt="" 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 left-2.5 flex flex-col space-y-1">
                <span className="rounded bg-indigo-500 text-white px-2 py-1 font-sans justify-center text-[9px] font-bold tracking-tight shadow flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                  <span>Verified Original</span>
                </span>
                
                {img.isForSale ? (
                  <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-1 font-sans justify-center text-[9px] font-bold tracking-tight border border-indigo-500/20 flex items-center space-x-1 backdrop-blur-md">
                    <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Listed: {formatCurrency(img.price)}</span>
                  </span>
                ) : (
                  <span className="rounded bg-slate-950/80 text-slate-400 px-2 py-1 font-sans justify-center text-[9px] font-bold tracking-tight border border-white/10 flex items-center space-x-1 backdrop-blur-md">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Private Gallery</span>
                  </span>
                )}
              </div>
              <div className="absolute bottom-2 right-2 rounded bg-slate-950/80 px-2 py-0.5 font-mono text-[9px] text-slate-400 border border-white/5 backdrop-blur-md">
                {img.dimensions}
              </div>
            </div>

            {/* Core Card Details */}
            <div className="flex-1 p-4 flex flex-col justify-between space-y-3 text-left">
              <div>
                <p className="font-mono text-[9px] text-indigo-400 font-bold tracking-wider uppercase mb-0.5">{img.id}</p>
                <h4 className="font-sans text-sm font-semibold text-white truncate">{img.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 font-sans line-clamp-2 leading-relaxed">
                  {img.description}
                </p>
              </div>

              {/* Tag representations inside card margins */}
              <div className="flex flex-wrap gap-1">
                {img.tags.slice(0, 3).map((t, idx) => (
                  <span key={idx} className="rounded bg-white/5 border border-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-400 font-medium">#{t}</span>
                ))}
              </div>

              <div className="border-t border-white/10 pt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-450 text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-slate-400 opacity-60" />
                  <span>{formatDate(img.registeredAt).split(',')[0]}</span>
                </div>
                <div className="text-right">
                  <span>Size: {formatBytes(img.originalSize)}</span>
                </div>
              </div>
            </div>

            {/* Interactivity actions bar footer */}
            <div className="bg-white/5 p-2 border-t border-white/10 flex space-x-1">
              <button
                id={`gal-btn-view-${img.id}`}
                onClick={() => setSelectedImageDetails(img)}
                title="View Full Ledger Data"
                className="flex-1 rounded-lg py-1.5 text-center text-xs text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center space-x-0.5 border border-white/10 transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 mr-1 text-slate-400" />
                <span>Specs</span>
              </button>

              <button
                id={`gal-btn-edit-${img.id}`}
                onClick={() => openEditDialog(img)}
                title="Edit Core Metadata"
                className="rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>

              <button
                id={`gal-btn-list-${img.id}`}
                onClick={() => openListingDialog(img)}
                title="List On Marketplace"
                className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors cursor-pointer ${
                  img.isForSale ? 'bg-amber-500/10 text-amber-450 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>

              <button
                id={`gal-btn-delete-${img.id}`}
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete this digital crypt registration? Note: Alteration is permanent and voids registered digital certificates.")) {
                    onDeleteImage(img.id);
                  }
                }}
                className="rounded px-2.5 py-1.5 text-[11px] text-zinc-500 hover:text-rose-400 hover:bg-rose-950/15 border border-zinc-850"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW DETAILS DIALOG DRAWER */}
      {selectedImageDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" id="vault-specs-sheet">
          <div className="w-full max-w-xl rounded-2xl glass overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="bg-slate-950/45 px-6 py-4 border-b border-white/10 flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-mono tracking-wider text-indigo-400 font-bold">{selectedImageDetails.id}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{selectedImageDetails.title} Specifications</h3>
              </div>
              <button onClick={() => setSelectedImageDetails(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer font-mono text-sm">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Asset large Preview */}
              <img src={selectedImageDetails.imageUrl} alt="" className="w-full h-44 object-contain rounded-xl bg-slate-950/60 border border-white/5" referrerPolicy="no-referrer" />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-3 text-left">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Author Statement</span>
                    <p className="text-slate-300 font-sans mt-0.5 leading-normal">{selectedImageDetails.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Category</span>
                    <p className="text-white font-sans mt-0.5 font-semibold">{selectedImageDetails.category}</p>
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-950/45 p-4 rounded-xl border border-white/5 text-left">
                  <p className="text-[10px] uppercase font-bold tracking-wide text-indigo-400">Cryptographic Metadata</p>
                  
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-medium">SHA-256 Ledger Signature:</span>
                    <p className="font-mono text-[10px] text-emerald-400 break-all select-all mt-0.5">{selectedImageDetails.hash}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>
                      <span>Density Dimensions:</span>
                      <p className="text-white mt-0.5 font-medium">{selectedImageDetails.dimensions}</p>
                    </div>
                    <div>
                      <span>Compressed Size:</span>
                      <p className="text-white mt-0.5 font-medium">{formatBytes(selectedImageDetails.originalSize)}</p>
                    </div>
                    <div>
                      <span>Platform popularity:</span>
                      <p className="text-white mt-0.5 font-medium">{selectedImageDetails.popularityScore} pts / {selectedImageDetails.verificationCount} Audits</p>
                    </div>
                    <div>
                      <span>Sales count:</span>
                      <p className="text-white mt-0.5 font-medium">{selectedImageDetails.salesCount} Licenses</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 border-t border-white/10 pt-4">
                <button
                  onClick={() => {
                    handleDownloadCertificate(selectedImageDetails);
                    setSelectedImageDetails(null);
                  }}
                  className="w-1/2 rounded-lg bg-indigo-500 py-2.5 font-bold text-white text-xs hover:bg-indigo-600 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                >
                  <Download className="h-4 w-4" />
                  <span>Obtain Cert Proof</span>
                </button>

                {onNavigateToVerify && (
                  <button
                    onClick={() => {
                      onNavigateToVerify(selectedImageDetails);
                      setSelectedImageDetails(null);
                    }}
                    className="w-1/2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 py-2.5 font-bold text-xs hover:bg-indigo-500/20 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Run Match Verify</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METADATA EDIT DIALOG */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" id="gal-edit-dialog">
          <form onSubmit={handleEditSubmit} className="w-full max-w-sm rounded-2xl glass p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider text-left border-b border-white/10 pb-2">Modify Platform Metadata</h3>
            
            <div className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Asset Copyright Term Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold">Author Description Statement</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold">Ledger Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 font-semibold cursor-pointer"
                >
                  <option value="Photography">Photography</option>
                  <option value="Journalism">Journalism</option>
                  <option value="Illustration">Illustration</option>
                  <option value="Digital Art">Digital Art</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold">Asset Tags (Separated by commas)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}      {/* LIST FOR SALE SETTINGS DIALOG */}
      {listingForSaleImage && (() => {
        const hasValidVerification = verificationEvents.some(
          (ev) => ev.imageId === listingForSaleImage.id && ev.status === 'verified'
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" id="gal-listing-dialog">
            <form onSubmit={handleListingSubmit} className="w-full max-w-sm rounded-2xl glass p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider text-left border-b border-white/10 pb-2">Marketplace Licensing</h3>
              
              {!hasValidVerification ? (
                <div className="space-y-4 text-left">
                  <div className="bg-rose-950/30 border border-rose-500/10 p-3 rounded-xl space-y-2 text-xs text-rose-400">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="text-sm">⚠️</span> Listing Blocked
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Under PassIMG security protocol guidelines, only images with a valid, successful cryptographic verification record on the ledger can be offered on the public marketplace.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      This image does not currently possess a successful match verification record.
                    </p>
                  </div>

                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Please visit the **Verify Image** workspace first and run a successful verification check to unlock marketplace listing permissions.
                  </p>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setListingForSaleImage(null)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    
                    {onNavigateToVerify && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToVerify(listingForSaleImage);
                          setListingForSaleImage(null);
                        }}
                        className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer text-center uppercase tracking-wider"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed text-left">
                    Authorize world licenses. Anyone possessing PassIMG wallets will buy this authenticated rights file instantly.
                  </p>

                  <div className="space-y-4 text-left font-sans">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold">Setup License Type</label>
                      <select
                        value={listLicenseType}
                        onChange={(e: any) => setListLicenseType(e.target.value)}
                        className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white focus:border-indigo-400 font-semibold cursor-pointer"
                      >
                        <option value="Commercial">Commercial (High Clearance advertising rights)</option>
                        <option value="Editorial">Editorial (Journalism publications prints)</option>
                        <option value="Personal">Personal (Wallpapers, Private Displays only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold">License Valuation Price ($)</label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={listPrice}
                        onChange={(e) => setListPrice(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1.5 w-full glass-input px-3 py-2 text-xs text-white font-mono focus:border-indigo-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5 italic font-sans leading-normal">Deducted on buyers and transferred to you upon verification checks.</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setListingForSaleImage(null)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    
                    {listingForSaleImage.isForSale && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDeListImage(listingForSaleImage);
                          setListingForSaleImage(null);
                        }}
                        className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      >
                        Pause Listing
                      </button>
                    )}

                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                    >
                      Publish Rights
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        );
      })()}
    </div>
  );
}
