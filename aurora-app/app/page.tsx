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
  MessageCircle, Flower2, AlertTriangle, ChevronDown,
  Building2, Wine, Plane, Calendar, Clock, Check
} from "lucide-react";
import Link from "next/link";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { detectUserCountry, getRegionalPricing, formatRegionalPrice, getRegionalSavings, type RegionalPricing } from "@/lib/regional-pricing";
import { SignupIncentiveBanner } from "@/components/signup-incentive-banner";
import { LandingSearch } from "@/components/landing-search";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import { LandingPageAd } from "@/components/ads/adsense-unit";

// Wrapper component that provides locale context
export default function LandingPage() {
  return (
    <LocaleProvider>
      <LandingPageContent />
    </LocaleProvider>
  );
}

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-[#3d0d73]/10 last:border-b-0">
    <button
      onClick={onClick}
      className="w-full py-5 md:py-6 flex items-center justify-between text-left group"
    >
      <span className="text-base md:text-lg font-medium text-[#3d0d73] group-hover:text-[#5537a7] transition-colors pr-4">
        {question}
      </span>
      <ChevronDown 
        className={`w-5 h-5 text-[#5537a7] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="pb-5 md:pb-6 text-[#3d0d73]/70 text-sm md:text-base leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

function LandingPageContent() {
  const { t, locale } = useLocale();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [regionalPricing, setRegionalPricing] = useState<RegionalPricing | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [dismissedPrompt]);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((prev) => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, []);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  // Features for the 3-card showcase (inspired by Helm)
  const showcaseFeatures = [
    {
      id: 0,
      title: "Real-Time Safety Intelligence",
      description: "See every safety report, every route, and every community insight at a glance across your entire network.",
      image: "/screenshots/safety-map.png",
      gradient: "from-[#f29de5]/20 to-[#5537a7]/10",
      stats: "50K+ Safety Reports"
    },
    {
      id: 1,
      title: "Staff with Confidence",
      description: "Connect with verified professionals, assign trusted guides, and sync with your team - all without leaving Aurora.",
      image: "/screenshots/circles.png",
      gradient: "from-[#c9cef4]/30 to-[#5537a7]/10",
      stats: "5K+ Verified Guides"
    },
    {
      id: 2,
      title: "Plugs Into Your Stack",
      description: "Connect your booking platform in minutes. Data flows in from anywhere, stays in sync, always - no manual entry.",
      image: "/screenshots/integrations.png",
      gradient: "from-[#d6f4ec]/30 to-[#5537a7]/10",
      stats: "15+ Integrations"
    }
  ];

  // Core features grid
  const coreFeatures = [
    { icon: Shield, title: "Safety Intelligence", desc: "AI-powered real-time safety ratings", color: "#f29de5" },
    { icon: Route, title: "Safe Routes", desc: "GPS-tracked journeys with live sharing", color: "#5537a7" },
    { icon: Users, title: "Support Circles", desc: "Encrypted private communities", color: "#c9cef4" },
    { icon: Briefcase, title: "Opportunities", desc: "AI-matched career listings", color: "#e5e093" },
    { icon: Heart, title: "Wellness Hub", desc: "Cycle, mood & health tracking", color: "#f29de5" },
    { icon: AlertTriangle, title: "Panic Button", desc: "One-tap emergency alerts", color: "#ec4c28" }
  ];

  // FAQ Data
  const faqs = [
    {
      question: "How does Aurora App help tourism businesses?",
      answer: "Aurora App provides real-time safety intelligence that helps tourism operators ensure their guests' safety. From route planning to emergency response, we give you the tools to build trust with your customers and differentiate your business."
    },
    {
      question: "Is Aurora App suitable for bars and nightlife venues?",
      answer: "Absolutely. Our platform includes features specifically designed for nightlife safety - from safe route home planning to panic button functionality. Venues can integrate our safety features to show customers they prioritize their wellbeing."
    },
    {
      question: "What makes Aurora different from other safety apps?",
      answer: "Aurora is built by women, for women - but benefits everyone. Our AI is designed to be ethical and non-toxic, we never sell data to advertisers, and our safety features work offline. Plus, we offer B2B integrations for businesses."
    },
    {
      question: "How does the pricing work for businesses?",
      answer: "We offer flexible plans starting with a free tier for small operations. Growth and Pro plans include more team seats, API access, and priority support. Enterprise clients get unlimited seats and dedicated support. Contact us for custom pricing."
    },
    {
      question: "Can I integrate Aurora with my existing systems?",
      answer: "Yes. Aurora offers API access on Growth plans and above, with custom integrations available for Enterprise clients. We can connect with booking systems, CRM platforms, and communication tools."
    },
    {
      question: "Is Aurora App free to use?",
      answer: "Core safety features are always free for individual users. We believe safety should be accessible to everyone. Premium features like unlimited AI assistance and advanced analytics are available through our subscription plans."
    }
  ];

  // Testimonial data
  const testimonials = [
    { 
      quote: "Safety is a human right. We believe good software should protect, not exploit. Most apps used today do the opposite of helping. Aurora was created to fix this.", 
      name: "The Aurora Team", 
      role: "Founders",
      highlight: "protect, not exploit"
    }
  ];

  // Stats
  const stats = [
    { value: "10K+", label: "Protected Users" },
    { value: "50K+", label: "Safety Reports" },
    { value: "25K+", label: "Safe Routes" },
    { value: "98%", label: "Feel Safer" }
  ];

  return (
    <div className="min-h-screen bg-[#fffaf1] overflow-x-hidden force-light-theme">
      {/* Error Message */}
      {error === "user_not_found" && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#f05a6b] rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-white font-semibold">Session Expired</p>
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
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Safety-First Platform</h4>
                  <p className="text-white/70 text-xs">Join 10,000+ protected users</p>
                </div>
                <Link href="/api/auth/login">
                  <Button size="sm" className="bg-[#f29de5] text-[#3d0d73] hover:bg-[#f29de5]/90 font-bold rounded-xl min-h-[44px] px-5">Join</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          BRUTALIST NAVBAR - Clean & Structured
          ============================================ */}
      <nav className="sticky top-0 z-40 bg-[#3d0d73] border-b-4 border-[#5537a7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={40} height={40} className="rounded-lg" />
              </div>
              <span className="text-lg md:text-xl font-black text-white tracking-tight">Aurora</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-white/80 hover:text-white font-medium transition-colors">Pricing</a>
              <a href="#faq" className="text-white/80 hover:text-white font-medium transition-colors">FAQ</a>
              <span className="text-white/30">|</span>
              <Link href="/api/auth/login">
                <span className="text-white/80 hover:text-white font-medium transition-colors cursor-pointer">Sign in</span>
              </Link>
              <Link href="/api/auth/login">
                <Button className="bg-[#f29de5] text-[#3d0d73] hover:bg-white font-bold rounded-none px-6 min-h-[44px] border-2 border-white/20">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile CTA */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/api/auth/login">
                <Button size="sm" className="bg-[#f29de5] text-[#3d0d73] hover:bg-white font-bold rounded-none px-4 min-h-[40px]">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================
          HERO SECTION - Brutalist Typography
          ============================================ */}
      <section ref={heroRef} className="relative bg-[#3d0d73] overflow-hidden">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a720_1px,transparent_1px),linear-gradient(to_bottom,#5537a720_1px,transparent_1px)] bg-[size:80px_80px]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#5537a7]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#f29de5]/10 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl">
            {/* Announcement Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-6 md:mb-8"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
                <span className="text-sm font-medium text-white">
                  Safety meets technology | <span className="text-[#f29de5]">Read more</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#f29de5]" />
              </div>
            </motion.div>

            {/* Main Headline - Brutalist Typography */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
            >
              Safety for people<br />
              who can&apos;t afford<br />
              <span className="text-[#f29de5]">to feel unsafe.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-white/70 mb-8 md:mb-10 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
            >
              From navigation to emergency response, <strong className="text-white">Aurora</strong> brings safety intelligence to your fingertips. So you can focus on living — not worrying.
            </motion.p>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
            >
              <Link href="/api/auth/login">
                <Button size="lg" className="bg-[#f29de5] text-[#3d0d73] hover:bg-white font-bold rounded-none px-8 md:px-10 min-h-[56px] md:min-h-[60px] text-base md:text-lg border-4 border-white/20 shadow-2xl">
                  Get started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Hero Image - App Preview */}
        <motion.div 
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-0 md:-mb-20 lg:-mb-32"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative bg-gradient-to-br from-[#f29de5]/30 via-[#c9cef4]/20 to-[#d6f4ec]/30 rounded-t-2xl md:rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
            {/* Browser Window Chrome */}
            <div className="bg-[#fffaf1] px-4 py-3 border-b border-[#3d0d73]/10 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#f05a6b]" />
                <div className="w-3 h-3 rounded-full bg-[#e5e093]" />
                <div className="w-3 h-3 rounded-full bg-[#d6f4ec]" />
              </div>
              <div className="flex-1 ml-4">
                <div className="bg-[#3d0d73]/5 rounded px-3 py-1 text-sm text-[#3d0d73]/50 font-mono max-w-xs">
                  app.aurorasafe.co
                </div>
              </div>
            </div>
            {/* App Screenshot Placeholder */}
            <div className="bg-[#fffaf1] aspect-[16/9] md:aspect-[16/8] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#5537a7] to-[#f29de5] rounded-2xl flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <p className="text-[#3d0d73]/60 text-sm">Safety Dashboard Preview</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============================================
          VALUE PROPOSITION - Stop Using Spreadsheets
          ============================================ */}
      <section className="py-20 md:py-32 bg-[#fffaf1] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 md:mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-black text-[#3d0d73] leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Stop managing safety from a{" "}
              <span className="inline-flex items-baseline gap-2">
                <span className="text-[#22c55e]">spreadsheet</span>
              </span>
              {" "}and a{" "}
              <span className="inline-flex items-baseline gap-2">
                <span className="text-[#25D366]">group chat</span>
              </span>
              —there&apos;s a better way.
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-[#3d0d73]/70 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <strong className="text-[#3d0d73]">Aurora</strong> replaces the patchwork of tools safety-conscious businesses rely on with one purpose-built platform for everything that happens when people need protection.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <Link href="/api/auth/login">
                <span className="inline-flex items-center gap-2 text-[#3d0d73] font-bold hover:text-[#5537a7] transition-colors cursor-pointer group">
                  Try Aurora for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* 3-Card Feature Showcase (Helm-inspired) */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6" id="features">
            {showcaseFeatures.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className={`bg-gradient-to-br ${feature.gradient} rounded-2xl overflow-hidden border-2 border-[#3d0d73]/5 hover:border-[#5537a7]/20 transition-all h-full`}>
                  {/* Feature Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#5537a7]/10 to-[#f29de5]/5 flex items-center justify-center p-6">
                    <div className="w-full h-full bg-white/80 rounded-lg shadow-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#5537a7] to-[#f29de5] rounded-xl flex items-center justify-center">
                          {i === 0 && <MapPin className="w-6 h-6 text-white" />}
                          {i === 1 && <Users className="w-6 h-6 text-white" />}
                          {i === 2 && <Network className="w-6 h-6 text-white" />}
                        </div>
                        <p className="text-xs text-[#3d0d73]/50">{feature.stats}</p>
                      </div>
                    </div>
                  </div>
                  {/* Feature Content */}
                  <div className="p-5 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-[#3d0d73] mb-2">{feature.title}</h3>
                    <p className="text-sm md:text-base text-[#3d0d73]/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          QUOTE SECTION - Elegant Serif Typography
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#3d0d73] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#5537a720_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Quote Mark */}
            <div className="text-[#f29de5] text-8xl md:text-9xl font-serif leading-none mb-4 md:mb-6">&ldquo;</div>
            
            {/* Quote Text - Elegant Serif */}
            <blockquote className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-serif italic leading-relaxed mb-8 md:mb-12">
              {testimonials[0].quote.split(testimonials[0].highlight).map((part, idx, arr) => (
                <span key={idx}>
                  {part}
                  {idx < arr.length - 1 && (
                    <span className="text-[#f29de5] not-italic font-bold">{testimonials[0].highlight}</span>
                  )}
                </span>
              ))}
            </blockquote>

            {/* Attribution */}
            <p className="text-white/60 text-base md:text-lg">
              — <span className="text-white font-medium">{testimonials[0].name}</span>, {testimonials[0].role}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION - Clean Brutalist Cards
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#3d0d73] relative overflow-hidden" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-white/60"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Start free. Scale when you&apos;re ready — no surprises.
            </motion.p>
          </div>

          {/* Regional Pricing Indicator */}
          {regionalPricing && regionalPricing.multiplier < 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-2 mb-8 p-3 rounded-none bg-[#d6f4ec]/20 border-2 border-[#d6f4ec]/30"
            >
              <MapPin className="w-4 h-4 text-[#d6f4ec]" />
              <span className="text-sm text-white">
                Special pricing for <span className="font-semibold">{regionalPricing.countryName}</span>
              </span>
              <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 text-xs rounded-none">
                Save {getRegionalSavings(regionalPricing)}%
              </Badge>
            </motion.div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[
              {
                name: "Free",
                description: "Get started with the essentials",
                tier: "plus",
                basePrice: 0,
                features: ["2 team seats", "250 notifications/mo", "Basic AI assistance", "Core safety features", "Mobile app", "Email support"],
                highlighted: false
              },
              {
                name: "Growth",
                description: "For growing organizations",
                tier: "pro",
                basePrice: 30,
                features: ["5 team seats included", "500 notifications/mo", "More AI usage", "API access", "Priority email support", "Everything in Free"],
                highlighted: true
              },
              {
                name: "Pro",
                description: "For established operations",
                tier: "elite",
                basePrice: 99,
                features: ["12 team seats included", "3,000 notifications/mo", "Unlimited AI usage", "Custom integrations", "Email + Slack support", "Everything in Growth"],
                highlighted: false
              }
            ].map((tier, i) => {
              const price = regionalPricing
                ? regionalPricing.subscriptions[tier.tier as keyof typeof regionalPricing.subscriptions]?.monthly || tier.basePrice
                : tier.basePrice;
              const displayPrice = regionalPricing && tier.basePrice > 0
                ? formatRegionalPrice(price, regionalPricing)
                : tier.basePrice === 0 ? "$0" : `$${tier.basePrice}`;

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative ${tier.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
                >
                  <div className={`h-full p-6 md:p-8 border-2 ${
                    tier.highlighted 
                      ? 'bg-[#f29de5] border-white/30' 
                      : 'bg-[#3d0d73] border-white/10'
                  }`}>
                    {/* Plan Name */}
                    <h3 className={`text-xl md:text-2xl font-bold mb-1 ${tier.highlighted ? 'text-[#3d0d73]' : 'text-white'}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-sm mb-6 ${tier.highlighted ? 'text-[#3d0d73]/70' : 'text-white/60'}`}>
                      {tier.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      <span className={`text-4xl md:text-5xl font-black ${tier.highlighted ? 'text-[#3d0d73]' : 'text-white'}`}>
                        {displayPrice}
                      </span>
                      <span className={`text-sm ${tier.highlighted ? 'text-[#3d0d73]/60' : 'text-white/50'}`}>/mo</span>
                      {regionalPricing && regionalPricing.multiplier < 1 && tier.basePrice > 0 && (
                        <p className={`text-xs mt-1 ${tier.highlighted ? 'text-[#3d0d73]/50' : 'text-white/40'}`}>
                          <span className="line-through">${tier.basePrice}</span> USD
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.highlighted ? 'text-[#3d0d73]' : 'text-[#f29de5]'}`} />
                          <span className={`text-sm ${tier.highlighted ? 'text-[#3d0d73]/80' : 'text-white/80'}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link href={`/api/auth/login?returnTo=/premium?tier=${tier.tier}`}>
                      <Button className={`w-full min-h-[48px] rounded-none font-bold ${
                        tier.highlighted 
                          ? 'bg-[#3d0d73] text-white hover:bg-[#5537a7]' 
                          : 'bg-white text-[#3d0d73] hover:bg-[#f29de5]'
                      }`}>
                        Get started
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Enterprise Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-2 border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
              <p className="text-white/60 text-sm">Unlimited seats, notifications, and dedicated support for large operations.</p>
            </div>
            <Link href="/api/auth/login">
              <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white hover:text-[#3d0d73] rounded-none px-8 min-h-[48px] font-bold whitespace-nowrap">
                Contact sales
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION - Early Adopters
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#fffaf1] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-4 border-[#3d0d73]/10 p-8 md:p-12 lg:p-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#3d0d73] mb-6">
              Be part of the first<br />
              businesses on Aurora
            </h2>
            <p className="text-lg md:text-xl text-[#3d0d73]/70 mb-10 max-w-2xl mx-auto">
              The businesses who join now won&apos;t just use better tools — they&apos;ll shape how this industry prioritizes safety. Early access means direct input on what we build next. This is where the shift begins.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/api/auth/login">
                <Button size="lg" className="bg-[#f29de5] text-[#3d0d73] hover:bg-[#3d0d73] hover:text-white font-bold rounded-none px-8 min-h-[56px] text-base border-4 border-[#3d0d73]/10">
                  Get started for free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/api/auth/login">
                <Button variant="outline" size="lg" className="border-2 border-[#3d0d73]/30 text-[#3d0d73] hover:bg-[#3d0d73] hover:text-white rounded-none px-8 min-h-[56px] text-base font-bold">
                  Talk to us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FAQ SECTION - Accordion Style
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#fffaf1] relative" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl md:text-4xl font-black text-[#3d0d73] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Frequently asked questions
            </motion.h2>
            <motion.p 
              className="text-[#3d0d73]/60"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Everything you need to know before getting started.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================
          FOOTER - Comprehensive with NeuronaX Credit
          ============================================ */}
      <footer className="bg-[#3d0d73] border-t-4 border-[#5537a7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={40} height={40} className="rounded-lg" />
                <span className="text-xl font-black text-white">Aurora</span>
              </div>
              <p className="text-white/60 text-sm mb-4 max-w-xs">
                The safety-first platform for people and businesses who prioritize protection.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/10 text-white border-0 text-xs rounded-none">Safety-First</Badge>
                <Badge className="bg-white/10 text-white border-0 text-xs rounded-none">AI-Powered</Badge>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">Features</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-white transition-colors cursor-pointer">Integrations</li>
                <li className="hover:text-white transition-colors cursor-pointer">Changelog</li>
              </ul>
            </div>

            {/* Solutions Column */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">For Tourism</li>
                <li className="hover:text-white transition-colors cursor-pointer">For Nightlife</li>
                <li className="hover:text-white transition-colors cursor-pointer">For Events</li>
                <li className="hover:text-white transition-colors cursor-pointer">For Individuals</li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer">About</li>
                <li className="hover:text-white transition-colors cursor-pointer">Blog</li>
                <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                <li><Link href="/legal/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-white/50">
              <span>&copy; 2024 Aurora App. All rights reserved.</span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Worldwide
              </span>
            </div>
            
            {/* NeuronaX Credit */}
            <div className="text-sm text-white/60 text-center md:text-right">
              <span>Developed with </span>
              <span className="text-[#f29de5]">love</span>
              <span> from </span>
              <span className="text-[#e5e093] font-semibold">Colombia</span>
              <span> by </span>
              <span className="text-white font-bold">NeuronaX SAS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Signup Incentive Banner - follows user while scrolling */}
      <SignupIncentiveBanner credits={25} showAfterScroll={300} />
    </div>
  );
}
