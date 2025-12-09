"use client";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Briefcase, Shield, ArrowRight,
  Heart, Users, Star, Lock,
  Route, X, CheckCircle, Zap, Globe,
  ChevronRight, Brain, Smile, Ban, RefreshCw,
  HeartHandshake, Cpu, Network, Fingerprint,
  MapPin, Search, Droplets, Moon, Activity,
  MessageCircle, Flower2, AlertTriangle
} from "lucide-react";
import Link from "next/link";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { detectUserCountry, getRegionalPricing, formatRegionalPrice, getRegionalSavings, type RegionalPricing } from "@/lib/regional-pricing";
import { SignupIncentiveBanner } from "@/components/signup-incentive-banner";
import { LandingSearch } from "@/components/landing-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import { LandingPageAd } from "@/components/ads/adsense-unit";
import { AuroraShader } from "@/components/ui/aurora-shader";

// Wrapper component that provides locale context
export default function LandingPage() {
  return (
    <LocaleProvider>
      <LandingPageContent />
    </LocaleProvider>
  );
}

// Animated grid background component
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a710_1px,transparent_1px),linear-gradient(to_bottom,#5537a710_1px,transparent_1px)] bg-[size:60px_60px]" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffaf1]/50 to-[#fffaf1]" />
  </div>
);

