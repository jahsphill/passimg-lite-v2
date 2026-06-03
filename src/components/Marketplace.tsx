/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RegisteredImage, User, SaleRecord, VerificationEvent } from '../types';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ShieldCheck, 
  Download, 
  Mail, 
  HelpCircle, 
  ShoppingBag, 
  Lock, 
  ExternalLink,
  Award,
  BookOpen,
  DollarSign,
  User as UserIcon,
  Tag,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate, generateTransactionId } from '../utils';

interface MarketplaceProps {
  currentUser: User | null;
  registeredImages: RegisteredImage[];
  verificationEvents?: VerificationEvent[];
  onBuyListing: (record: SaleRecord) => void;
  onTriggerAuth: () => void;
  onTriggerBalanceRefresh: (userId: string, quantity: number) => void;
  onAddSystemLog: (msg: string) => void;
}

export default function Marketplace({
  currentUser,
  registeredImages,
  verificationEvents = [],
  onBuyListing,
  onTriggerAuth,
  onTriggerBalanceRefresh,
  onAddSystemLog
}: MarketplaceProps) {
  // Query States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popularity'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(500);

  // Infinite scroll feed state (Load 8 listings initially)
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Active Interactive Modals
  const [selectedCreatorContact, setSelectedCreatorContact] = useState<{ name: string; email: string; bio: string; avatar: string } | null>(null);
  const [purchasedAssetSuccess, setPurchasedAssetSuccess] = useState<RegisteredImage | null>(null);
  const [boughtLicenseType, setBoughtLicenseType] = useState<string>('');

  // Reset feed limit back to 8 whenever filter or sortBy changes to start clean
  useEffect(() => {
    setVisibleCount(8);
  }, [searchQuery, selectedCategory, selectedLicenseFilter, sortBy, maxPrice]);

  // 1. Filter for registered images listed for sale that have completed registration and have a valid verification record
  const listedAssets = registeredImages.filter(img => {
    const hasVerification = verificationEvents.some(ev => ev.imageId === img.id && ev.status === 'verified');
    return img.isForSale && hasVerification;
  });

  // 2. Filter logic
  const filteredAssets = listedAssets.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          img.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          img.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || img.category === selectedCategory;
    const matchesLicense = selectedLicenseFilter === 'All' || img.licenseType === selectedLicenseFilter;
    const matchesPrice = img.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesLicense && matchesPrice;
  });

  // 3. Sort logic
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    }
    if (sortBy === 'price_low') {
      return a.price - b.price;
    }
    if (sortBy === 'price_high') {
      return b.price - a.price;
    }
    if (sortBy === 'popularity') {
      return b.popularityScore - a.popularityScore;
    }
    return 0;
  });

  // 4. Feed pagination limits (Appends on demand)
  const totalItems = sortedAssets.length;
  const paginatedAssets = sortedAssets.slice(0, visibleCount);

  // 5. Handle purchase licensing
  const handlePurchase = (img: RegisteredImage, chosenLicense: 'Commercial' | 'Editorial' | 'Personal') => {
    if (!currentUser) {
      onTriggerAuth();
      return;
    }

    if (img.creatorId === currentUser.id) {
      alert("You cannot purchase intellectual copyright licenses for assets you registered yourself.");
      return;
    }

    if (currentUser.balance < img.price) {
      alert(`Insufficient funds inside your PassIMG wallet. Remaining: ${formatCurrency(currentUser.balance)}. Listing cost is ${formatCurrency(img.price)}. Go to 'My Creator Profile' (top right avatar menu) to adjust your simulated sandbox wallet balance!`);
      return;
    }

    // Deduct buyer price
    onTriggerBalanceRefresh(currentUser.id, -img.price);
    // Add seller price
    onTriggerBalanceRefresh(img.creatorId, img.price);

    const txRecord: SaleRecord = {
      id: generateTransactionId(),
      imageId: img.id,
      imageTitle: img.title,
      price: img.price,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      sellerId: img.creatorId,
      timestamp: new Date().toISOString(),
      licenseType: chosenLicense
    };

    onBuyListing(txRecord);
    setBoughtLicenseType(chosenLicense);
    setPurchasedAssetSuccess(img);
    onAddSystemLog(`Intellectual License transfer logged! SOPHIA purchased ${chosenLicense} for ${img.title} for ${formatCurrency(img.price)}.`);
  };

  return (
    <div className="space-y-6" id="marketplace-view">
      {/* Search and Filters Strip */}
      <div className="glass p-4 space-y-4 shadow-sm animate-in fade-in duration-300" id="marketplace-filters-panel">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* Search Input bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="mkt-search-query"
              placeholder="Search certified assets by title, tags, creator name, or registration code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-xs text-white glass-input focus:outline-none transition-all"
              style={{ padding: '0.75rem 2.5rem' }}
            />
          </div>

          {/* Sorter Selector */}
          <div className="flex space-x-2">
            <select
              id="mkt-sort-by"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3.5 py-2 text-xs text-slate-200 glass-input focus:outline-none font-semibold cursor-pointer"
            >
              <option value="newest">Sort: Newest Registry</option>
              <option value="price_low">Sort: Price Low → High</option>
              <option value="price_high">Sort: Price High → Low</option>
              <option value="popularity">Sort: Popularity / Verifications</option>
            </select>

            <select
              id="mkt-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 text-xs text-slate-200 glass-input focus:outline-none font-semibold cursor-pointer"
            >
              <option value="All">Category: All</option>
              <option value="Photography">Photography</option>
              <option value="Journalism">Journalism</option>
              <option value="Illustration">Illustration</option>
              <option value="Digital Art">Digital Art</option>
              <option value="Design">Design</option>
            </select>
          </div>
        </div>

        {/* Sliders for Price boundary */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Max Wallet Price:</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{formatCurrency(maxPrice)}</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
              className="h-1.5 w-32 cursor-pointer appearance-none rounded-lg bg-slate-900 accent-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>Active Listings: <strong className="text-slate-200">{listedAssets.length}</strong></span>
            <span>•</span>
            <span>Matched Filter: <strong className="text-white">{sortedAssets.length}</strong></span>
            <span>•</span>
            <span>Showing: <strong className="text-indigo-400">{Math.min(visibleCount, totalItems)}</strong> of <strong className="text-indigo-400">{totalItems}</strong></span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedAssets.length === 0 && (
        <div className="flex h-56 flex-col items-center justify-center glass p-6 text-center text-slate-400 animate-in fade-in duration-300">
          <ShoppingBag className="h-10 w-10 text-slate-400 opacity-40 mb-2" />
          <p className="text-xs font-semibold text-white">No assets match your search coordinates</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
            Try adjusting filters, reducing category requirements, or register an original photo to list it globally.
          </p>
        </div>
      )}

      {/* SECURED CARDS GRID - DIVIDED INTO ROWS AND COLUMNS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="marketplace-grid-items">
        {paginatedAssets.map((img) => (
          <div 
            key={img.id}
            id={`mkt-item-${img.id}`}
            className="glass rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(99,102,241,0.18)] transition-all duration-300 group flex flex-col justify-between h-full border border-white/5 bg-slate-900/10 hover:bg-slate-900/25 animate-in fade-in duration-300"
          >
            {/* Top Module: Image preview and tags */}
            <div className="relative group overflow-hidden bg-slate-950/40 h-44 shrink-0" id={`card-img-wrap-${img.id}`}>
              <img 
                src={img.imageUrl} 
                alt="" 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 flex space-x-1.5 z-10">
                <span className="rounded bg-indigo-500/95 text-white px-2 py-0.5 font-sans text-[8px] font-bold tracking-wider shadow flex items-center space-x-1 uppercase">
                  <ShieldCheck className="h-3 w-3 text-white" />
                  <span>VERIFIED ORIGINAL</span>
                </span>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className="rounded-full bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20 shadow-md">
                  {formatCurrency(img.price)}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 z-10 flex flex-wrap gap-1 max-w-[85%]">
                <span className="rounded bg-indigo-950/80 backdrop-blur-sm text-indigo-300 text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-indigo-500/20">
                  {img.category}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 z-10 font-mono text-[8.5px] text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/5 shrink-0 select-none">
                {img.dimensions}
              </div>
            </div>

            {/* Middle Module: ID, Title, Creator, Description, and Licensing */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>REG: {img.id}</span>
                  <span className="max-w-[125px] truncate text-slate-400 font-sans font-medium" title={img.creatorName}>by {img.creatorName}</span>
                </div>
                <h4 className="font-sans text-xs sm:text-sm font-bold text-white tracking-wide truncate group-hover:text-indigo-400 transition-colors" title={img.title}>
                  {img.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed min-h-[32px]">
                  {img.description}
                </p>
              </div>

              {/* Compact Active License Block */}
              <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center space-x-1">
                    <Award className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span>License Agreement</span>
                  </span>
                  <span className="text-[8px] font-mono text-indigo-400 font-semibold border border-indigo-505/10 px-1 py-0.2 rounded bg-indigo-500/10">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-[10px]">{img.licenseType} Usage</span>
                  <span className="text-[8.5px] text-slate-500 font-mono">1 copy</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight font-sans">
                  {img.licenseType === 'Commercial' && 'Full advertising and retail redistribution clearance.'}
                  {img.licenseType === 'Editorial' && 'News outlet publishing permission. Content unaltered.'}
                  {img.licenseType === 'Personal' && 'Non-profit private display, wall background screens.'}
                </p>
              </div>

              {/* Bottom Action Section */}
              <div className="space-y-2 pt-2 border-t border-white/5 shrink-0">
                <button
                  id={`btn-buy-${img.id}`}
                  onClick={() => handlePurchase(img, img.licenseType === 'All' ? 'Commercial' : img.licenseType)}
                  className="w-full rounded-xl bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition-all flex items-center justify-center cursor-pointer select-none border-none outline-none"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                  <span>License Original ({img.licenseType})</span>
                </button>

                <button
                  id={`btn-contact-${img.id}`}
                  onClick={() => setSelectedCreatorContact({
                    name: img.creatorName,
                    email: `${img.creatorName.toLowerCase().replace(/\s+/g, '')}@passimg-certified.org`,
                    bio: `Specialized registered contributor in ${img.category}. Full portfolio verification files cleared.`,
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
                  })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none text-center font-bold"
                >
                  Contact Creator
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SEE MORE / LOAD MORE STREAM FEED CONTROLS */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in fade-in duration-300" id="marketplace-infinity-feed">
        {totalItems > paginatedAssets.length ? (
          <button
            id="mkt-see-more-btn"
            disabled={isLoadingMore}
            onClick={() => {
              setIsLoadingMore(true);
              // Simulated cryptographic ledger retrieval delay
              setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 8, totalItems));
                setIsLoadingMore(false);
                onAddSystemLog(`Fetched next batch of verified original image listings. Viewport extended.`);
              }, 600);
            }}
            className="flex items-center space-x-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-slate-905 bg-indigo-505/10 px-8 py-3.5 text-xs font-bold text-indigo-400 hover:text-white hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-md select-none disabled:opacity-50 disabled:cursor-not-allowed border-dashed"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>See More Listings ({totalItems - paginatedAssets.length} remaining)</span>
              </>
            )}
          </button>
        ) : (
          totalItems > 0 && (
            <div className="rounded-xl border border-white/5 bg-slate-950/25 px-6 py-3 text-center text-slate-500 text-xs font-medium tracking-wide">
              Showing all <span className="text-white font-bold">{totalItems}</span> matching listings • No more listings
            </div>
          )
        )}
      </div>

      {/* Creator Contact Form Modal */}
      {selectedCreatorContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl glass p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-left">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Creator Contact Form</h3>
              <button onClick={() => setSelectedCreatorContact(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-mono">✕</button>
            </div>
            
            <div className="flex items-center space-x-3.5">
              <img src={selectedCreatorContact.avatar} className="h-12 w-12 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
              <div>
                <p className="text-xs font-bold text-white">{selectedCreatorContact.name}</p>
                <p className="text-[10.5px] text-indigo-400 font-mono font-semibold">{selectedCreatorContact.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-normal font-sans bg-slate-950/40 p-3 rounded-xl border border-white/5">
              {selectedCreatorContact.bio}
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interactive Inquiry Message</label>
              <textarea 
                rows={3}
                placeholder="Write message to negotiate secondary rights, custom works, or alternate layouts..."
                className="w-full glass-input p-3 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <button 
              onClick={() => {
                alert("Intellectual rights negotiation transmission simulated successfully!");
                setSelectedCreatorContact(null);
              }}
              className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              Dispatch Encrypted Telegram
            </button>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {purchasedAssetSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" id="purchase-success-view">
          <div className="w-full max-w-md rounded-2xl glass p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-left">
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 mb-2">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Licensing Completed Successfully</h3>
              <p className="text-xs text-slate-400">License transferred and recorded on immutable record</p>
            </div>

            <div className="bg-slate-950/45 p-4 rounded-xl border border-white/5 space-y-2.5">
              <div className="flex justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-slate-400">Asset Title:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{purchasedAssetSuccess.title}</span>
              </div>
              <div className="flex justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-slate-400">License Acquired:</span>
                <span className="font-semibold text-indigo-400">{boughtLicenseType} License</span>
              </div>
              <div className="flex justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-slate-400">Debit Amount:</span>
                <span className="font-mono text-white font-bold">{formatCurrency(purchasedAssetSuccess.price)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Registered Cryptographic Hash:</span>
                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[150px]" title={purchasedAssetSuccess.hash}>{purchasedAssetSuccess.hash}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setPurchasedAssetSuccess(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Continue Exploring
              </button>
              <button
                onClick={() => {
                  setPurchasedAssetSuccess(null);
                  const filename = `${purchasedAssetSuccess.title.toLowerCase().replace(/\s+/g, '-')}-original.jpg`;
                  alert(`Downloading original high-resolution master file in background: ${filename}\nCopyright metadata was appended directly to JPEG binary block.`);
                }}
                className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Save Master File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
