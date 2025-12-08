"use client";

/**
 * Who's Right - Your Pocket Judge ⚖️
 * 
 * AI-powered argument analyzer that helps resolve disputes fairly.
 * Upload screenshots + add context for balanced analysis.
 * 
 * Features:
 * - Visual toxicity meter
 * - Red flag detection
 * - Official verdict certificate
 * - Relationship tips
 * 
 * Inclusive for ALL relationship types.
 * Entertainment purposes with helpful insights.
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, X, Loader2, AlertTriangle, Scale, Heart, Shield,
  MessageSquare, Flag, FileText, Users,
  Info, Crown, Share2, Gavel,
  Calendar, Hash, RefreshCw, Plus
} from "lucide-react";
import { LandingAd } from "@/components/ads/landing-ad";

interface RedFlag {
  type: string;
  emoji: string;
  severity: "low" | "medium" | "high";
}

interface Receipt {
  number: number;
  text: string;
  type: "negative" | "neutral" | "positive";
}

interface AnalysisResult {
  winner: "person1" | "person2" | "tie" | "both_wrong";
  winnerLabel: string;
  loserLabel: string;
  toxicityScore: number;
  toxicityLevel: string;
  argumentType: string;
  redFlags: RedFlag[];
  receipts: Receipt[];
  healthyTip: string;
  communicationScore: number;
  caseNumber: string;
  ruling: string;
  suggestion: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

export function WhosRightPanel() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [person1Label, setPerson1Label] = useState("You");
  const [person2Label, setPerson2Label] = useState("Other Person");
  const [additionalContext, setAdditionalContext] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5);
    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 5));
    setError(null);
    setResult(null);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5);
    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 5));
    setError(null);
    setResult(null);
  }, []);

  const analyzeArgument = async () => {
    if (images.length === 0) {
      setError("Please upload at least one screenshot");
      return;
    }
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      images.forEach((img, i) => formData.append(`image${i}`, img.file));
      formData.append("person1Label", person1Label);
      formData.append("person2Label", person2Label);
      formData.append("context", additionalContext);

      const response = await fetch("/api/analyze/argument", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed. Please try again.");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResult(null);
    setError(null);
    setPerson1Label("You");
    setPerson2Label("Other Person");
    setAdditionalContext("");
    setShowCertificate(false);
  };

  const shareResult = async () => {
    if (!result) return;
    const text = `⚖️ Aurora App Verdict\n\n👑 ${result.winnerLabel} won this one\n\n"${result.ruling}"\n\nCase #${result.caseNumber}\n\nAnalyze YOUR conversations at Aurora App! 💜`;
    if (navigator.share) {
      try { await navigator.share({ title: "Who's Right - Verdict", text }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-aurora-violet)]/10 to-[var(--color-aurora-purple)]/10 mb-3">
          <Scale className="w-5 h-5 text-[var(--color-aurora-violet)]" />
          <span className="font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]">
            Who&apos;s Right?
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)] mb-2">
          Your Pocket Judge ⚖️
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          Upload screenshots of your conversation and get an AI-powered analysis.
          Fair, balanced, and confidential.
        </p>
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> All relationships</span>
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[var(--color-aurora-mint)]" /> Private</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Person Labels */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-aurora-purple)] mb-1.5 block">
                  👤 Person 1 (You?)
                </label>
                <input type="text" value={person1Label} onChange={(e) => setPerson1Label(e.target.value || "You")}
                  placeholder="Your name" className="w-full h-12 px-4 rounded-xl bg-[var(--card)] border-2 border-[var(--border)] text-sm focus:border-[var(--color-aurora-purple)] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1.5 block">
                  👤 Person 2
                </label>
                <input type="text" value={person2Label} onChange={(e) => setPerson2Label(e.target.value || "Other Person")}
                  placeholder="Their name" className="w-full h-12 px-4 rounded-xl bg-[var(--card)] border-2 border-[var(--border)] text-sm focus:border-[var(--color-aurora-purple)] focus:outline-none" />
              </div>
            </div>

            {/* Upload Area */}
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-[var(--color-aurora-purple)]/40 hover:border-[var(--color-aurora-purple)] rounded-2xl p-6 text-center cursor-pointer transition-all bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] flex items-center justify-center">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-[var(--foreground)]">Upload Screenshots</p>
                <p className="text-xs text-[var(--muted-foreground)]">Drag & drop or click (max 5 images)</p>
              </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <div key={img.id} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-[var(--color-aurora-purple)]/20">
                    <img src={img.preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--color-aurora-salmon)] flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center hover:border-[var(--color-aurora-purple)]/50">
                    <Plus className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </button>
                )}
              </div>
            )}

            {/* Additional Context */}
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Additional Context (Optional)
              </label>
              <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Add any background info that might help understand the situation better..."
                className="w-full h-24 px-4 py-3 rounded-xl bg-[var(--card)] border-2 border-[var(--border)] text-sm focus:border-[var(--color-aurora-purple)] focus:outline-none resize-none"
                maxLength={500} />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{additionalContext.length}/500 characters</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-aurora-salmon)]/10 text-[var(--color-aurora-salmon)]">
                <AlertTriangle className="w-4 h-4" /><span className="text-sm">{error}</span>
              </div>
            )}

            {/* Analyze Button */}
            <Button onClick={analyzeArgument} disabled={images.length === 0 || isAnalyzing}
              className="w-full h-14 rounded-xl bg-[var(--color-aurora-violet)] hover:bg-[var(--color-aurora-purple)] text-white font-bold text-base">
              {isAnalyzing ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</>) : (<><Gavel className="w-5 h-5 mr-2" />Get Verdict</>)}
            </Button>

            <LandingAd variant="native" className="mt-4" />
          </motion.div>
        ) : (
          <ResultView result={result} person1Label={person1Label} person2Label={person2Label}
            showCertificate={showCertificate} setShowCertificate={setShowCertificate}
            onReset={resetAnalysis} onShare={shareResult} />
        )}
      </AnimatePresence>
    </div>
  );
}