// Floating orbs component
const FloatingOrbs = () => (
  <>
    <motion.div
      className="absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(85,55,167,0.15) 0%, transparent 70%)" }}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 30, 0],
        y: [0, -20, 0]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-40 left-[5%] w-[500px] h-[500px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(242,157,229,0.2) 0%, transparent 70%)" }}
      animate={{
        scale: [1.2, 1, 1.2],
        x: [0, -20, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(214,244,236,0.3) 0%, transparent 70%)" }}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
    />
  </>
);

// Glowing line component
const GlowingLine = ({ className = "" }: { className?: string }) => (
  <motion.div
    className={`h-px bg-gradient-to-r from-transparent via-[#5537a7] to-transparent ${className}`}
    animate={{ opacity: [0.3, 0.8, 0.3] }}
    transition={{ duration: 3, repeat: Infinity }}
  />
);

function LandingPageContent() {
  const { t, locale } = useLocale();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [regionalPricing, setRegionalPricing] = useState<RegionalPricing | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  // Removed opacity fade - keep hero always visible
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

  // Detect user country and get regional pricing
  useEffect(() => {
    const country = detectUserCountry();
    const pricing = getRegionalPricing(country);
    setRegionalPricing(pricing);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400 && !dismissedPrompt) setShowSignupPrompt(true);
    };
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dismissedPrompt]);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((prev) => (prev + 1) % 7), 4000);
    return () => clearInterval(interval);
  }, []);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  const toxicVsAurora = [
    { toxic: "Algorithms maximizing anger", aurora: "AI designed to uplift", icon: Brain },
    { toxic: "Endless doom-scrolling", aurora: "Mindful engagement", icon: RefreshCw },
    { toxic: "Fake perfection culture", aurora: "Authentic connections", icon: HeartHandshake },
    { toxic: "Harassment & toxicity", aurora: "Safe moderated space", icon: Shield },
    { toxic: "Data sold to advertisers", aurora: "Privacy-first architecture", icon: Lock },
    { toxic: "Mental health damage", aurora: "Wellbeing by design", icon: Smile }
  ];

  const features = [
    { id: 0, icon: Shield, title: "Safety Intelligence", subtitle: "AI-Powered Protection", desc: "Real-time safety ratings powered by community intelligence and machine learning.", color: "#f29de5", stats: "50K+ ratings" },
    { id: 1, icon: Route, title: "Safe Routes", subtitle: "Smart Navigation", desc: "GPS-tracked routes with live safety scores and real-time journey sharing.", color: "#5537a7", stats: "25K+ routes" },
    { id: 2, icon: Users, title: "Support Circles", subtitle: "Encrypted Communities", desc: "Private, encrypted communities with AI-moderated safe spaces.", color: "#5537a7", stats: "5K+ circles" },
    { id: 3, icon: Briefcase, title: "Opportunities", subtitle: "Career Intelligence", desc: "AI-matched job listings and mentorship from verified professionals.", color: "#e5e093", stats: "2K+ jobs" },
    { id: 4, icon: Heart, title: "Wellness Hub", subtitle: "Health Tracking", desc: "Track your cycle, hydration, mood, and meditation. AI insights for your health evolution.", color: "#f29de5", stats: "Daily tracking" },
    { id: 5, icon: Sparkles, title: "Aurora AI", subtitle: "Your AI Companion", desc: "Personal AI assistant that understands you. Get support, advice, and companionship 24/7.", color: "#c9cef4", stats: "Always here" },
    { id: 6, icon: AlertTriangle, title: "Panic Button", subtitle: "Emergency Response", desc: "One-tap emergency alert with offline support. Notifies your trusted contacts instantly.", color: "#ec4c28", stats: "Works offline" }
  ];

  const stats = [
    { value: "10K+", label: "Protected", icon: Users },
    { value: "50K+", label: "Reports", icon: Shield },
    { value: "25K+", label: "Routes", icon: Route },
    { value: "98%", label: "Safer", icon: Heart }
  ];

  const testimonials = [
    { quote: "Aurora App's AI actually understands what content helps me. After years of toxic feeds, this feels revolutionary.", name: "Sarah M.", role: "Engineer", location: "San Francisco", avatar: "👩‍💻", highlight: "revolutionary" },
    { quote: "The workplace safety intelligence saved me from a toxic job. The AI analysis was spot-on.", name: "María L.", role: "Director", location: "Bogotá", avatar: "👩‍💼", highlight: "AI analysis" },
    { quote: "Finally, an algorithm that doesn't exploit my emotions. My screen time is down 60% and I feel better.", name: "Priya S.", role: "Analyst", location: "Mumbai", avatar: "👩‍🔬", highlight: "60%" },
    { quote: "The panic button's offline AI is incredible. Real safety tech, not just marketing.", name: "Emma C.", role: "Student", location: "London", avatar: "👩‍🎓", highlight: "offline AI" }
  ];

  return (
    <div className="min-h-screen bg-[#fffaf1] overflow-x-hidden force-light-theme">
      {/* Cursor glow effect */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden lg:block"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(85,55,167,0.06), transparent 40%)`
        }}
      />

      {/* Error Message */}
      {error === "user_not_found" && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#f05a6b] rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-white font-semibold">⚠️ Session Expired</p>
            <p className="text-white/90 text-sm">Please sign in again.</p>
          </div>
        </motion.div>
      )}

      {/* Mobile Signup Prompt */}
      <AnimatePresence>
        {showSignupPrompt && !dismissedPrompt && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <Card className="bg-[#3d0d73]/95 backdrop-blur-xl border border-[#5537a7]/30 p-4 shadow-2xl rounded-2xl">
              <button onClick={() => setDismissedPrompt(true)} className="absolute top-2 right-2 text-white/60 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#5537a7] to-[#f29de5] rounded-xl flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Next-Gen Social Network</h4>
                  <p className="text-white/70 text-xs">Join 10,000+ women</p>
                </div>
                <Link href="/api/auth/login">
                  <Button size="sm" className="bg-white text-[#5537a7] hover:bg-white/90 font-bold rounded-xl min-h-[44px] px-5">Join</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futuristic Navbar */}
      <nav className="sticky top-0 z-40 bg-[#fffaf1]/80 backdrop-blur-xl border-b border-[#5537a7]/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={44} height={44} className="rounded-xl" />
                <motion.div className="absolute -inset-1 bg-gradient-to-r from-[#5537a7] to-[#f29de5] rounded-xl opacity-30 blur-sm -z-10" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
              <span className="text-lg font-bold text-[#3d0d73] hidden sm:block">Aurora App</span>
              <Badge className="hidden sm:flex bg-gradient-to-r from-[#5537a7]/10 to-[#f29de5]/10 text-[#5537a7] border-[#5537a7]/20 text-xs">v2.0</Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Switcher - Non-disruptive */}
              <LanguageSwitcher variant="compact" />

              <Link href="/api/auth/login?provider=GoogleOAuth" className="hidden md:block">
                <Button variant="outline" className="text-[#3d0d73] border-[#3d0d73]/20 hover:bg-[#5537a7]/5 rounded-xl font-medium min-h-[44px] px-4 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in
                </Button>
              </Link>
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-5 min-h-[44px] font-semibold shadow-lg shadow-[#5537a7]/20">
                  <span className="hidden sm:inline">Join Free</span>
                  <span className="sm:hidden">Join</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>


      {/* LIVE SEARCH - Primary Entry Point - Start Engaging Immediately */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#fffaf1] to-white relative overflow-hidden">
        {/* Aurora Shader Background for Visual Impact */}
        <div className="absolute inset-0 z-0">
          <AuroraShader className="w-full h-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#fffaf1]/90 via-[#fffaf1]/70 to-white/90" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a708_1px,transparent_1px),linear-gradient(to_bottom,#5537a708_1px,transparent_1px)] bg-[size:40px_40px]" />
        <FloatingOrbs />
        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 mb-4 px-4 py-1.5 text-sm font-medium">
              <Search className="w-3 h-3 mr-1 inline" /> Explore Before You Join
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-[#3d0d73] mb-4">
              Discover What Women Are Sharing
            </h2>
            <p className="text-[#3d0d73]/60 text-lg max-w-2xl mx-auto">
              Search our community for safety tips, career opportunities, support circles, and more.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <LandingSearch />
          </motion.div>

          {/* AdSense - Between search and stats */}
          <LandingPageAd className="mt-12" />
        </div>
      </section>

      {/* HERO SECTION - Join the Community */}
      <section ref={heroRef} className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-b from-white to-[#fffaf1]">
        {/* Fallback/Enhancement layers */}
        <GridBackground />

        <motion.div style={{ scale: heroScale }} className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Futuristic Badge */}
            <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 bg-[#3d0d73]/5 backdrop-blur-sm border border-[#5537a7]/20 rounded-full px-4 py-2 shadow-lg">
                <motion.div className="w-2 h-2 bg-[#22c55e] rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <span className="text-sm font-medium text-[#3d0d73]">
                  <span className="text-[#5537a7] font-bold">AI-Powered</span> • Non-Toxic Algorithm
                </span>
                <Cpu className="w-4 h-4 text-[#5537a7]" />
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#3d0d73] mb-6 leading-[1.05]" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              {t('landing.hero.title1')}{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#5537a7] via-[#f29de5] to-[#5537a7] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  {t('landing.hero.title2')}
                </span>
              </span>
              {" "}
              <br />
              {t('landing.hero.title3')}
            </motion.h1>

            {/* Subheadline */}
            <motion.p className="text-lg sm:text-xl md:text-2xl text-[#3d0d73]/70 mb-8 max-w-3xl mx-auto leading-relaxed" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              {t('landing.hero.subtitle')}
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              {t('landing.hero.subtitle2')}
            </motion.p>

            {/* Tech Pills */}
            <motion.div className="flex flex-wrap justify-center gap-2 mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              {[
                { icon: Brain, text: "Ethical AI", color: "#5537a7" },
                { icon: Shield, text: "Privacy-First", color: "#22c55e" },
                { icon: Network, text: "Decentralized Safety", color: "#5537a7" },
                { icon: Fingerprint, text: "Zero Data Sales", color: "#f29de5" }
              ].map((item, i) => (
                <motion.div key={item.text} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-[#3d0d73] shadow-sm border border-[#3d0d73]/10 hover:border-[#5537a7]/30 transition-all hover:shadow-md cursor-default">
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  {item.text}
                </motion.div>
              ))}
            </motion.div>

            {/* APPLE-STYLE SIGN IN - Super Clear SSO Buttons */}
            <motion.div className="max-w-md mx-auto mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
              {/* Clear instruction */}
              <p className="text-center text-[#3d0d73]/70 text-lg mb-4 font-medium">
                {t('landing.hero.joinInstantly')}
              </p>
              <p className="text-center text-[#3d0d73]/70 text-sm mb-6">
                {t('landing.hero.noPassword')}
              </p>

              {/* SSO Buttons - Apple Style */}
              <div className="space-y-3">
                <Link href="/api/auth/login?provider=GoogleOAuth" className="block">
                  <Button size="lg" className="w-full bg-white hover:bg-gray-50 text-[#3d0d73] rounded-2xl min-h-[60px] font-semibold text-lg shadow-lg border border-[#3d0d73]/10 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t('landing.hero.continueGoogle')}
                  </Button>
                </Link>

                <Link href="/api/auth/login?provider=MicrosoftOAuth" className="block">
                  <Button size="lg" className="w-full bg-white hover:bg-gray-50 text-[#3d0d73] rounded-2xl min-h-[60px] font-semibold text-lg shadow-lg border border-[#3d0d73]/10 transition-all hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#00A4EF" d="M1 13h10v10H1z" />
                      <path fill="#7FBA00" d="M13 1h10v10H13z" />
                      <path fill="#FFB900" d="M13 13h10v10H13z" />
                    </svg>
                    {t('landing.hero.continueMicrosoft')}
                  </Button>
                </Link>

                <Link href="/api/auth/login" className="block">
                  <Button size="lg" variant="outline" className="w-full border-2 border-[#3d0d73]/20 text-[#3d0d73] hover:bg-[#3d0d73]/5 rounded-2xl min-h-[56px] font-medium text-base transition-all">
                    More sign in options
                  </Button>
                </Link>
              </div>

              {/* Trust message */}
              <p className="text-center text-[#3d0d73]/60 text-sm mt-4">
                🔒 We never post without your permission
              </p>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div className="flex flex-wrap justify-center gap-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
              {[
                { icon: CheckCircle, text: "Free Safety Features" },
                { icon: Lock, text: "No Password Needed" },
                { icon: Zap, text: "Join in 10 Seconds" }
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-2 text-[#3d0d73]/60 text-sm">
                  <item.icon className="w-4 h-4 text-[#22c55e]" />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar - Futuristic */}
      <section className="relative py-6 sm:py-8 bg-[#3d0d73] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a720_1px,transparent_1px)] bg-[size:40px_40px]" />
        <GlowingLine className="absolute top-0 left-0 right-0" />
        <GlowingLine className="absolute bottom-0 left-0 right-0" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-[#f29de5] opacity-70" />
                  <p className="text-lg sm:text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                </div>
                <p className="text-white/50 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* WHY AURORA APP - Clean Comparison Table */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3d0d73] mb-4">
                Why Women Choose{" "}
                <span className="text-[#5537a7]">Aurora App</span>
              </h2>
              <p className="text-[#3d0d73]/70 text-lg max-w-2xl mx-auto">
                We built the opposite of toxic social media.
              </p>
            </motion.div>
          </div>

          {/* Clean Comparison Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl shadow-xl border border-[#3d0d73]/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 bg-[#3d0d73]">
              <div className="p-4 md:p-6 text-center border-r border-white/10">
                <p className="text-white/70 text-sm font-medium">❌ Other Platforms</p>
              </div>
              <div className="p-4 md:p-6 text-center">
                <p className="text-white text-sm font-bold">✨ Aurora App</p>
              </div>
            </div>

            {/* Rows */}
            {toxicVsAurora.map((item, i) => (
              <div key={i} className={`grid grid-cols-2 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fffaf1]'}`}>
                <div className="p-4 md:p-5 border-r border-[#3d0d73]/10 flex items-center gap-3">
                  <Ban className="w-5 h-5 text-[#f05a6b] flex-shrink-0" />
                  <p className="text-[#3d0d73]/70 text-sm md:text-base">{item.toxic}</p>
                </div>
                <div className="p-4 md:p-5 flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
                  <p className="text-[#3d0d73] text-sm md:text-base font-medium">{item.aurora}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div className="text-center mt-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button size="lg" className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-2xl px-10 min-h-[56px] font-bold shadow-xl shadow-[#5537a7]/20">
                Join Aurora App Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURES - Futuristic Cards */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#fffaf1] to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0"><GlowingLine /></div>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-[#5537a7]/10 text-[#5537a7] border-[#5537a7]/20 mb-4 px-4 py-1.5 text-sm font-medium">
                <Cpu className="w-3 h-3 mr-1 inline" /> Core Technology
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-[#3d0d73] mb-4">
                Powered by{" "}
                <span className="bg-gradient-to-r from-[#5537a7] to-[#3d0d73] bg-clip-text text-transparent">Ethical AI</span>
              </h2>
              <p className="text-[#3d0d73]/60 text-lg max-w-2xl mx-auto">
                Every feature designed with your safety and wellbeing as the primary objective.
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left column - scrollable feature list */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin">
              {features.map((feature, i) => (
                <motion.div key={feature.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveFeature(i)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${activeFeature === i
                      ? "border-[#5537a7]/50 bg-gradient-to-r from-[#5537a7]/10 to-transparent shadow-lg shadow-[#5537a7]/10"
                      : "border-[#3d0d73]/10 hover:border-[#5537a7]/30 bg-white/50"
                    }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${activeFeature === i
                        ? feature.title === "Panic Button"
                          ? "bg-gradient-to-br from-[#ec4c28] to-[#f05a6b] shadow-lg"
                          : "bg-gradient-to-br from-[#5537a7] to-[#3d0d73] shadow-lg"
                        : "bg-[#3d0d73]/5"
                      }`}>
                      <feature.icon className={`w-5 h-5 transition-colors ${activeFeature === i ? "text-white" : "text-[#3d0d73]/50"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h3 className="font-bold text-[#3d0d73] text-sm">{feature.title}</h3>
                        <Badge className="text-xs border-0 bg-[#3d0d73]/5 text-[#3d0d73]/70 flex-shrink-0">{feature.stats}</Badge>
                      </div>
                      <p className="text-[#5537a7] text-xs font-medium">{feature.subtitle}</p>
                      {activeFeature === i && <p className="text-[#3d0d73]/60 text-xs mt-2">{feature.desc}</p>}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all flex-shrink-0 ${activeFeature === i ? "text-[#5537a7] rotate-90" : "text-[#3d0d73]/30"}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right column - feature preview */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative flex items-center justify-center">
              <div className={`rounded-3xl p-8 md:p-10 relative overflow-hidden transition-all duration-500 ${activeFeature === 6
                  ? "bg-gradient-to-br from-[#ec4c28] to-[#f05a6b]"
                  : activeFeature === 4
                    ? "bg-gradient-to-br from-[#f29de5] to-[#5537a7]"
                    : activeFeature === 5
                      ? "bg-gradient-to-br from-[#c9cef4] to-[#5537a7]"
                      : "bg-gradient-to-br from-[#3d0d73] to-[#5537a7]"
                }`}>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:30px_30px]" />
                <AnimatePresence mode="wait">
                  <motion.div key={activeFeature} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="relative text-center">
                    <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl ${activeFeature === 6 ? "bg-white/20" : "bg-white/10"
                      }`}>
                      {activeFeature === 0 && <Shield className="w-10 h-10 text-white" />}
                      {activeFeature === 1 && <Route className="w-10 h-10 text-white" />}
                      {activeFeature === 2 && <Users className="w-10 h-10 text-white" />}
                      {activeFeature === 3 && <Briefcase className="w-10 h-10 text-white" />}
                      {activeFeature === 4 && <Heart className="w-10 h-10 text-white" />}
                      {activeFeature === 5 && <Sparkles className="w-10 h-10 text-white" />}
                      {activeFeature === 6 && <AlertTriangle className="w-10 h-10 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{features[activeFeature].title}</h3>
                    <p className="text-white/70 mb-4 max-w-sm mx-auto text-sm">{features[activeFeature].desc}</p>

                    {/* Feature-specific highlights */}
                    {activeFeature === 4 && (
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {["Cycle Tracking", "Hydration", "Mood", "Meditation"].map((item) => (
                          <Badge key={item} className="bg-white/20 text-white border-0 text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                    {activeFeature === 5 && (
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {["24/7 Support", "Health Insights", "Personalized"].map((item) => (
                          <Badge key={item} className="bg-white/20 text-white border-0 text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                    {activeFeature === 6 && (
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {["One Tap", "Offline Ready", "GPS Location"].map((item) => (
                          <Badge key={item} className="bg-white/20 text-white border-0 text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}

                    <Link href="/api/auth/login">
                      <Button className={`rounded-xl px-6 min-h-[48px] font-semibold ${activeFeature === 6
                          ? "bg-white text-[#ec4c28] hover:bg-white/90"
                          : "bg-white text-[#5537a7] hover:bg-white/90"
                        }`}>
                        Try {features[activeFeature].title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* TESTIMONIALS - Futuristic */}
      <section className="py-20 md:py-28 bg-[#3d0d73] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a715_1px,transparent_1px),linear-gradient(to_bottom,#5537a715_1px,transparent_1px)] bg-[size:50px_50px]" />
        <FloatingOrbs />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-white/10 text-white border-white/20 mb-4 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                💜 Community Voices
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Women Who Made the Switch
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Real stories from women who escaped toxic platforms.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-[#e5e093] text-[#e5e093]" />)}
                </div>
                <p className="text-white/90 leading-relaxed mb-6">
                  "{t.quote.split(t.highlight).map((part, idx, arr) => (
                    <span key={idx}>{part}{idx < arr.length - 1 && <span className="text-[#f29de5] font-semibold">{t.highlight}</span>}</span>
                  ))}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5537a7] to-[#f29de5] flex items-center justify-center text-2xl shadow-lg">{t.avatar}</div>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-white/50 text-sm">{t.role} • {t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM - Futuristic */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-[#fffaf1] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a705_1px,transparent_1px),linear-gradient(to_bottom,#5537a705_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-gradient-to-r from-[#e5e093]/30 to-[#f29de5]/30 text-[#3d0d73] border-[#e5e093]/50 mb-4 px-4 py-1.5 text-sm font-bold">
                <Sparkles className="w-3 h-3 mr-1 inline" /> Premium
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-[#3d0d73] mb-4">
                Unlock{" "}
                <span className="bg-gradient-to-r from-[#e5e093] to-[#f29de5] bg-clip-text text-transparent">Full Power</span>
              </h2>
              <p className="text-[#3d0d73]/60 text-lg max-w-2xl mx-auto">
                Go premium for unlimited access. Support the mission.
              </p>
            </motion.div>
          </div>

          {/* Regional Pricing Indicator */}
          {regionalPricing && regionalPricing.multiplier < 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-2 mb-8 p-3 rounded-xl bg-[#d6f4ec]/50 border border-[#22c55e]/20"
            >
              <MapPin className="w-4 h-4 text-[#5537a7]" />
              <span className="text-sm text-[#3d0d73]">
                Special pricing for <span className="font-semibold">{regionalPricing.countryName}</span>
              </span>
              <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 text-xs">
                Save {getRegionalSavings(regionalPricing)}%
              </Badge>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Plus",
                tier: "plus",
                basePrice: 5,
                features: ["Ad-free", "100 AI/day", "100 credits"],
                badge: "Popular"
              },
              {
                name: "Pro",
                tier: "pro",
                basePrice: 12,
                features: ["Unlimited AI", "Priority support", "500 credits"],
                badge: "Best Value",
                highlighted: true
              },
              {
                name: "Elite",
                tier: "elite",
                basePrice: 25,
                features: ["VIP events", "1-on-1 consults", "1500 credits"],
                badge: "VIP"
              }
            ].map((tier, i) => {
              const price = regionalPricing
                ? regionalPricing.subscriptions[tier.tier as keyof typeof regionalPricing.subscriptions].monthly
                : tier.basePrice;
              const displayPrice = regionalPricing
                ? formatRegionalPrice(price, regionalPricing)
                : `$${tier.basePrice}`;

              return (
                <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-6 backdrop-blur-sm ${tier.highlighted ? "bg-gradient-to-br from-[#3d0d73] to-[#5537a7] text-white shadow-2xl shadow-[#5537a7]/30 scale-105 border border-[#5537a7]/50" : "bg-white/80 border border-[#3d0d73]/10"}`}>
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${tier.highlighted ? "bg-[#e5e093] text-[#3d0d73]" : "bg-[#5537a7]/10 text-[#5537a7]"} border-0 px-3 py-1`}>{tier.badge}</Badge>
                  <div className="text-center mb-6 pt-4">
                    <h3 className={`font-bold text-xl mb-2 ${tier.highlighted ? "text-white" : "text-[#3d0d73]"}`}>Aurora {tier.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-4xl font-black ${tier.highlighted ? "text-white" : "text-[#3d0d73]"}`}>{displayPrice}</span>
                      <span className={tier.highlighted ? "text-white/70" : "text-[#3d0d73]/50"}>/mo</span>
                    </div>
                    {regionalPricing && regionalPricing.multiplier < 1 && (
                      <p className={`text-xs mt-1 ${tier.highlighted ? "text-white/50" : "text-[#3d0d73]/40"}`}>
                        <span className="line-through">${tier.basePrice}</span> USD
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${tier.highlighted ? "text-[#e5e093]" : "text-[#22c55e]"}`} />
                        <span className={`text-sm ${tier.highlighted ? "text-white/90" : "text-[#3d0d73]/70"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/api/auth/login?returnTo=/premium?tier=${tier.tier}`}>
                    <Button className={`w-full min-h-[48px] rounded-xl font-semibold ${tier.highlighted ? "bg-white text-[#3d0d73] hover:bg-white/90" : "bg-[#5537a7] text-white hover:bg-[#3d0d73]"}`}>
                      Get {tier.name}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div className="text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-[#d6f4ec]/50 text-[#3d0d73] px-6 py-3 rounded-full border border-[#22c55e]/20">
              <Shield className="w-5 h-5 text-[#22c55e]" />
              <span className="font-medium">Safety features are <span className="font-bold">always free</span></span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* FINAL CTA - Futuristic */}
      <section className="py-20 md:py-28 bg-[#fffaf1] relative overflow-hidden">
        <GridBackground />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-8 relative">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={80} height={80} className="rounded-3xl shadow-2xl" />
              <motion.div className="absolute -inset-2 bg-gradient-to-r from-[#5537a7] to-[#f29de5] rounded-3xl opacity-30 blur-lg -z-10" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold text-[#3d0d73] mb-6">
              Ready for the{" "}
              <span className="bg-gradient-to-r from-[#5537a7] to-[#f29de5] bg-clip-text text-transparent">Future</span>?
            </h2>

            <p className="text-[#3d0d73]/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Join 10,000+ women who chose a healthier digital life. Zero toxicity. Real community.
            </p>

            <motion.div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#5537a7]/10 to-[#f29de5]/10 border border-[#5537a7]/20 rounded-2xl px-6 py-4 mb-8 backdrop-blur-sm" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Cpu className="w-8 h-8 text-[#5537a7]" />
              <div className="text-left">
                <p className="font-bold text-[#3d0d73]">AI That Cares</p>
                <p className="text-sm text-[#3d0d73]/70">Non-toxic algorithm • Privacy-first • Ethical by design</p>
              </div>
            </motion.div>

            {/* Apple-Style SSO Buttons */}
            <div className="max-w-sm mx-auto space-y-3 mb-8">
              <p className="text-center text-[#3d0d73]/60 text-sm mb-4">Join instantly — no password needed</p>

              <Link href="/api/auth/login?provider=GoogleOAuth" className="block">
                <Button size="lg" className="w-full bg-white hover:bg-gray-50 text-[#3d0d73] rounded-2xl min-h-[56px] font-semibold shadow-lg border border-[#3d0d73]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </Link>

              <Link href="/api/auth/login?provider=MicrosoftOAuth" className="block">
                <Button size="lg" className="w-full bg-white hover:bg-gray-50 text-[#3d0d73] rounded-2xl min-h-[56px] font-semibold shadow-lg border border-[#3d0d73]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#00A4EF" d="M1 13h10v10H1z" />
                    <path fill="#7FBA00" d="M13 1h10v10H13z" />
                    <path fill="#FFB900" d="M13 13h10v10H13z" />
                  </svg>
                  Continue with Microsoft
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#3d0d73]/50">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22c55e]" />No password needed</span>
              <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-[#22c55e]" />We never post for you</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#22c55e]" />Join in 10 seconds</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER - Futuristic */}
      <footer className="border-t border-[#5537a7]/10 bg-[#fffaf1] py-12 relative">
        <div className="absolute top-0 left-0 right-0"><GlowingLine /></div>
        <div className="max-w-6xl mx-auto px-4">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
            {/* Brand Column - spans 2 on mobile, full width intro */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={44} height={44} className="rounded-xl" />
                <span className="text-lg font-bold text-[#3d0d73]">Aurora App</span>
                <Badge className="bg-[#5537a7]/10 text-[#5537a7] border-[#5537a7]/20 text-xs">v2.0</Badge>
              </div>
              <p className="text-[#3d0d73]/60 text-sm mb-4 max-w-sm">
                The future of social networking. Non-toxic AI. Privacy-first. Built by women, for women.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 text-xs"><Cpu className="w-3 h-3 mr-1 inline" />Ethical AI</Badge>
                <Badge className="bg-[#f29de5]/20 text-[#5537a7] border-0 text-xs">💜 Women-First</Badge>
                <Badge className="bg-[#5537a7]/10 text-[#5537a7] border-0 text-xs"><Shield className="w-3 h-3 mr-1 inline" />Safety-First</Badge>
              </div>
            </div>

            {/* Safety Column */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-3 text-sm">Safety</h4>
              <ul className="space-y-2 text-sm text-[#3d0d73]/60">
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Safety Intelligence</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Safe Routes</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Panic Button</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Safety Check-ins</li>
              </ul>
            </div>

            {/* Wellness Column */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-3 text-sm">Wellness</h4>
              <ul className="space-y-2 text-sm text-[#3d0d73]/60">
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Cycle Tracking</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Hydration</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Mood Journal</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Meditation</li>
              </ul>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-3 text-sm">Community</h4>
              <ul className="space-y-2 text-sm text-[#3d0d73]/60">
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Support Circles</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Aurora AI</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Sister Network</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Mentorship</li>
              </ul>
            </div>

            {/* Opportunities Column */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-3 text-sm">Opportunities</h4>
              <ul className="space-y-2 text-sm text-[#3d0d73]/60">
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Job Matching</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Career Growth</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Credit Economy</li>
                <li className="hover:text-[#5537a7] transition-colors cursor-default">Financial Tools</li>
              </ul>
            </div>
          </div>

          {/* Legal Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-6 border-t border-[#5537a7]/10 text-sm text-[#3d0d73]/60">
            <Link href="/legal/privacy" className="hover:text-[#5537a7] transition-colors">Privacy Policy</Link>
            <span className="hidden sm:inline text-[#5537a7]/20">•</span>
            <Link href="/legal/terms" className="hover:text-[#5537a7] transition-colors">Terms of Service</Link>
            <span className="hidden sm:inline text-[#5537a7]/20">•</span>
            <Link href="/legal/cookies" className="hover:text-[#5537a7] transition-colors">Cookie Policy</Link>
            <span className="hidden sm:inline text-[#5537a7]/20">•</span>
            <Link href="/legal/community" className="hover:text-[#5537a7] transition-colors">Community Guidelines</Link>
          </div>
          <div className="border-t border-[#5537a7]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#3d0d73]/50">© 2024 Aurora App. Made with 💜 for women everywhere.</p>
            <div className="flex items-center gap-4 text-sm text-[#3d0d73]/50">
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" />Worldwide</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" />GDPR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Signup Incentive Banner - follows user while scrolling */}
      <SignupIncentiveBanner credits={25} showAfterScroll={300} />
    </div>
  );
}
