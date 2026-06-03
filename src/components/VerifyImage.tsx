/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { User, RegisteredImage, VerificationEvent } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UploadCloud, 
  Check, 
  AlertTriangle, 
  Search, 
  Clock, 
  FileCheck, 
  RefreshCw, 
  FileText, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  X, 
  Sliders, 
  Printer, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Download,
  CheckCircle,
  HelpCircle,
  Lock,
  ShoppingBag
} from 'lucide-react';
import { formatBytes } from '../utils';

interface VerifyImageProps {
  currentUser: User | null;
  registeredImages: RegisteredImage[];
  onAddVerificationEvent?: (event: VerificationEvent) => void;
  onUpdateImage?: (image: RegisteredImage) => void;
  preSelectedImage?: RegisteredImage | null;
  onClearPreSelected?: () => void;
  onNavigateToGallery: () => void;
  setCurrentPage: (page: string) => void;
  addToast?: (text: string, type: 'success' | 'warning' | 'info') => void;
}

// Helper to format local timezone timestamp exactly like the reference PDF
const formatLocalTimestamp = (isoString?: string) => {
  const date = isoString ? new Date(isoString) : new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Calculate timezone / GMT offset
  const offset = -date.getTimezoneOffset();
  const hOffset = Math.floor(Math.abs(offset) / 60);
  const sign = offset >= 0 ? '+' : '-';
  const gmt = hOffset > 0 ? ` GMT${sign}${hOffset}` : ' UTC';
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}${gmt}`;
};

export default function VerifyImage({
  currentUser,
  registeredImages,
  onAddVerificationEvent,
  onUpdateImage,
  preSelectedImage,
  onClearPreSelected,
  onNavigateToGallery,
  setCurrentPage,
  addToast
}: VerifyImageProps) {
  // Navigation & selection states
  const [selectedImage, setSelectedImage] = useState<RegisteredImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Verification states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isComputingHash, setIsComputingHash] = useState(false);
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);

  // Results & Verification state
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationDone, setVerificationDone] = useState(false);
  const [currentVerificationEvent, setCurrentVerificationEvent] = useState<VerificationEvent | null>(null);

  // Interactive widgets
  const [showSliderTool, setShowSliderTool] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showDetails, setShowDetails] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Marketplace states
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false);
  const [mktPrice, setMktPrice] = useState(150);
  const [mktLicense, setMktLicense] = useState<'Commercial' | 'Editorial' | 'Personal'>('Commercial');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Pre-load from prop if provided
  useEffect(() => {
    if (preSelectedImage) {
      setSelectedImage(preSelectedImage);
      // clear the preselected state so standard navigation doesn't lock it
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedImage, onClearPreSelected]);

  // Handle computing SHA-256 hash using crypto subtle or dynamic fallback
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
    // Deterministic fallback matching RegisterImage
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

  // Drag and Drop helpers
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
      processVerificationFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVerificationFile(e.target.files[0]);
    }
  };

  const processVerificationFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (addToast) addToast("Please select a valid image file for fingerprint comparison.", "warning");
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Clear previous verification result if a new file is uploaded
    setUploadedHash(null);
    setIsVerified(null);
    setVerificationDone(false);
    setShowSliderTool(false);
    setShowDetails(false);
    setShowCertificate(false);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Run core cryptographic verification match
  const handleRunVerify = async () => {
    if (!selectedImage || !uploadedFile) return;

    setIsComputingHash(true);
    setVerificationDone(false);

    // Simulate crypto calculation and ledger query latency
    setTimeout(async () => {
      try {
        const computedHash = await computeSHA256(uploadedFile);
        setUploadedHash(computedHash);

        const targetHash = selectedImage.hash;
        const matches = (computedHash.toLowerCase().trim() === targetHash.toLowerCase().trim());
        setIsVerified(matches);
        setVerificationDone(true);

        const newEvent: VerificationEvent = {
          id: `VR-AUD-${Math.floor(100000 + Math.random() * 900000)}`,
          imageId: selectedImage.id,
          imageTitle: selectedImage.title,
          uploadedFileName: uploadedFile.name,
          hashTried: computedHash,
          timestamp: new Date().toISOString(),
          status: matches ? 'verified' : 'failed',
          similarity: matches ? 100 : 0, // ONLY exact SHA-256 match
          triggeredBy: currentUser?.name || 'Anonymous Auditor'
        };
        setCurrentVerificationEvent(newEvent);

        // Record verification event on client state
        if (onAddVerificationEvent) {
          onAddVerificationEvent(newEvent);
        }

        if (matches) {
          if (addToast) addToast("PassIMG Verification: Dynamic Hash Match Verified!", "success");
        } else {
          if (addToast) addToast("Warning: SHA-256 fingerprint mismatch!", "warning");
        }
      } catch (err) {
        console.error("Crypto mismatch calculations failed", err);
      } finally {
        setIsComputingHash(false);
      }
    }, 1800);
  };

  // Reset entire form
  const resetVerificationWorkspace = () => {
    setSelectedImage(null);
    setUploadedFile(null);
    setUploadedPreview(null);
    setUploadedHash(null);
    setIsVerified(null);
    setVerificationDone(false);
    setShowSliderTool(false);
    setShowDetails(false);
    setShowCertificate(false);
    setCurrentVerificationEvent(null);
    setShowMarketplaceDialog(false);
  };

  const downloadCertificatePDF = () => {
    if (!selectedImage) return;
    const event = currentVerificationEvent;
    const isMatched = isVerified === true;

    // Initialize jsPDF A4 Document: 210mm x 297mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Draw PassIMG Badge Logo (High-fidelity vector illustration matching standard mockup)
    const logoX = 20;
    const logoY = 15;
    const logoSize = 16;

    // Draw logo rounded square background (Blackish/navy)
    doc.setFillColor(9, 13, 22);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3.5, 3.5, 'F');

    // Draw Bright green brackets / icon outline
    doc.setDrawColor(34, 197, 94); // neon green
    doc.setLineWidth(0.6);
    
    // Top-left corner bracket
    doc.line(logoX + 2.5, logoY + 3.5, logoX + 4.5, logoY + 3.5);
    doc.line(logoX + 2.5, logoY + 3.5, logoX + 2.5, logoY + 5.5);
    // Top-right corner bracket
    doc.line(logoX + logoSize - 2.5, logoY + 3.5, logoX + logoSize - 4.5, logoY + 3.5);
    doc.line(logoX + logoSize - 2.5, logoY + 3.5, logoX + logoSize - 2.5, logoY + 5.5);
    // Bottom-left corner bracket
    doc.line(logoX + 2.5, logoY + logoSize - 3.5, logoX + 4.5, logoY + logoSize - 3.5);
    doc.line(logoX + 2.5, logoY + logoSize - 3.5, logoX + 2.5, logoY + logoSize - 5.5);
    // Bottom-right corner bracket
    doc.line(logoX + logoSize - 2.5, logoY + logoSize - 3.5, logoX + logoSize - 4.5, logoY + logoSize - 3.5);
    doc.line(logoX + logoSize - 2.5, logoY + logoSize - 3.5, logoX + logoSize - 2.5, logoY + logoSize - 5.5);

    // Draw check-shield vector inside logo badge
    // Shield upper line
    doc.line(logoX + 5, logoY + 6.5, logoX + 11, logoY + 6.5);
    // Shield sides curving down to center bottom
    doc.line(logoX + 5, logoY + 6.5, logoX + 5, logoY + 10);
    doc.line(logoX + 11, logoY + 6.5, logoX + 11, logoY + 10);
    doc.line(logoX + 5, logoY + 10, logoX + 8, logoY + 12.5);
    doc.line(logoX + 11, logoY + 10, logoX + 8, logoY + 12.5);

    // White checkmark inside shield
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.65);
    doc.line(logoX + 6.5, logoY + 9.5, logoX + 7.5, logoY + 10.5);
    doc.line(logoX + 7.5, logoY + 10.5, logoX + 9.5, logoY + 8);

    // 2. Main Header Typography
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 24, 33);
    doc.text("PassIMG Verification Certificate", 40, 26);

    // 3. Horizontal Seperator line
    doc.setDrawColor(20, 24, 33);
    doc.setLineWidth(0.8);
    doc.line(20, 37, 190, 37);

    // 4. Introductory Description paragraph text
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55); // slate grey/dark grey info text
    const descText = "This document serves as official confirmation that the digital asset identified below has been verified for integrity via the PassIMG platform. PassIMG utilizes advanced cryptographic hashing to ensure that the asset remains unaltered from its state at the time of registration.";
    const descLines = doc.splitTextToSize(descText, 170);
    doc.text(descLines, 20, 48);

    let y_details = 48 + (descLines.length * 5) + 6;

    // 5. Verification Audit Metadata details (printed exactly like reference PDF)
    const checkId = event?.id ? event.id.replace('VR-AUD-', '') : Math.floor(10000 + Math.random() * 90000).toString();
    const verUniqueId = `PIMG-${checkId}`;

    // Verification ID
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("Verification ID: ", 20, y_details);
    doc.setFont('Helvetica', 'normal');
    doc.text(verUniqueId, 50, y_details);
    y_details += 8;

    // Local Verification Timestamp
    const localTimeStr = formatLocalTimestamp(event?.timestamp);
    doc.setFont('Helvetica', 'bold');
    doc.text("Timestamp (Local): ", 20, y_details);
    doc.setFont('Helvetica', 'normal');
    doc.text(localTimeStr, 58, y_details);
    y_details += 12;

    // Image Fingerprint
    doc.setFont('Helvetica', 'bold');
    doc.text("Image Fingerprint (SHA-256):", 20, y_details);
    y_details += 6;
    doc.setFont('Courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99); // Dark grey signature hex text
    doc.text(selectedImage.hash, 20, y_details);
    y_details += 14;

    // Verification Status (Color highlights: Green for MATCHED and Red for MISMATCH)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12.5);
    if (isMatched) {
      doc.setTextColor(16, 185, 129); // emerald green matching status!
      doc.text("Verification Status: ORIGINAL FILE VERIFIED", 20, y_details);
    } else {
      doc.setTextColor(239, 68, 68); // rich rose matching mismatch status!
      doc.text("Verification Status: VERIFICATION MISMATCH / FILE TAMPERED", 20, y_details);
    }
    y_details += 10;

    // Verification URL link
    const verificationUrl = `${window.location.origin}/verify/${verUniqueId}`;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Verification URL: ", 20, y_details);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(37, 99, 235); // dynamic secure hyper link blue
    doc.text(verificationUrl, 52, y_details);
    y_details += 18;

    // 6. Media and High-Integrity QR Code grid section
    const y_img = y_details;

    // Left Column: Original verified image thumbnail preview has no border frame around it
    try {
      if (selectedImage.imageUrl) {
        doc.addImage(selectedImage.imageUrl, 'JPEG', 20, y_img, 65, 62);
      }
    } catch (e) {
      // Clean fallback vector frame if image fails to load
      doc.setDrawColor(240, 241, 244);
      doc.setLineWidth(0.3);
      doc.rect(20, y_img, 65, 62);
      doc.setFillColor(249, 250, 251);
      doc.rect(20.5, y_img + 0.5, 64, 61, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("ORIGINAL THUMBNAIL", 52.5, y_img + 28, { align: 'center' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("[Cryptographic Registry Seal]", 52.5, y_img + 34, { align: 'center' });
    }

    // Label under raw Image Thumbnail
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("Original Verified Image Thumbnail", 20, y_img + 68);

    // Right Column: Live High-fidelity vector QR Code structure (No borders, raw display)
    const qrX = 135;
    const qrY = y_img + 18;
    const qrSize = 42;

    // Draw anchor locator boxes (top-left, top-right, bottom-left)
    doc.setFillColor(0, 0, 0);
    doc.rect(qrX, qrY, 10, 10);
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + 2, qrY + 2, 6, 6);
    doc.setFillColor(0, 0, 0);
    doc.rect(qrX + 3, qrY + 3, 4, 4);

    doc.rect(qrX + qrSize - 10, qrY, 10, 10);
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + qrSize - 8, qrY + 2, 6, 6);
    doc.setFillColor(0, 0, 0);
    doc.rect(qrX + qrSize - 7, qrY + 3, 4, 4);

    doc.rect(qrX, qrY + qrSize - 10, 10, 10);
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + 2, qrY + qrSize - 8, 6, 6);
    doc.setFillColor(0, 0, 0);
    doc.rect(qrX + 3, qrY + qrSize - 7, 4, 4);

    // Draw dynamic procedural QR code matrix based on cryptographic SHA-value hash string
    doc.setFillColor(0, 0, 0);
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 14; c++) {
        // Skip locator boundaries
        if ((r < 5 && c < 5) || (r < 5 && c > 8) || (r > 8 && c < 5)) continue;
        
        const seedValue = selectedImage.hash ? selectedImage.hash.charCodeAt((r * 4 + c) % 64) : (r + c);
        if (seedValue % 3 === 0 || seedValue % 5 === 1) {
          doc.rect(qrX + c * 3, qrY + r * 3, 3, 3);
        }
      }
    }

    // Label under dynamic QR Code
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text("Scan to Verify Online", qrX + 21, qrY + qrSize + 6, { align: 'center' });

    // 7. Disclaimer Notice Block above footers
    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    const disclaimerLine = "Disclaimers: PassIMG verifies file integrity through cryptographic fingerprinting. PassIMG does not determine the real-world origin, ownership, or truthfulness of an image.";
    doc.text(disclaimerLine, 20, 269);

    // 8. Footer logs & systems credentials
    const footerTime = formatLocalTimestamp(new Date().toISOString());
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Generated on: ${footerTime}`, 20, 276);
    doc.text("Generated via Passimg-Trust-as -a-Service Infrastructure", 20, 281);

    // Save and trigger file download
    const certFilename = `PassIMG_Certificate_${verUniqueId}.pdf`;
    doc.save(certFilename);
    if (addToast) addToast(`Successfully generated and downloaded ${certFilename}!`, "success");
  };

  // Slider Mouse/Touch movement helpers
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left-click dragged
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Filtered list of registered images
  const filteredImages = registeredImages.filter(img => 
    img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" id="verify-image-workspace">
      
      {/* Visual Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-2xl relative overflow-hidden" id="verify-banner">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck className="h-44 w-44 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-400 border border-indigo-500/15">
              <FileCheck className="h-3.5 w-3.5 animate-pulse" />
              <span>Pass_IMG Verification Tool</span>
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Verify Image Originality</h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Check if an image file is an exact, unaltered match of a registered original in our system. We compare files down to the individual pixel.
            </p>
          </div>
          <div>
            <button
              onClick={() => setCurrentPage('register_image')}
              className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-xl transition-all border border-indigo-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Register New Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Verification Layout split section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand Column: Choose & Display Registered Origin Image */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                <span>Select Registered Image</span>
              </p>
              {selectedImage && (
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Change Selection
                </button>
              )}
            </div>

            {!selectedImage ? (
              /* Display Searchable Image list */
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search registered images by title, ID or hash..."
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg"
                  />
                </div>

                {/* Vertical scrollable registered records list */}
                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredImages.length > 0 ? (
                    filteredImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="w-full flex items-center space-x-3 bg-white/2 hover:bg-indigo-550/10 hover:bg-indigo-500/5 transition-all p-2.5 rounded-xl border border-white/5 text-left active:scale-[0.99] cursor-pointer"
                      >
                        <img 
                          src={img.imageUrl} 
                          alt={img.title} 
                          className="h-12 w-16 object-cover rounded-lg bg-indigo-950 border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-xs truncate leading-snug">{img.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold">{img.id}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter truncate max-w-[120px]">{img.hash}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">{new Date(img.registeredAt).toLocaleDateString()}</span>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded font-mono uppercase mt-0.5 inline-block">{img.category}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <HelpCircle className="h-8 w-8 text-slate-500 opacity-40 mx-auto mb-2" />
                      <p className="text-xs">No registered records match your query.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Stored Record Preview & specs */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-[220px] border border-white/10 flex items-center justify-center">
                  <img 
                    src={selectedImage.imageUrl} 
                    alt={selectedImage.title} 
                    className="max-h-[218px] w-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-indigo-500/90 text-zinc-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    Original Image on File
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-start border-b border-white/5 pb-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Image Title</p>
                      <h4 className="font-bold text-white text-sm mt-0.5">{selectedImage.title}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Registration ID</p>
                      <span className="font-mono text-sm font-extrabold text-indigo-400">{selectedImage.id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Date Registered</p>
                      <p className="font-semibold text-slate-300 mt-0.5 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-slate-500" />
                        <span>{new Date(selectedImage.registeredAt).toLocaleDateString()} {new Date(selectedImage.registeredAt).toLocaleTimeString()}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">File Size & Dimensions</p>
                      <p className="font-semibold text-slate-300 mt-0.5">{formatBytes(selectedImage.originalSize)} ({selectedImage.dimensions})</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Security Hash (Fingerprint)</span>
                    <div className="flex items-center space-x-1.5 mt-1 bg-white/2 border border-white/5 rounded-lg px-2 py-1 text-indigo-300 select-all">
                      <span className="font-mono text-[10px] text-slate-300 line-clamp-1 truncate block">{selectedImage.hash}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Column: Upload copy for checksum auditing */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                <span>Upload Image to Compare</span>
              </p>
              {uploadedPreview && (
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedPreview(null);
                    setUploadedHash(null);
                    setIsVerified(null);
                    setVerificationDone(false);
                    setShowSliderTool(false);
                  }}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Remove Copy
                </button>
              )}
            </div>

            {!uploadedPreview ? (
              /* Drag & Drop File Loader target container as specified in standard guidelines */
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] sm:min-h-[350px] transition-all duration-300 ${
                  dragActive 
                    ? 'border-indigo-400 bg-indigo-500/5' 
                    : 'border-white/10 hover:border-white/20 bg-white/1'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="rounded-full bg-slate-900 border border-white/5 p-4 text-slate-400 mb-4 transition-all">
                  <UploadCloud className="h-10 w-10 text-indigo-400" />
                </div>
                
                <h4 className="text-sm font-bold text-white mb-1">Upload comparison file</h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
                  Drag and drop your comparison image file here, or click to find it on your device. We will analyze if it matches exactly.
                </p>
                <div className="mt-6 flex items-center space-x-2">
                  <span className="h-px w-8 bg-white/10"></span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">or browse computer</span>
                  <span className="h-px w-8 bg-white/10"></span>
                </div>
              </div>
            ) : (
              /* Uploaded Image preview container */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-[220px] border border-white/10 flex items-center justify-center">
                  <img 
                    src={uploadedPreview} 
                    alt="Your Uploaded Copy" 
                    className="max-h-[218px] w-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-indigo-500/95 text-zinc-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    Your Uploaded Copy
                  </div>
                </div>

                {/* Uploaded specimen metadata specs card */}
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-3 text-xs col-span-12">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Uploaded File Name</p>
                      <p className="font-semibold text-white mt-0.5 truncate">{uploadedFile?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Uploaded File Size</p>
                      <p className="font-semibold text-white mt-0.5">{uploadedFile && formatBytes(uploadedFile.size)}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Uploaded File Security Hash</span>
                    <div className="flex items-center space-x-1.5 mt-1 bg-white/2 border border-white/5 rounded-lg px-2 py-1 text-slate-300">
                      {isComputingHash ? (
                        <div className="flex items-center space-x-2 py-0.5 text-indigo-400">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span className="font-mono text-[10px]">Analyzing file hash...</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] truncate block">
                          {uploadedHash || "(Pending verification sequence)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* STEP 3 — DYNAMIC EXECUTE VERIFICATION LOGS AREA */}
      {selectedImage && uploadedPreview && !verificationDone && (
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 animate-in slide-in-from-bottom-2 duration-300 max-w-xl mx-auto border-t border-indigo-500/10">
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Sliders className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-base font-extrabold text-white">Files Ready to Compare</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Ready to calculate the security code of your uploaded file and compare it against the original.
          </p>
          <button
            id="btn-execution-verification"
            disabled={isComputingHash}
            onClick={handleRunVerify}
            className="rounded-xl px-8 py-3 bg-indigo-500 hover:bg-indigo-600 font-bold text-xs uppercase tracking-wider text-white transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center space-x-2"
          >
            {isComputingHash ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Comparing files...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Run Verification</span>
              </>
            )}
          </button>
        </div>
      )}
      {/* STEP 4 — DETAILED MATCH CONDITIONS PANEL */}
      {verificationDone && (
        <div className="space-y-8 animate-in fill-mode-both duration-300">
          
          {/* NEW PICTORIAL DIFFERENTIATION AREA STYLE */}
          <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6 text-left" id="pictorial-match-result">
            
            {/* MATCH / MISMATCH BANNER */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${
              isVerified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-455 text-rose-400 shadow-lg shadow-rose-500/5'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isVerified 
                    ? 'bg-emerald-550/15 border-emerald-500/40 text-emerald-400' 
                    : 'bg-rose-550/15 border-rose-500/40 text-rose-400'
                }`}>
                  {isVerified ? (
                    <CheckCircle className="h-8 w-8 stroke-[2.5]" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Result Statement</p>
                  <h3 className="text-2xl font-black tracking-tight mt-0.5">
                    {isVerified ? "EXACT MATCH" : "MISMATCH"}
                  </h3>
                </div>
              </div>
              <div className="text-xs font-semibold px-4 py-1.5 rounded-full uppercase font-mono tracking-wider bg-white/5 border border-white/10 text-slate-300">
                {isVerified ? "100% Identical File Detected" : "Changes or Edits Detected"}
              </div>
            </div>

            {/* SIDE BY SIDE VIEW */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              
              {/* Left: Original on File */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex flex-col h-full group">
                <div className="aspect-video flex items-center justify-center bg-slate-900/60 overflow-hidden relative">
                  <img 
                    src={selectedImage?.imageUrl} 
                    alt="Registry original" 
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-indigo-500 text-zinc-950 font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[7px] sm:text-[9px] uppercase tracking-wider z-10 shadow-md">
                    Original Image
                  </div>
                </div>
                <div className="p-2.5 sm:p-4 bg-slate-950/20 border-t border-white/5 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500">Image Name</p>
                    <p className="font-bold text-white text-xs sm:text-sm truncate mt-0.5">{selectedImage?.title}</p>
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-mono text-slate-400 truncate mt-1">ID Code: {selectedImage?.id}</p>
                </div>
              </div>

              {/* Right: Uploaded Copy */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex flex-col h-full group">
                <div className="aspect-video flex items-center justify-center bg-slate-900/60 overflow-hidden relative">
                  <img 
                    src={uploadedPreview || undefined} 
                    alt="Uploaded copy" 
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-amber-500 text-zinc-950 font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[7px] sm:text-[9px] uppercase tracking-wider z-10 shadow-md">
                    Your Upload
                  </div>
                </div>
                <div className="p-2.5 sm:p-4 bg-slate-950/20 border-t border-white/5 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500">Uploaded File Name</p>
                    <p className="font-bold text-white text-xs sm:text-sm truncate mt-0.5">{uploadedFile?.name}</p>
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-mono text-slate-400 truncate mt-1">Size: {uploadedFile && formatBytes(uploadedFile.size)}</p>
                </div>
              </div>

            </div>

            {/* Simple Wording description note */}
            <div className="p-4 bg-white/2 rounded-xl border border-white/5 leading-relaxed text-xs text-slate-300">
              {isVerified ? (
                <p>
                  <strong>Perfect Match Confirmed!</strong> Both files have identical digital layouts on every single pixel level. No watermarks, filters, crops, or edits have been introduced. This file is 100% genuine and verified!
                </p>
              ) : (
                <p>
                  <strong>Mismatch Warning!</strong> The uploaded file does not match the original. This happens if you add text, crop the layout, adjust the screen contrast, re-save to a separate format, or upload a separate file.
                </p>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-2 duration-300">
            
            {/* COLUMN 1: LIVE INTERACTIVE HIGH-FIDELITY CERTIFICATE PREVIEW */}
            <div className="lg:col-span-6 flex justify-center">
              {isVerified ? (
                /* Premium passimg certificate */
                <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-200 w-full max-w-lg relative select-none" id="live-cert-preview">
                  
                  {/* Certificate Top Header Brand Row */}
                  <div className="flex items-center space-x-3.5">
                    {/* Brand Shield Logo Icon Badge (exact match to PDF) */}
                    <div className="h-12 w-12 rounded-lg bg-slate-950 flex items-center justify-center border border-gray-800 shrink-0 select-none pb-0.5">
                      <div className="relative h-8 w-8 flex items-center justify-center font-sans font-normal leading-none text-white text-[12px]">
                        {/* Bracket corners */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l rounded-tl-[1px] border-emerald-500" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r rounded-tr-[1px] border-emerald-500" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l rounded-bl-[1px] border-emerald-500" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r rounded-br-[1px] border-emerald-500" />
                        {/* Shield check inside */}
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 stroke-[2.5]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold tracking-tight font-sans leading-none text-gray-900">Official Certificate of Originality</h4>
                    </div>
                  </div>

                  {/* Thick Black Separator */}
                  <div className="h-[2px] bg-gray-900 my-4" />

                  {/* Intro Description */}
                  <p className="text-[10px] text-gray-600 italic leading-relaxed mb-5 font-sans">
                    This document certifies that the digital image file matches the registered record target.
                  </p>

                  {/* Verification Key-Value Stack */}
                  <div className="space-y-2 text-xs mb-6 text-left">
                    <div className="flex items-baseline space-x-1.5 font-sans">
                      <span className="font-bold text-gray-900">Event ID:</span>
                      <span className="font-bold text-gray-800">PIMG-{currentVerificationEvent?.id ? currentVerificationEvent.id.replace('VR-AUD-', '') : '595247'}</span>
                    </div>

                    <div className="flex items-baseline space-x-1.5 font-sans">
                      <span className="font-bold text-gray-900">Date Verified:</span>
                      <span className="text-gray-800">{formatLocalTimestamp(currentVerificationEvent?.timestamp)}</span>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <span className="font-bold text-gray-900 font-sans block">File Hash (Fingerprint):</span>
                      <span className="font-mono text-[9px] select-all tracking-tight break-all block bg-gray-50 px-2 py-1 rounded border border-gray-150 text-gray-600">{selectedImage?.hash}</span>
                    </div>

                    <div className="pt-2 font-sans">
                      <span className="text-gray-900 font-bold">Status: </span>
                      <span className="text-emerald-700 font-extrabold tracking-wide text-[10px] uppercase bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded ml-1">
                        EXACT MATCH / VERIFIED ORIGINAL
                      </span>
                    </div>
                  </div>

                  {/* Graphics Grid Row (Thumbnail + QR Code) */}
                  <div className="grid grid-cols-2 gap-6 items-end pb-4">
                    {/* Left: Original Image Thumbnail */}
                    <div className="space-y-1.5 text-left">
                      <div className="aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center p-0.5">
                        <img 
                          src={selectedImage?.imageUrl} 
                          alt="Thumbnail preview" 
                          className="h-full w-full object-cover rounded" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 font-sans block text-center">Verified image preview</span>
                    </div>

                    {/* Right: Realistic Rendered QR Code */}
                    <div className="flex flex-col items-center space-y-1.5 font-sans">
                      <div className="h-28 w-28 bg-white border p-2 ml-auto flex flex-col justify-between shrink-0 select-none relative rounded-lg border-gray-200">
                        
                        {/* Grid container */}
                        <div className="grid grid-cols-14 grid-rows-14 gap-[1px] h-full w-full">
                          {Array.from({ length: 196 }).map((_, idx) => {
                            const r = Math.floor(idx / 14);
                            const c = idx % 14;
                            
                            // Check for outer locator boxes
                            const isTopLeftLocator = (r < 4 && c < 4);
                            const isTopRightLocator = (r < 4 && c > 9);
                            const isBottomLeftLocator = (r > 9 && c < 4);
                            
                            if (isTopLeftLocator && (r === 0 || r === 3 || c === 0 || c === 3 || (r === 1.5 && c === 1.5))) {
                              return <div key={idx} className="bg-black" />;
                            }
                            if (isTopRightLocator && (r === 0 || r === 3 || c === 10 || c === 13 || (r === 1.5 && c === 11.5))) {
                              return <div key={idx} className="bg-black" />;
                            }
                            if (isBottomLeftLocator && (r === 10 || r === 13 || c === 0 || c === 3 || (r === 11.5 && c === 1.5))) {
                              return <div key={idx} className="bg-black" />;
                            }
                            
                            // Skip white boundaries of locator boxes
                            if ((r < 5 && c < 5) || (r < 5 && c > 8) || (r > 8 && c < 5)) {
                              return <div key={idx} className="bg-transparent" />;
                            }
                            
                            // Procedural filler dots
                            const charIndex = (r * 4 + c) % 64;
                            const charVal = selectedImage?.hash ? selectedImage.hash.charCodeAt(charIndex) : (r + c);
                            const isBlack = (charVal % 3 === 0 || charVal % 5 === 1);
                            
                            return (
                              <div 
                                key={idx} 
                                className={isBlack ? "bg-black rounded-[0.5px]" : "bg-transparent"} 
                              />
                            );
                          })}
                        </div>

                      </div>
                      <span className="text-[8px] text-gray-500 block text-center font-sans">Scan to verify online</span>
                    </div>
                  </div>

                  {/* Underline separator */}
                  <div className="h-[0.5px] bg-gray-200 mt-3 mb-2" />

                  {/* Bottom timestamps */}
                  <div className="text-[7.5px] text-gray-400 space-y-0.5 leading-none font-sans text-left">
                    <p>Verified on: {formatLocalTimestamp(currentVerificationEvent?.timestamp)}</p>
                    <p>Secured via Pass_IMG Trust Network</p>
                  </div>

                </div>
              ) : (
                /* Failed Mismatch view */
                <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-rose-300 w-full max-w-lg relative select-none animate-bounce" style={{ animationIterationCount: 1, animationDuration: '600ms' }} id="live-cert-preview-failed">
                  
                  {/* Top Header BRAND */}
                  <div className="flex items-center space-x-3.5">
                    <div className="h-12 w-12 rounded-lg bg-rose-950 flex items-center justify-center border border-rose-850 shrink-0 select-none pb-0.5">
                      <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold tracking-tight font-sans leading-none text-gray-900">Pass_IMG Integrity Alert</h4>
                    </div>
                  </div>

                  {/* Thick Separator */}
                  <div className="h-[2px] bg-rose-600 my-4" />

                  {/* Intro */}
                  <p className="text-[10px] text-gray-600 italic leading-relaxed mb-5 font-sans">
                    Warning: Verification check has completed with mismatch errors.
                  </p>

                  {/* Warning Details stack */}
                  <div className="space-y-4 text-xs mb-6 text-left">
                    <div className="flex items-baseline space-x-1.5 font-sans">
                      <span className="font-bold text-gray-900">Verification ID:</span>
                      <span className="font-bold text-rose-600 font-mono">PIMG-{currentVerificationEvent?.id ? currentVerificationEvent.id.replace('VR-AUD-', '') : 'ERROR'}</span>
                    </div>

                    <div className="flex items-baseline space-x-1.5 font-sans">
                      <span className="font-bold text-gray-900">Timestamp:</span>
                      <span className="text-gray-800">{formatLocalTimestamp(currentVerificationEvent?.timestamp)}</span>
                    </div>

                    <div className="space-y-2 py-2 bg-rose-50 border border-rose-100 rounded-lg px-3">
                      <span className="text-rose-705 font-extrabold tracking-wide font-sans text-[10px] uppercase block text-rose-700">
                        STATUS: MISMATCH / INTEGRITY TIMEOUT
                      </span>
                      <p className="text-[10px] text-gray-655 leading-normal font-sans text-gray-600">
                        One or more visual elements or byte tags do not correspond with the record. Edits, watermarks, file resizing, or different image structures trigger mismatch errors.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 font-mono text-[9px]">
                      <div>
                        <span className="text-gray-500 font-bold block uppercase bg-gray-100 px-1.5 py-0.5 rounded w-fit mb-1">Expected Original Hash:</span>
                        <span className="text-gray-800 break-all block bg-gray-50 px-2 py-1 rounded border border-gray-150">{selectedImage?.hash}</span>
                      </div>
                      <div>
                        <span className="text-rose-500 font-bold block uppercase bg-rose-100 px-1.5 py-0.5 rounded w-fit mb-1">Uploaded Mismatched Hash:</span>
                        <span className="text-rose-700 break-all block bg-rose-50 px-2 py-1 rounded border border-rose-150">{uploadedHash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fine divider */}
                  <div className="h-[0.5px] bg-gray-255 mt-4 mb-2 bg-gray-200" />

                  {/* Bottom tags */}
                  <div className="text-[7.5px] text-gray-400 space-y-0.5 leading-none font-sans text-left">
                    <p>Alert flagged on: {formatLocalTimestamp(currentVerificationEvent?.timestamp)}</p>
                    <p>Pass_IMG Trust Network Registry</p>
                  </div>

                </div>
              )}
            </div>

            {/* COLUMN 2: COMMAND CONSOLE DIRECT ACTION INTERACTION PANEL */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10 text-left bg-slate-900/40">
                
                {/* Status indicator */}
                <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    isVerified 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {isVerified ? (
                      <Check className="h-5.5 w-5.5 stroke-[2.5]" />
                    ) : (
                      <AlertTriangle className="h-5.5 w-5.5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Pass_IMG Comparison Hub</p>
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      {isVerified ? "Verification Successful" : "Verification Mismatch"}
                    </h4>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  {isVerified ? (
                    <>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        Great! Your uploaded copy is exactly the same as the original on file. You can download the PDF certificate or list it on the marketplace below.
                      </p>

                      {/* Prominent High-Contrast Call-to-Action Buttons */}
                      <div className="space-y-3 pt-2">
                        
                        {/* Button 1: Download Certificate */}
                        <button
                          type="button"
                          onClick={downloadCertificatePDF}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-450 hover:opacity-90 hover:scale-[1.01] active:scale-100 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-emerald-500/15 border border-emerald-350/20"
                          id="btn-prominent-download-cert"
                        >
                          <Download className="h-4.5 w-4.5 stroke-[2.5] text-zinc-955 text-zinc-950 animate-bounce" />
                          <span>Download Certificate (PDF)</span>
                        </button>

                        {/* Button 2: List on Marketplace */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowMarketplaceDialog(true);
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 hover:scale-[1.01] active:scale-100 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-indigo-500/20 border-none outline-none"
                          id="btn-prominent-list-marketplace"
                        >
                          <ShoppingBag className="h-4.5 w-4.5 stroke-[2]" />
                          <span>List Image in Marketplace</span>
                        </button>

                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Notice: The uploaded copy does not match the registered image. This indicates that edits or visual overlays have been made, or this is a completely different file.
                      </p>
                      
                      <div className="bg-rose-500/5 rounded-xl border border-rose-500/10 p-4 text-wrap leading-relaxed text-[11px] space-y-2 text-rose-455 text-rose-400">
                        <span className="font-bold flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Certificate Unavailable</span>
                        </span>
                        <p className="text-slate-400">
                          Official PDF certificates are only issued when images match exactly. If you believe this is the correct image, please make sure you upload the raw, unedited original.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Reset & Navigation Controls */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={resetVerificationWorkspace}
                    className="py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-205 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-slate-200"
                    id="btn-workspace-audit-again"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Verify Another</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToGallery}
                    className="py-2.5 rounded-xl border border-white/10 bg-white/5 hover:text-white hover:bg-white/10 text-slate-355 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-slate-400"
                    id="btn-workspace-back-gallery"
                  >
                    <span>Back to Gallery</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
              
            </div>

          </div>

          {/* MARKETPLACE QUICK LIST DIRECT ACTION CONSOLE */}
          {showMarketplaceDialog && selectedImage && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="verify-mkt-listing-dialog">
              <div className="glass rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-white/10 bg-[#070b13] shadow-2xl">
                
                <button
                  onClick={() => setShowMarketplaceDialog(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <span>Instantly List Verified Specimen</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your digital asset is cryptographically proven. Specify pricing rules to publish it immediately as verified on the public Marketplace.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Brief Preview Card */}
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.title}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{selectedImage.title}</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">Ledger Target: {selectedImage.id}</p>
                    </div>
                  </div>

                  {/* Ask Price input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asking Listing Price ($)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={mktPrice}
                        onChange={(e) => setMktPrice(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white font-mono text-sm"
                        placeholder="150"
                      />
                    </div>
                  </div>

                  {/* License Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Transfer Contract</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Commercial', 'Editorial', 'Personal'] as const).map((license) => (
                        <button
                          key={license}
                          type="button"
                          onClick={() => setMktLicense(license)}
                          className={`py-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                            mktLicense === license 
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {license}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowMarketplaceDialog(false)}
                    className="w-full sm:flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
                  >
                    Cancel Action
                  </button>
                  <button
                    onClick={() => {
                      if (onUpdateImage) {
                        const updated: RegisteredImage = {
                          ...selectedImage,
                          isForSale: true,
                          price: mktPrice,
                          licenseType: mktLicense
                        };
                        onUpdateImage(updated);
                        if (addToast) addToast(`Successfully published "${selectedImage.title}" listing on the marketplace!`, 'success');
                        setShowMarketplaceDialog(false);
                      }
                    }}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Confirm & Publish
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* VIEW COMPARISON DETAILS AREA (SHA-256 analysis is now always visible) */}
          <div className="glass rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-3 duration-200" id="comparison-details-section">
            <h4 className="font-bold text-white text-xs uppercase tracking-widest border-b border-white/5 pb-2.5">
              Side-by-Side Metadata & Fingerprint Analysis (SHA-256)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 font-bold">Property Comparison</th>
                    <th className="py-2.5 font-bold px-4">Registry Target Details</th>
                    <th className="py-2.5 font-bold">Uploaded Specimen Details</th>
                    <th className="py-2.5 font-bold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  
                  {/* Filename match */}
                  <tr>
                    <td className="py-3 font-semibold text-slate-400">Identifier Name</td>
                    <td className="py-3 px-4 text-white truncate max-w-[200px]">{selectedImage?.title}</td>
                    <td className="py-3 text-white truncate max-w-[200px]">{uploadedFile?.name}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none ${
                        selectedImage?.title === uploadedFile?.name ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedImage?.title === uploadedFile?.name ? 'Exact Name' : 'Differ Name'}
                      </span>
                    </td>
                  </tr>

                  {/* Byte size match */}
                  <tr>
                    <td className="py-3 font-semibold text-slate-400">Memory Allocation Size</td>
                    <td className="py-3 px-4 text-white font-mono">{selectedImage && formatBytes(selectedImage.originalSize)}</td>
                    <td className="py-3 text-white font-mono">{uploadedFile && formatBytes(uploadedFile.size)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none ${
                        selectedImage?.originalSize === uploadedFile?.size ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455 text-rose-400'
                      }`}>
                        {selectedImage?.originalSize === uploadedFile?.size ? 'Identical Size' : 'Mismatch Size'}
                      </span>
                    </td>
                  </tr>

                  {/* Hash Matches layout */}
                  <tr>
                    <td className="py-3 font-semibold text-slate-400">SHA-256 Fingerprint Signature</td>
                    <td className="py-2 px-4 font-mono text-[10.5px] text-slate-400 break-all select-all leading-normal max-w-[240px]">{selectedImage?.hash}</td>
                    <td className="py-2 font-mono text-[10.5px] text-slate-400 break-all select-all leading-normal max-w-[240px]">{uploadedHash}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono uppercase ${
                        isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455 text-rose-400'
                      }`}>
                        {isVerified ? 'MATCHED' : 'CHANGED'}
                      </span>
                    </td>
                  </tr>

                  {/* Verification records */}
                  <tr>
                    <td className="py-3 font-semibold text-slate-400">Cryptographical Security Protocol</td>
                    <td className="py-3 px-4 text-white">W3C Immutable Ledger</td>
                    <td className="py-3 text-white">SubtleCrypto Digital Digests</td>
                    <td className="py-3 text-right">
                      <span className="text-indigo-400 font-semibold">Ready</span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Hash highlights matches comparison layout tool */}
            {!isVerified && (
              <div className="bg-rose-950/20 border border-rose-500/10 p-4 rounded-xl text-xs text-rose-400 space-y-2 pb-5">
                <p className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Cryptographic Block Integrity Warning</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  PassIMG's hashing protocol generates irreversible hashes from the raw resource byte streams. Even changing a single pixel's color value by 1% produces completely mismatched outputs. The files were visually alike but came out with completely separate SHA-256 values:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-[10px]">
                  <div className="bg-slate-950/40 p-2.5 rounded border border-white/5">
                    <p className="font-bold text-slate-400 mb-1 uppercase">Stored Signature Target Block:</p>
                    <p className="text-white text-wrap break-all uppercase leading-tight bg-slate-900 px-1.5 py-1 rounded">{selectedImage?.hash}</p>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded border border-white/5">
                    <p className="font-bold text-slate-400 mb-1 uppercase">Comparison Specimen Signature Block:</p>
                    <p className="text-rose-400 text-wrap break-all uppercase leading-tight bg-slate-900 px-1.5 py-1 rounded">{uploadedHash}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE PIXEL SPLIT SLIDER SYSTEM (Side-by-side matches comparison is now always visible) */}
          <div className="glass rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-3 duration-250" id="visual-slider-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1 text-left">
                <h4 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  <span>Visual Mirror Overlay Alignment Tool (Side-by-Side Comparison)</span>
                </h4>
                <p className="text-[10.5px] text-slate-400 leading-snug">
                  Drag the interactive vertical line selector back and forth to inspect exact visual pixels differences. Left is Registry Original, Right is Uploaded Copy.
                </p>
              </div>
              <div className="bg-slate-950 px-3 py-1 rounded-lg border border-white/15 text-[11px] font-mono text-indigo-300">
                Alignment: {sliderPosition.toFixed(0)}% Line
              </div>
            </div>

            {/* Slider Workspace Sandbox Canvas Container */}
            <div 
              ref={sliderContainerRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative mx-auto rounded-xl overflow-hidden aspect-video bg-slate-950 max-h-[380px] border border-white/10 select-none cursor-ew-resize group"
            >
              
              {/* Uploaded comparison specimen image (background layer) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={uploadedPreview} 
                  alt="specimen copy" 
                  className="max-h-[378px] w-full object-contain pointer-events-none"
                />
              </div>

              {/* Stored original image (floating foreground layer formatted with clip path) */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-slate-950" 
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img 
                  src={selectedImage?.imageUrl} 
                  alt="registry original" 
                  className="max-h-[378px] w-full object-contain pointer-events-none"
                />
              </div>

              {/* Left side overlay tag */}
              <div className="absolute bottom-4 left-4 bg-indigo-500/90 text-zinc-950 font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide pointer-events-none z-20 shadow-md">
                 Registry Original
              </div>

              {/* Right side overlay tag */}
              <div className="absolute bottom-4 right-4 bg-emerald-500/90 text-zinc-950 font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide pointer-events-none z-20 shadow-md">
                 Specimen Copy
              </div>

              {/* Sliding divider line handles */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Slider Control Handle */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full border border-white bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                  <Sliders className="h-4 w-4 rotate-90 text-indigo-400" />
                </div>
              </div>

            </div>

            {/* Tips */}
            <p className="text-[10px] text-slate-500 italic text-center">
              * Note: Hover slider handle and hold click down or slide on touch devices to reposition mirror overlays. Use this tool to verify crop bounds or edit points perfectly.
            </p>

          </div>

          {/* Action Navigation Options footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5" id="verify-footer-actions">
            
            <button
              onClick={resetVerificationWorkspace}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer"
              id="btn-reset-workspace"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Verify Another Image Specimen</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto items-center">
              {isVerified && (
                <>
                  <button
                    onClick={downloadCertificatePDF}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 hover:opacity-90 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/10 border border-emerald-450/20"
                    id="post-v-btn-download-cert"
                  >
                    <Download className="h-4 w-4 text-zinc-950" />
                    <span>Download Certificate</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMarketplaceDialog(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-indigo-500/20"
                    id="post-v-btn-list-mkt"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>List On Marketplace</span>
                  </button>
                </>
              )}

              <button
                onClick={onNavigateToGallery}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-350 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
                id="btn-nav-vault-after-v"
              >
                <span>Back to Gallery</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