/** Result View - Clean UI like the prototype */
function ResultView({ result, person1Label, person2Label, showCertificate, setShowCertificate, onReset, onShare }: {
  result: AnalysisResult; person1Label: string; person2Label: string;
  showCertificate: boolean; setShowCertificate: (v: boolean) => void;
  onReset: () => void; onShare: () => void;
}) {
  const isWinner = result.winner === "person1";
  const isTie = result.winner === "tie" || result.winner === "both_wrong";
  const winnerName = isWinner ? person1Label : isTie ? "Nobody" : person2Label;
  const loserName = isWinner ? person2Label : isTie ? "" : person1Label;

  // Toxicity meter colors
  const getToxicityColor = (score: number) => {
    if (score <= 25) return "#22c55e"; // Green
    if (score <= 50) return "#eab308"; // Yellow
    if (score <= 75) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  return (
    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      {/* Winner Banner */}
      <Card className="overflow-hidden bg-gradient-to-r from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)] border-0">
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">👑</div>
          <h2 className="text-2xl font-bold text-[var(--color-aurora-violet)]">
            {isTie ? "It's a Draw" : `${winnerName} won`}
          </h2>
          {!isTie && <p className="text-sm text-[var(--color-aurora-violet)]/70">{loserName} lost this one</p>}
        </div>
      </Card>

      {/* Toxicity Meter */}
      <Card className="p-5 bg-[var(--card)] border-[var(--border)]">
        <div className="text-center mb-4">
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Toxicity Level</span>
          <span className="ml-2 text-lg font-bold" style={{ color: getToxicityColor(result.toxicityScore) }}>
            ({result.toxicityScore})
          </span>
        </div>

        {/* Visual Meter - Semicircle gauge */}
        <div className="relative h-24 flex items-end justify-center mb-2">
          <svg viewBox="0 0 200 100" className="w-48 h-24">
            {/* Background arc */}
            <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
            {/* Colored segments */}
            <path d="M 10 100 A 90 90 0 0 1 55 25" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />
            <path d="M 55 25 A 90 90 0 0 1 100 10" fill="none" stroke="#84cc16" strokeWidth="16" />
            <path d="M 100 10 A 90 90 0 0 1 145 25" fill="none" stroke="#eab308" strokeWidth="16" />
            <path d="M 145 25 A 90 90 0 0 1 175 55" fill="none" stroke="#f97316" strokeWidth="16" />
            <path d="M 175 55 A 90 90 0 0 1 190 100" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" />
            {/* Needle */}
            <line x1="100" y1="100" x2={100 + 70 * Math.cos(Math.PI * (1 - result.toxicityScore / 100))}
              y2={100 - 70 * Math.sin(Math.PI * (1 - result.toxicityScore / 100))}
              stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill="#1f2937" />
          </svg>
        </div>
        <p className="text-center font-semibold" style={{ color: getToxicityColor(result.toxicityScore) }}>
          {result.toxicityLevel}
        </p>
      </Card>

      {/* Argument Type */}
      <Card className="p-4 bg-[var(--color-aurora-purple)] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Argument type:</span>
          </div>
          <span className="font-bold">{result.argumentType}</span>
        </div>
      </Card>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
            <span className="text-sm font-bold text-[var(--color-aurora-salmon)] uppercase tracking-wider">Red Flags Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.redFlags.map((flag, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)] border border-[var(--border)]">
                <span className="text-lg">{flag.emoji}</span>
                <span className="text-sm font-medium">{flag.type}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* The Receipts */}
      {result.receipts.length > 0 && (
        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[var(--color-aurora-purple)]" />
            <span className="text-sm font-bold text-[var(--color-aurora-purple)] uppercase tracking-wider">The Receipts</span>
          </div>
          <div className="space-y-2">
            {result.receipts.map((receipt) => (
              <div key={receipt.number} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent)]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: receipt.type === "negative" ? "var(--color-aurora-salmon)" : receipt.type === "positive" ? "var(--color-aurora-mint)" : "var(--color-aurora-blue)" }}>
                  {receipt.number}
                </div>
                <p className="text-sm text-[var(--foreground)]">{receipt.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Suggestion */}
      {result.suggestion && (
        <Card className="p-4 bg-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-mint)]/30">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-[var(--color-aurora-pink)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[var(--color-aurora-violet)] uppercase mb-1">Suggestion</p>
              <p className="text-sm text-[var(--foreground)]">{result.suggestion}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onShare} className="h-12 rounded-xl bg-[var(--color-aurora-violet)] hover:bg-[var(--color-aurora-purple)] text-white font-semibold">
          <Share2 className="w-4 h-4 mr-2" />Share
        </Button>
        <Button onClick={() => setShowCertificate(true)} variant="outline" className="h-12 rounded-xl border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)]">
          <FileText className="w-4 h-4 mr-2" />Certificate
        </Button>
      </div>

      <Button onClick={onReset} variant="ghost" className="w-full h-10 text-[var(--color-aurora-purple)]">
        <RefreshCw className="w-4 h-4 mr-2" />New Analysis
      </Button>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCertificate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-[var(--color-aurora-violet)] text-white p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em]">Official Verdict</p>
                <h3 className="text-lg font-bold">Aurora App Court</h3>
              </div>
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                  <Hash className="w-3 h-3" /><span>Case #{result.caseNumber}</span>
                  <Calendar className="w-3 h-3 ml-2" /><span>{new Date().toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">It is hereby declared that:</p>
                <div className="my-4 px-4 py-3 rounded-full bg-[var(--color-aurora-mint)] inline-flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  <span className="text-lg font-bold text-[var(--color-aurora-violet)]">{winnerName}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--color-aurora-mint)]">IS RIGHT</p>
                <div className="my-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm italic text-gray-600">&quot;{result.ruling}&quot;</p>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Gavel className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Aurora AI Judge</p>
                    <p className="text-[10px] text-gray-400">Verified Analysis</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex gap-2">
                <Button onClick={() => setShowCertificate(false)} variant="outline" className="flex-1">Close</Button>
                <Button onClick={onShare} className="flex-1 bg-[var(--color-aurora-purple)]">
                  <Share2 className="w-4 h-4 mr-2" />Share
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LandingAd variant="native" className="mt-4" />

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--accent)] text-xs text-[var(--muted-foreground)]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>For entertainment purposes. For serious concerns, consult a professional. Made with 💜 by Aurora App.</p>
      </div>
    </motion.div>
  );
}

export default WhosRightPanel;
