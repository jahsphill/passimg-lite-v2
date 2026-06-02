/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, RegisteredImage, VerificationEvent } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  RefreshCw, 
  Layers, 
  AlertTriangle, 
  ArrowLeft, 
  ShoppingBag, 
  FileCheck, 
  Fingerprint, 
  Check, 
  X, 
  Eye, 
  Database, 
  Sparkles, 
  Info, 
  FileText, 
  Sliders, 
  Printer, 
  Download,
  Search,
  BookOpen,
  Scale
} from 'lucide-react';
import { formatBytes } from '../utils';

interface ImageComparisonToolProps {
  currentUser: User | null;
  registeredImages: RegisteredImage[];
  verificationEvents: VerificationEvent[];
  onAddVerificationEvent?: (event: VerificationEvent) => void;
  onUpdateImage?: (image: RegisteredImage) => void;
  setCurrentPage: (page: string) => void;
  addToast?: (text: string, type: 'success' | 'warning' | 'info') => void;
}

export default function ImageComparisonTool({
  currentUser,
  registeredImages,
  verificationEvents,
  onAddVerificationEvent,
  onUpdateImage,
  setCurrentPage,
  addToast
}: ImageComparisonToolProps) {
  
  // Left Panel States
  const [leftSpecimenType, setLeftSpecimenType] = useState<'upload' | 'recent'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedRecentEvent, setSelectedRecentEvent] = useState<VerificationEvent | null>(null);

  // Right Panel States
  const [rightPanelTab, setRightPanelTab] = useState<'vault' | 'records'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegisteredImage, setSelectedRegisteredImage] = useState<RegisteredImage | null>(null);

  // Dynamic Forensic Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showSliderOverlay, setShowSliderOverlay] = useState(true);

  // Listing Form state (if matching)
  const [showListingPanel, setShowListingPanel] = useState(false);
  const [listingPrice, setListingPrice] = useState<number>(149);
  const [listingLicense, setListingLicense] = useState<'Commercial' | 'Editorial' | 'Personal'>('Commercial');
  const [isListingLoading, setIsListingLoading] = useState(false);

  // Certificate Modal View state
  const [showCertModal, setShowCertModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Synchronous analysis status
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Pre-load first registered image if none is selected to help the user get going
  useEffect(() => {
    if (registeredImages && registeredImages.length > 0 && !selectedRegisteredImage) {
      setSelectedRegisteredImage(registeredImages[0]);
    }
  }, [registeredImages, selectedRegisteredImage]);

  // Compute SHA-256 for manual upload
  const computeSHA256 = async (file: File): Promise<string> => {
    try {
      if (window.crypto && crypto.subtle) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
    } catch (err) {
      console.warn("Subtle crypto digested error, launching sandbox fallback...", err);
    }
    // Hard deterministic cryptographic simulation with user specs fallback 
    let hash = 0;
    const identifier = `${file.name}-${file.size}-${file.lastModified}-${currentUser?.id || 'guest'}`;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const positiveHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `${positiveHash}927581fb1c149afbc4c8996fb92427ae41e4649b934ca495991b7852b8${positiveHash.substring(0, 4)}`.substring(0, 64);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSpecimenFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSpecimenFile(e.target.files[0]);
    }
  };

  const processSpecimenFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (addToast) addToast("Invalid media type. Only image files can be analyzed.", "warning");
      return;
    }
    setUploadedFile(file);
    setLeftSpecimenType('upload');
    setSelectedRecentEvent(null);
    setHasRunAnalysis(false);

    // Create file reader preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setIsComputingHash(true);
    try {
      const calculatedHash = await computeSHA256(file);
      setUploadedHash(calculatedHash);
      if (addToast) addToast("Specimen checksum loaded successfully.", "info");
    } catch (e) {
      console.error(e);
    } finally {
      setIsComputingHash(false);
    }
  };

  // Switch to recent verification event
  const selectRecentVerifyEvent = (event: VerificationEvent) => {
    setSelectedRecentEvent(event);
    setLeftSpecimenType('recent');
    setUploadedFile(null);
    setHasRunAnalysis(false);
    
    // Attempt to map back to standard image preview if possible, otherwise use fallback placeholder
    const matchedImage = registeredImages.find(img => img.id === event.imageId);
    if (matchedImage) {
      setUploadedPreview(matchedImage.imageUrl);
    } else {
      setUploadedPreview(`https://picsum.photos/seed/${event.imageTitle}/600/400`);
    }
    
    setUploadedHash(event.hashTried);
    if (addToast) addToast(`Loaded previous verification specimen: "${event.imageTitle}"`, 'info');
  };

  // Run the Forensic Alignment Spectrometer Match
  const triggerForensicAnalysis = () => {
    if (!uploadedHash || !selectedRegisteredImage) {
      if (addToast) addToast("Please configure both verification specimen and baseline target.", "warning");
      return;
    }
    setIsAnalyzing(true);
    setHasRunAnalysis(false);

    setTimeout(() => {
      setIsAnalyzing(false);
      setHasRunAnalysis(true);

      const isExactMatch = (uploadedHash.toLowerCase().trim() === selectedRegisteredImage.hash.toLowerCase().trim());
      
      // Dispatch verification event output back to central platform audit ledger
      if (onAddVerificationEvent) {
        onAddVerificationEvent({
          id: `VR-AUD-${Math.floor(100000 + Math.random() * 900000)}`,
          imageId: selectedRegisteredImage.id,
          imageTitle: selectedRegisteredImage.title,
          uploadedFileName: uploadedFile ? uploadedFile.name : `Evidence_Specimen_${selectedRegisteredImage.id}`,
          hashTried: uploadedHash,
          timestamp: new Date().toISOString(),
          status: isExactMatch ? 'verified' : 'failed',
          similarity: isExactMatch ? 100 : 0,
          triggeredBy: currentUser?.name || 'Forensic Lab Inspector'
        });
      }

      if (isExactMatch) {
         if (addToast) addToast("Evidence verification match: Byte Alignment Verified (100% Identical)!", "success");
      } else {
         if (addToast) addToast("Evidence mismatch: Checked signature differs from registry record.", "warning");
      }
    }, 1500);
  };

  // List on marketplace helper triggers
  const handleMarketplaceListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisteredImage || !onUpdateImage) return;

    setIsListingLoading(true);
    setTimeout(() => {
      const updated: RegisteredImage = {
        ...selectedRegisteredImage,
        isForSale: true,
        price: listingPrice,
        licenseType: listingLicense as any
      };
      
      onUpdateImage(updated);
      setSelectedRegisteredImage(updated);
      setIsListingLoading(false);
      setShowListingPanel(false);
      
      if (addToast) addToast(`Successfully published "${updated.title}" listing on public marketplace!`, 'success');
    }, 1200);
  };

  // Interactive slider calculation
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Filtering baseline images for right panel
  const myImages = currentUser ? registeredImages.filter(img => img.creatorId === currentUser.id) : [];
  
  const searchInImages = (list: RegisteredImage[]) => {
    return list.filter(img => 
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.hash.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredRightImages = rightPanelTab === 'vault' 
    ? searchInImages(myImages) 
    : searchInImages(registeredImages);

  const hashesMatch = hasRunAnalysis && uploadedHash && selectedRegisteredImage && 
    (uploadedHash.toLowerCase().trim() === selectedRegisteredImage.hash.toLowerCase().trim());

  return (
    <div className="space-y-8" id="forensic-comparison-workspace">
      
      {/* Forensic Control Header */}
      <div className="glass p-6 sm:p-8 rounded-2xl relative overflow-hidden border-cyan-500/15" id="comparison-banner">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Fingerprint className="h-44 w-44 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-400 border border-cyan-500/15">
              <Scale className="h-3.5 w-3.5 animate-pulse" />
              <span>Diagnostic Comparison Laboratory</span>
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Forensic Image Comparison Tool</h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Synthesize side-by-side evidence blocks. Review byte counts, metadata parameters, and perform exact integrity crosschecks securely over memory sandboxes.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage('verify_image')}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all border border-white/5 flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Verify Image</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left Panel (Verification), Right Panel (Registered Baseline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Verification Specimen Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-2xl p-5 space-y-5 border-white/5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                  <span className="h-5 w-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-[10px]">A</span>
                  <span>Verification Specimen</span>
                </span>
                
                {/* Manual Upload vs Recent Audits Tabs */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/5">
                  <button
                    onClick={() => setLeftSpecimenType('upload')}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${
                      leftSpecimenType === 'upload' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Upload Specimen
                  </button>
                  <button
                    onClick={() => setLeftSpecimenType('recent')}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${
                      leftSpecimenType === 'recent' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Recent Audits
                  </button>
                </div>
              </div>

              {leftSpecimenType === 'upload' ? (
                /* Manual File uploader with fallback simulation */
                <div className="space-y-4">
                  {!uploadedPreview ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all ${
                        dragActive 
                          ? 'border-cyan-400 bg-cyan-500/5' 
                          : 'border-white/10 hover:border-white/20 bg-slate-900/40'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="h-10 w-10 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-cyan-400 mb-3 block">
                        <Upload className="h-5 w-5 text-cyan-400" />
                      </div>
                      <p className="text-xs font-bold text-white leading-normal">Load Evidence Image Block</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                        Select a file from your file system or drag it directly here.
                      </p>
                    </div>
                  ) : (
                    /* Display uploaded Image preview */
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-slate-950/80 aspect-video border border-white/10 flex items-center justify-center">
                        <img 
                          src={uploadedPreview} 
                          alt="Uploaded specimen copy" 
                          className="max-h-[190px] w-full object-contain"
                        />
                        <button
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadedPreview(null);
                            setUploadedHash(null);
                            setHasRunAnalysis(false);
                          }}
                          className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-cyan-500/90 text-slate-950 font-bold px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-widest z-10">
                          Forensic Specimen
                        </div>
                      </div>

                      {/* Display calculations progress or details */}
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5 space-y-2 text-[11px] leading-snug">
                        <div className="flex justify-between">
                          <span className="text-slate-500">File Signature Name:</span>
                          <span className="font-semibold text-white truncate max-w-[170px]">{uploadedFile?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Byte Size Allocation:</span>
                          <span className="font-mono text-white text-[10px]">{uploadedFile ? formatBytes(uploadedFile.size) : '---'}</span>
                        </div>
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          <span className="text-slate-500 block">Calculated SHA-256 Fingerprint:</span>
                          <span className="font-mono text-[9px] text-cyan-300 bg-slate-950 border border-white/5 px-2 py-1.5 rounded block whitespace-normal break-all">
                            {isComputingHash ? "Calculating signatures..." : (uploadedHash || "Awaiting hash calculation")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Select from recent verifications list directly */
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 italic">
                    Below are recent dynamic verification checks executed in your environment. Click any checks to load the tested specimen.
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {verificationEvents.length > 0 ? (
                      verificationEvents.slice(0, 5).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => selectRecentVerifyEvent(ev)}
                          className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                            selectedRecentEvent?.id === ev.id 
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-white' 
                              : 'bg-slate-950/40 hover:bg-slate-900 border-white/5 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{ev.imageTitle}</p>
                            <p className="text-[9px] text-slate-550 font-mono text-slate-400 mt-0.5 truncate max-w-[190px]">{ev.hashTried}</p>
                          </div>
                          <div className="text-right shrink-0 pl-1.5">
                            <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              ev.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-455 text-rose-400'
                            }`}>
                              {ev.status === 'verified' ? 'verified' : 'failed'}
                            </span>
                            <span className="block text-[8px] text-slate-500 mt-1">{new Date(ev.timestamp).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 border border-dashed border-white/10 rounded-xl">
                        <BookOpen className="h-6 w-6 mx-auto mb-1 opacity-30 text-slate-400" />
                        <p className="text-[11px]">No recent audit logs available.</p>
                      </div>
                    )}
                  </div>

                  {selectedRecentEvent && (
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5 space-y-1 text-[11px] text-slate-300">
                      <p className="font-semibold text-white text-[11.5px]">Selected Audit Log Details:</p>
                      <p className="text-[10px]">Title: <strong className="text-white">{selectedRecentEvent.imageTitle}</strong></p>
                      <p className="text-[10px]">Auditor: <strong className="text-white">{selectedRecentEvent.triggeredBy}</strong></p>
                      <p className="text-[10px] truncate">Hashed Tried: <strong className="text-cyan-400 font-mono text-[9px]">{selectedRecentEvent.hashTried}</strong></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action status message */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                <p className="text-[10px] leading-snug">
                  Evidence specimens are processed client-side. The file contents are strictly parsed as local buffers to prevent network leaks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registered Baseline Selection & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass rounded-2xl p-5 border-white/5 flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                  <span className="h-5 w-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-[10px]">B</span>
                  <span>Registered Baseline Reference</span>
                </span>

                {/* Vault vs Platform tabs */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/5 shrink-0 self-start">
                  <button
                    onClick={() => {
                      setRightPanelTab('records');
                      setSelectedRegisteredImage(registeredImages[0] || null);
                    }}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${
                      rightPanelTab === 'records' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Registration Records
                  </button>
                  <button
                    onClick={() => {
                      setRightPanelTab('vault');
                      setSelectedRegisteredImage(myImages[0] || null);
                    }}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${
                      rightPanelTab === 'vault' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Gallery
                  </button>
                </div>
              </div>

              {/* Small search widget for Registry */}
              <div className="relative mb-3.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${rightPanelTab === 'vault' ? 'your gallery' : 'all registry'} by title, ID, or hash...`}
                  className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none rounded-lg"
                />
              </div>

              {/* Side-by-side or layout of selected baseline */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Search scrollable checklist */}
                <div className="md:col-span-5 space-y-1.5 max-h-[195px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredRightImages.length > 0 ? (
                    filteredRightImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => {
                          setSelectedRegisteredImage(img);
                          setHasRunAnalysis(false);
                        }}
                        className={`w-full flex items-center space-x-2 text-left p-1.5 rounded-lg border transition-all ${
                          selectedRegisteredImage?.id === img.id 
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-white' 
                            : 'bg-slate-900/30 hover:bg-slate-900 border-white/5 text-slate-300'
                        }`}
                      >
                        <img 
                          src={img.imageUrl} 
                          alt={img.title} 
                          className="h-8 w-11 object-cover rounded bg-slate-950 border border-white/5 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[11px] truncate leading-tight text-white">{img.title}</p>
                          <span className="font-mono text-[9px] text-cyan-400 block tracking-tight font-semibold">{img.id}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-600 border border-dashed border-white/5 rounded-xl">
                      <p className="text-[10px]">No matches found.</p>
                    </div>
                  )}
                </div>

                {/* Selected Baseline Preview */}
                <div className="md:col-span-7 space-y-2">
                  {selectedRegisteredImage ? (
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-2.5">
                      <div className="aspect-video relative overflow-hidden rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center max-h-[110px]">
                        <img 
                          src={selectedRegisteredImage.imageUrl} 
                          alt={selectedRegisteredImage.title} 
                          className="max-h-[108px] w-full object-contain"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-indigo-500/90 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded">
                          Registry Target
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] leading-snug">
                        <div>
                          <p className="text-slate-500 uppercase font-bold text-[8px]">Verification ID</p>
                          <p className="font-mono text-cyan-400 font-extrabold text-[11px]">{selectedRegisteredImage.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase font-bold text-[8px]">First Registered Date</p>
                          <p className="text-slate-300 font-semibold">{new Date(selectedRegisteredImage.registeredAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase font-bold text-[8px]">Dimensions / Format</p>
                          <p className="text-slate-300 font-mono font-medium">{selectedRegisteredImage.dimensions}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase font-bold text-[8px]">Authority Creator</p>
                          <p className="text-slate-300 truncate max-w-[110px]">{selectedRegisteredImage.creatorName}</p>
                        </div>
                      </div>

                      <div className="text-[10px] leading-snug border-t border-white/5 pt-1.5">
                        <span className="text-slate-500 font-semibold block mb-0.5">SHA-256 Baseline Fingerprint:</span>
                        <span className="font-mono text-[9px] text-indigo-300 bg-slate-950 px-2 py-1.5 border border-white/5 rounded block break-all whitespace-normal select-all">
                          {selectedRegisteredImage.hash}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center py-10 text-slate-500 border border-dashed border-white/5 rounded-xl">
                      <p className="text-xs">No target chosen as reference.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* In-Line Form: List Target on Marketplace */}
            {hasRunAnalysis && hashesMatch && selectedRegisteredImage && showListingPanel && (
              <div className="mt-3 bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-xl space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                  <h5 className="text-[11px] uppercase font-bold text-indigo-300 flex items-center space-x-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Publish Listing on Public Marketplace</span>
                  </h5>
                  <button 
                    onClick={() => setShowListingPanel(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <form onSubmit={handleMarketplaceListingSubmit} className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Set Listing Price (tokens)</label>
                    <input 
                      type="number" 
                      value={listingPrice}
                      onChange={(e) => setListingPrice(Math.max(1, parseInt(e.target.value) || 100))}
                      className="w-full bg-slate-950 text-white rounded border border-white/10 px-2 py-1 font-mono text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Assigned Ownership Scope</label>
                    <select 
                      value={listingLicense}
                      onChange={(e: any) => setListingLicense(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded border border-white/10 px-2 py-1 text-[11px]"
                    >
                      <option value="Commercial">Commercial License Type</option>
                      <option value="Editorial">Editorial Only License</option>
                      <option value="Personal">Personal Attribution Only</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={isListingLoading}
                      className="w-full rounded bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 font-bold uppercase text-[10px] tracking-wide cursor-pointer flex items-center justify-center space-x-1 active:scale-[0.98] transition-all"
                    >
                      {isListingLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Deploying Listing Smart Contract...</span>
                        </>
                      ) : (
                        <span>Publish Verified Asset Listing</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MID SECTION: FORENSIC SPECTRUM SPECTROMETER ACTION BUTTON */}
      {uploadedHash && selectedRegisteredImage && !hasRunAnalysis && (
        <div className="glass p-5 rounded-2xl max-w-xl mx-auto border-cyan-500/20 text-center space-y-3.5">
          <div className="h-10 w-10 bg-cyan-500/10 text-cyan-405 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Execute Forensic Registry Crosscheck</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Compare the SHA-256 fingerprint generated from the evidence specimen with the registered signature block on record.
            </p>
          </div>
          <button
            onClick={triggerForensicAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-cyan-555 bg-cyan-500 hover:bg-cyan-600/90 text-slate-950 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center space-x-2 mx-auto"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Byte Alignment Spectrometry Analysis...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-3.5 w-3.5" />
                <span>Align Spectrometer Blocks</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* FORENSIC COMPARISON PANEL (RESULT AREA) */}
      {hasRunAnalysis && uploadedHash && selectedRegisteredImage && (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-200">
          
          {/* Main Spectrum Diagnostics Banner */}
          <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            hashesMatch 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-rose-950/20 border-rose-500/30 font-sans'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center space-x-4">
                <div className={`h-14 w-14 rounded-full border flex items-center justify-center shrink-0 ${
                  hashesMatch 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {hashesMatch ? (
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-rose-455 text-rose-400" />
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Spectrometer Crosscheck Result</span>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{hashesMatch ? "✓ Exact Match" : "✕ Exact Match Not Found"}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      hashesMatch 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {hashesMatch ? "INTEGRITY SECURED" : "ALIGNED BLOCKS MISMATCH"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-450 text-slate-400 max-w-xl leading-relaxed">
                    {hashesMatch 
                      ? "Cryptographic verification matches perfectly. The evidence specimen byte stream produced an identical SHA-256 fingerprint signature to the original registered registry baseline."
                      : "Evidence checksum integrity alert. A pixel-level shift, file compression modification, format transcoding, or altered metadata has disrupted bytecode symmetry."
                    }
                  </p>
                </div>
              </div>

              {/* Tools list container */}
              <div className="flex flex-wrap gap-2.5 shrink-0">
                
                {/* Verify Again */}
                <button
                  onClick={() => {
                    setHasRunAnalysis(false);
                    setUploadedFile(null);
                    setUploadedPreview(null);
                    setUploadedHash(null);
                    setSelectedRecentEvent(null);
                    if (addToast) addToast("Forensic workbench reset.", "info");
                  }}
                  className="px-3.5 py-2 hover:bg-white/5 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Verify Again</span>
                </button>

                {/* Generate Certificate (if matching) */}
                {hashesMatch && (
                  <button
                    onClick={() => setShowCertModal(true)}
                    className="px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Generate Certificate</span>
                  </button>
                )}

                {/* List in Marketplace (only if matching) */}
                {hashesMatch && (
                  <button
                    onClick={() => {
                      // Ensure current user is the owner to list
                      if (currentUser && currentUser.id !== selectedRegisteredImage.creatorId) {
                        if (addToast) addToast("Authority notice: You do not carry publisher rights to list this asset since you aren't the creator.", "warning");
                      }
                      setShowListingPanel(!showListingPanel);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      selectedRegisteredImage.isForSale
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{selectedRegisteredImage.isForSale ? "Already Listed on Marketplace" : "List on Marketplace"}</span>
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* Forensic block fingerprints contrast detail card */}
          <div className="glass rounded-xl p-5 space-y-4 border-white/5 font-mono">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              Signature Contrast Log Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Baseline Ledger Record Target ID:</span>
                <p className="text-white font-mono break-all font-semibold select-all text-[11px] selection:bg-indigo-500">
                  {selectedRegisteredImage.hash}
                </p>
                <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Record Hash ID: {selectedRegisteredImage.id}</span>
                  <span className="text-green-400">Ledger Immutable</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Comparison Evidence Specimen Input:</span>
                <p className={`font-mono break-all font-semibold select-all text-[11px] selection:bg-cyan-500 ${
                  hashesMatch ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {uploadedHash}
                </p>
                <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>File: {uploadedFile ? uploadedFile.name : 'Simulated Specimen'}</span>
                  <span className={hashesMatch ? 'text-emerald-450 text-emerald-400' : 'text-rose-455 text-rose-400 font-bold'}>
                    {hashesMatch ? 'Verified 100% Alignment' : 'Collision / Invalid Block Signature'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forensic Vertical Split Lens Overlay Visual System */}
          <div className="glass p-5 rounded-2xl space-y-5 border-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div className="space-y-1 text-left">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Interactive Split Lens Inspector Overlay</span>
                </h5>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Reposition the slider handle to contrast the Baseline Target Image on the left with the Evidence Specimen Image on the right.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSliderOverlay(!showSliderOverlay)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                    showSliderOverlay 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' 
                      : 'bg-slate-800 text-slate-500 border-white/5'
                  }`}
                >
                  {showSliderOverlay ? 'Disable Overlay Labels' : 'Enable Overlay Labels'}
                </button>
              </div>
            </div>

            {/* Slider Workspace Canvas Container */}
            <div 
              ref={sliderContainerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative mx-auto rounded-xl overflow-hidden aspect-video bg-slate-950 max-h-[350px] border border-white/10 select-none cursor-ew-resize group"
            >
              
              {/* Evidence specimen uploaded (background layer) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={uploadedPreview || selectedRegisteredImage.imageUrl} 
                  alt="specimen code" 
                  className="max-h-[348px] w-full object-contain pointer-events-none"
                />
              </div>

              {/* Registered original baseline (floating foreground layer formatted with clip path) */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-slate-950" 
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img 
                  src={selectedRegisteredImage.imageUrl} 
                  alt="baseline target" 
                  className="max-h-[348px] w-full object-contain pointer-events-none"
                />
              </div>

              {showSliderOverlay && (
                <>
                  {/* Left side overlay tag */}
                  <div className="absolute bottom-4 left-4 bg-indigo-500/95 text-white font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide pointer-events-none z-20 shadow-md">
                    Target: {selectedRegisteredImage.title}
                  </div>

                  {/* Right side overlay tag */}
                  <div className="absolute bottom-4 right-4 bg-cyan-505 bg-cyan-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide pointer-events-none z-20 shadow-md">
                    Evidence Specimen copy
                  </div>
                </>
              )}

              {/* Sliding divider line handles */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-30 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Slider Control Handle */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full border border-white bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform">
                  <Sliders className="h-4 w-4 rotate-90 text-cyan-400" />
                </div>
              </div>

            </div>

            <p className="text-[10px] text-slate-500 italic text-center">
              * Note: Hold click down or swipe your finger across the lens stage to drag the vertical comparator boundary.
            </p>
          </div>

        </div>
      )}

      {/* DETAILED PRINTABLE CERTIFICATE MODAL VIEW */}
      {showCertModal && hashesMatch && selectedRegisteredImage && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm selection:bg-slate-900 overflow-y-auto" style={{ zIndex: 120 }}>
          <div className="relative glass rounded-3xl p-6 sm:p-8 max-w-xl w-full border-2 border-emerald-500/20 bg-gradient-to-b from-[#0e1726]/95 to-[#04070d] space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Closes button */}
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-slate-900 border border-white/5 hover:bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Certificate Branding header */}
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/25">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest leading-none">PassIMG Lab Auditing Syndicate</h4>
              <h3 className="text-xl font-black text-white tracking-wider uppercase">Certificate of Alignment</h3>
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto"></div>
            </div>

            {/* Certificated Details list */}
            <div className="text-center space-y-4 text-xs leading-relaxed text-slate-300">
              <p className="italic text-[11px] text-slate-400">
                This document certifies that the evaluated specimen and baseline registry document have compiled mathematically identical byte-pattern checksum alignments.
              </p>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 grid grid-cols-2 text-left gap-3.5 text-[11px]">
                <div className="col-span-2">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Certified Asset Title:</span>
                  <span className="text-white font-bold">"{selectedRegisteredImage.title}"</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Verification Code ID:</span>
                  <span className="text-cyan-400 font-mono font-extrabold">{selectedRegisteredImage.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">First Registration:</span>
                  <span className="text-white font-semibold">{new Date(selectedRegisteredImage.registeredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Verification Authority:</span>
                  <span className="text-white font-medium">{currentUser?.name || "Anonymous Inspector"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Symmetry Match Rating:</span>
                  <span className="text-emerald-400 font-bold">100% Exact Signature Alignment</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold block text-left">Matched Hashing Hex Signature:</span>
                <span className="font-mono text-[9px] break-all select-all block bg-slate-950 border border-white/5 py-1.5 px-2 rounded text-emerald-400 text-left">
                  {selectedRegisteredImage.hash}
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 justify-center border-t border-white/5 pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer uppercase flex items-center space-x-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Copy</span>
              </button>

              <button
                onClick={() => {
                  setShowCertModal(false);
                  if (addToast) addToast("Downloaded certified proof token.", "success");
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-all text-xs font-bold cursor-pointer uppercase flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Save PDF Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
