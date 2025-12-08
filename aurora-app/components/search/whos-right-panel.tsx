"use client";

/**
 * Who's Right - The Petty Court of Appeals 👑
 * 
 * Win The Argument. Keep The Receipts.
 * AI-powered argument analyzer with shareable victory certificates.
 * 
 * Features:
 * - Upload screenshots of arguments
 * - AI analysis with toxicity & red flag detection
 * - Shareable "Official Verdict" certificates
 * - Perfect for group chats, couples, and petty feuds
 * 
 * Inclusive for ALL relationship types - Aurora App for everyone!
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, X, Loader2, AlertTriangle, Scale, Heart, Shield, 
  MessageSquare, Sparkles, Flag, FileText, Zap, Trophy, Users, 
  ArrowRight, Info, Crown, Skull, Download, Share2, Gavel,
  CheckCircle, Quote, Calendar, Hash
} from "lucide-react";
import { LandingAd } from "@/components/ads/landing-ad";

interface RedFlag {
  type: string;
  emoji: string;
  description: string;
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
  micDrop: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

// Scrolling chaos messages for the marquee
const CHAOS_MESSAGES = [
  "You never listen to me!",
  "That's literally not what I said.",
  "Stop gaslighting me.",
  "I have the screenshots.",
  "You're being dramatic.",
  "Read the timestamp.",
  "Per my last message...",
  "New phone, who dis?",
  "K.",
  "We need to talk.",
];

export function WhosRightPanel() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [person1Label, setPerson1Label] = useState("You");
  const [person2Label, setPerson2Label] = useState("Them");
  const [showCertificate, setShowCertificate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

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
      setError("Upload your evidence to start the trial");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      images.forEach((img, i) => formData.append(`image${i}`, img.file));
      formData.append("person1Label", person1Label);
      formData.append("person2Label", person2Label);

      const response = await fetch("/api/analyze/argument", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("The court is busy. Try again.");

      const data = await response.json();
      setResult(data);
      setShowCertificate(true);
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
    setPerson2Label("Them");
    setShowCertificate(false);
  };

  const shareResult = async () => {
    if (!result) return;
    const text = `⚖️ Official Verdict from Aurora App\n\n👑 ${result.winnerLabel} WON\n💀 ${result.loserLabel} LOST\n\n"${result.ruling}"\n\nCase #${result.caseNumber}\n\nSettle YOUR arguments at Aurora App! 💜`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Who's Right - Official Verdict", text });
      } catch { /* User cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      alert("Verdict copied to clipboard! 📋");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header - The Petty Court */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 mb-3">
          <Gavel className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          <span className="font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]">
            The Petty Court of Appeals
          </span>
          <Badge className="text-[9px] bg-[var(--color-aurora-pink)] text-white border-0">⚖️</Badge>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)] mb-2">
          Win The Argument. Keep The Receipts.
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
          Don&apos;t just say you&apos;re right. <span className="font-semibold text-[var(--color-aurora-purple)]">Prove it</span> with an AI-generated certificate. 
          Perfect for group chats, couples, and petty feuds.
        </p>
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> All relationships</span>
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[var(--color-aurora-mint)]" /> Private</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[var(--color-aurora-pink)]" /> Made for the petty ones 💅</span>
        </div>
      </div>

      {/* Chaos Marquee */}
      <div className="overflow-hidden py-2 bg-[var(--accent)] rounded-xl mb-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...CHAOS_MESSAGES, ...CHAOS_MESSAGES].map((msg, i) => (
            <span key={i} className="mx-4 text-sm text-[var(--muted-foreground)] italic">
              &quot;{msg}&quot;
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <UploadSection
            images={images}
            person1Label={person1Label}
            person2Label={person2Label}
            setPerson1Label={setPerson1Label}
            setPerson2Label={setPerson2Label}
            handleFileSelect={handleFileSelect}
            handleDrop={handleDrop}
            removeImage={removeImage}
            analyzeArgument={analyzeArgument}
            isAnalyzing={isAnalyzing}
            error={error}
            fileInputRef={fileInputRef}
          />
        ) : (
          <ResultSection
            result={result}
            person1Label={person1Label}
            person2Label={person2Label}
            showCertificate={showCertificate}
            setShowCertificate={setShowCertificate}
            certificateRef={certificateRef}
            onReset={resetAnalysis}
            onShare={shareResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


/** Upload Section Component */
function UploadSection({
  images, person1Label, person2Label, setPerson1Label, setPerson2Label,
  handleFileSelect, handleDrop, removeImage, analyzeArgument, isAnalyzing, error, fileInputRef
}: {
  images: UploadedImage[];
  person1Label: string;
  person2Label: string;
  setPerson1Label: (v: string) => void;
  setPerson2Label: (v: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  removeImage: (id: string) => void;
  analyzeArgument: () => void;
  isAnalyzing: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Person Labels */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--color-aurora-purple)] mb-1 block flex items-center gap-1">
            <Crown className="w-3 h-3" /> The Plaintiff (You?)
          </label>
          <input
            type="text"
            value={person1Label}
            onChange={(e) => setPerson1Label(e.target.value || "You")}
            placeholder="Your name"
            className="w-full h-12 px-4 rounded-xl bg-[var(--card)] border-2 border-[var(--border)] text-sm focus:border-[var(--color-aurora-purple)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--muted-foreground)] mb-1 block flex items-center gap-1">
            <Skull className="w-3 h-3" /> The Defendant
          </label>
          <input
            type="text"
            value={person2Label}
            onChange={(e) => setPerson2Label(e.target.value || "Them")}
            placeholder="Their name"
            className="w-full h-12 px-4 rounded-xl bg-[var(--card)] border-2 border-[var(--border)] text-sm focus:border-[var(--color-aurora-purple)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-[var(--color-aurora-purple)]/40 hover:border-[var(--color-aurora-purple)] rounded-2xl p-8 text-center cursor-pointer transition-all bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 hover:from-[var(--color-aurora-purple)]/10 hover:to-[var(--color-aurora-pink)]/10"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg text-[var(--foreground)]">
              Upload Your Evidence 📸
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Screenshots, texts, DMs - bring the receipts (max 5)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-aurora-mint)] font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Your images are analyzed privately and never stored</span>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--accent)] border-2 border-[var(--color-aurora-purple)]/20">
              <img src={img.preview} alt="Evidence" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--color-aurora-salmon)] flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                Evidence #{images.indexOf(img) + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-aurora-salmon)]/10 text-[var(--color-aurora-salmon)] border border-[var(--color-aurora-salmon)]/20">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Start Trial Button */}
      <Button
        onClick={analyzeArgument}
        disabled={images.length === 0 || isAnalyzing}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            The court is deliberating...
          </>
        ) : (
          <>
            <Gavel className="w-5 h-5 mr-2" />
            Start The Trial ⚖️
          </>
        )}
      </Button>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { icon: FileText, title: "Official Certificate", desc: "Shareable proof of victory", color: "var(--color-aurora-purple)" },
          { icon: Flag, title: "Red Flag Scanner", desc: "Detect gaslighting & more", color: "var(--color-aurora-salmon)" },
          { icon: MessageSquare, title: "The Mic Drop", desc: "AI-generated final reply", color: "var(--color-aurora-blue)" },
          { icon: Scale, title: "Fair Analysis", desc: "Unbiased AI judgment", color: "var(--color-aurora-mint)" },
        ].map((feature, i) => (
          <div key={i} className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40 transition-colors">
            <feature.icon className="w-5 h-5 mb-2" style={{ color: feature.color }} />
            <p className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Ad placement */}
      <LandingAd variant="native" className="mt-4" />
    </motion.div>
  );
}


/** Result Section with Certificate */
function ResultSection({
  result, person1Label, person2Label, showCertificate, setShowCertificate,
  certificateRef, onReset, onShare
}: {
  result: AnalysisResult;
  person1Label: string;
  person2Label: string;
  showCertificate: boolean;
  setShowCertificate: (v: boolean) => void;
  certificateRef: React.RefObject<HTMLDivElement | null>;
  onReset: () => void;
  onShare: () => void;
}) {
  const isWinner = result.winner === "person1";
  const isTie = result.winner === "tie" || result.winner === "both_wrong";
  
  const winnerName = isWinner ? person1Label : isTie ? "Nobody" : person2Label;
  const loserName = isWinner ? person2Label : isTie ? "Both" : person1Label;
  
  const winnerScore = isWinner ? Math.max(70, 100 - result.toxicityScore) : isTie ? 50 : Math.min(30, result.toxicityScore);
  const loserScore = 100 - winnerScore;

  const getToxicityColor = (score: number) => {
    if (score <= 30) return "var(--color-aurora-mint)";
    if (score <= 50) return "var(--color-aurora-yellow)";
    if (score <= 70) return "var(--color-aurora-pink)";
    return "var(--color-aurora-salmon)";
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-4"
    >
      {/* AI Analysis Bar */}
      <Card className="p-4 bg-[var(--color-aurora-violet)] text-white overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-aurora-pink)]" />
          AI Analysis
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold flex items-center gap-1">
                <Crown className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                {person1Label}
              </span>
              <span className="text-[var(--color-aurora-yellow)] font-bold">{winnerScore}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${winnerScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-full"
              />
            </div>
          </div>
          <div className="text-2xl font-bold">VS</div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold flex items-center gap-1">
                <Skull className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                {person2Label}
              </span>
              <span className="text-[var(--color-aurora-salmon)] font-bold">{loserScore}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${loserScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[var(--color-aurora-salmon)] to-[var(--color-aurora-pink)] rounded-full"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/10 rounded-xl">
          <p className="text-sm italic flex items-start gap-2">
            <Quote className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--color-aurora-pink)]" />
            &quot;{result.ruling}&quot;
          </p>
        </div>
      </Card>

      {/* Official Certificate */}
      <div ref={certificateRef}>
        <Card className="overflow-hidden border-2 border-[var(--color-aurora-purple)]/30 bg-gradient-to-br from-[var(--color-aurora-cream)] to-white dark:from-[var(--color-aurora-violet)]/20 dark:to-[var(--color-aurora-violet)]/10">
          {/* Certificate Header */}
          <div className="bg-[var(--color-aurora-violet)] text-white p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] mb-1">Official Verdict</p>
            <h3 className="text-lg font-bold">The High Court of Aurora App</h3>
          </div>
          
          {/* Certificate Body */}
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)] mb-4">
              <Hash className="w-3 h-3" />
              <span>CASE NO. {result.caseNumber}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            
            <p className="text-sm text-[var(--muted-foreground)] mb-2">It is hereby declared that:</p>
            
            {/* Winner */}
            <div className="my-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)]">
                <Crown className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
                <span className="text-xl font-bold text-[var(--color-aurora-violet)]">{winnerName}</span>
                <span className="text-lg">👑</span>
              </div>
              <p className="text-sm font-semibold text-[var(--color-aurora-mint)] mt-2">IS RIGHT</p>
            </div>
            
            <p className="text-sm text-[var(--muted-foreground)]">and</p>
            
            {/* Loser */}
            <div className="my-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-aurora-salmon)]/10">
                <Skull className="w-6 h-6 text-[var(--color-aurora-salmon)]" />
                <span className="text-xl font-bold text-[var(--color-aurora-salmon)]">{loserName}</span>
                <span className="text-lg">💀</span>
              </div>
              <p className="text-sm font-semibold text-[var(--color-aurora-salmon)] mt-2">IS WRONG</p>
            </div>
            
            {/* Ruling */}
            <div className="my-6 p-4 bg-[var(--accent)] rounded-xl border border-[var(--border)]">
              <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">The Ruling</p>
              <p className="text-sm italic text-[var(--foreground)]">&quot;{result.ruling}&quot;</p>
            </div>
            
            {/* Signature */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="text-center">
                <Gavel className="w-8 h-8 mx-auto text-[var(--color-aurora-purple)] mb-1" />
                <p className="text-xs font-semibold text-[var(--foreground)]">Hon. AI</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Presiding AI Judge</p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-[var(--color-aurora-purple)] flex items-center justify-center bg-[var(--color-aurora-purple)]/10">
                <CheckCircle className="w-8 h-8 text-[var(--color-aurora-purple)]" />
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto text-[var(--color-aurora-mint)] mb-1" />
                <p className="text-xs font-semibold text-[var(--foreground)]">Verified</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Aurora App Seal</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <Card className="p-4 bg-[var(--card)] border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
            <span className="text-sm font-bold text-[var(--color-aurora-salmon)] uppercase tracking-wider">
              Red Flags Detected 🚩
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {result.redFlags.map((flag, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] hover:border-[var(--color-aurora-salmon)]/40 transition-colors">
                <span className="text-2xl mb-1">{flag.emoji}</span>
                <span className="text-xs font-medium text-center text-[var(--foreground)]">{flag.type}</span>
                <Badge className="mt-1 text-[8px] border-0" style={{ 
                  backgroundColor: flag.severity === "high" ? "var(--color-aurora-salmon)" : flag.severity === "medium" ? "var(--color-aurora-yellow)" : "var(--color-aurora-blue)",
                  color: "white"
                }}>
                  {flag.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* The Mic Drop */}
      {result.micDrop && (
        <Card className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-aurora-purple)]" />
            <span className="text-sm font-bold text-[var(--color-aurora-purple)]">The Mic Drop 🎤</span>
          </div>
          <p className="text-sm text-[var(--foreground)] italic bg-[var(--card)] p-3 rounded-xl border border-[var(--border)]">
            &quot;{result.micDrop}&quot;
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Copy this to end the conversation. You&apos;re welcome. 💅
          </p>
        </Card>
      )}

      {/* Healthy Tip */}
      <Card className="p-4 bg-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-mint)]/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-mint)] flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-[var(--color-aurora-violet)]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-aurora-violet)] uppercase tracking-wider mb-1">
              Aurora App Relationship Tip 💜
            </p>
            <p className="text-sm text-[var(--foreground)]">{result.healthyTip}</p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onShare} className="flex-1 h-12 rounded-xl bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white font-semibold">
          <Share2 className="w-4 h-4 mr-2" />
          Share Victory
        </Button>
        <Button onClick={onReset} variant="outline" className="flex-1 h-12 rounded-xl border-[var(--border)]">
          New Case
        </Button>
      </div>

      {/* Ad placement */}
      <LandingAd variant="native" className="my-4" />

      {/* Join CTA */}
      <Card className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Join Aurora App Community</p>
            <p className="text-xs text-white/80">Get more relationship insights & connect with others</p>
          </div>
          <ArrowRight className="w-5 h-5" />
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--accent)] text-xs text-[var(--muted-foreground)]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          This is for entertainment. For serious concerns, consult a professional. 
          If experiencing abuse, contact local support services. Made with 💜 by Aurora App.
        </p>
      </div>
    </motion.div>
  );
}

export default WhosRightPanel;
