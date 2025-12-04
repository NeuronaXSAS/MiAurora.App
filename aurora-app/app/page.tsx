"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, MapPin, Briefcase, Shield, ArrowRight,
  Heart, Users, Star, Lock, ThumbsUp, MessageSquare,
  Route, X, CheckCircle, Zap, Globe, Play, Radio,
  ChevronRight, Award, TrendingUp, Clock, Eye, Mic,
  AlertTriangle, Phone, MapPinned, Building2, Lightbulb
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const publicFeed = useQuery(api.feed.getPublicFeed, { limit: 10 });
  const recentUsers = useQuery((api.users as any).getRecentUsers, { limit: 8 }) as { _id: string; name: string; profileImage?: string }[] | undefined;
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeStat, setActiveStat] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 400 && !dismissedPrompt) setShowSignupPrompt(true);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissedPrompt]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  const features = [
    {
      id: 0,
      icon: Shield,
      title: "Safety Intelligence",
      subtitle: "Know before you go",
      desc: "Access community-verified safety ratings for workplaces, neighborhoods, and routes. Real women sharing real experiences.",
      color: "#f29de5",
      stats: "50K+ ratings",
      image: "🛡️"
    },
    {
      id: 1,
      icon: Route,
      title: "Safe Routes",
      subtitle: "Walk with confidence",
      desc: "GPS-tracked routes rated by women who've walked them. Share your journey with trusted contacts in real-time.",
      color: "#2e2ad6",
      stats: "25K+ routes",
      image: "🗺️"
    },
    {
      id: 2,
      icon: Users,
      title: "Support Circles",
      subtitle: "Never alone",
      desc: "Join private communities of women in your area or industry. Get advice, share experiences, find mentors.",
      color: "#5537a7",
      stats: "5K+ circles",
      image: "👩‍👩‍👧‍👦"
    },
    {
      id: 3,
      icon: Briefcase,
      title: "Opportunities",
      subtitle: "Grow your career",
      desc: "Access women-friendly job listings, mentorship programs, and professional development resources.",
      color: "#e5e093",
      stats: "2K+ jobs",
      image: "💼"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Women Protected", icon: Users, color: "#f29de5" },
    { value: "50,000+", label: "Safety Reports", icon: Shield, color: "#5537a7" },
    { value: "25,000+", label: "Safe Routes", icon: Route, color: "#2e2ad6" },
    { value: "98%", label: "Feel Safer", icon: Heart, color: "#d6f4ec" }
  ];

  const testimonials = [
    {
      quote: "I was nervous about my new commute in a new city. Aurora's safe routes feature gave me the confidence to walk to work. The community ratings were spot-on.",
      name: "Sarah Mitchell",
      role: "Software Engineer",
      location: "San Francisco, USA",
      avatar: "👩‍💻",
      rating: 5,
      highlight: "safe routes"
    },
    {
      quote: "The workplace ratings saved me from accepting a job at a company with serious harassment issues. This app is essential for every woman job hunting.",
      name: "María López",
      role: "Marketing Director",
      location: "Bogotá, Colombia",
      avatar: "👩‍💼",
      rating: 5,
      highlight: "workplace ratings"
    },
    {
      quote: "Found my mentor through Aurora's circles. She helped me negotiate a 30% raise. The community here genuinely wants to see you succeed.",
      name: "Priya Sharma",
      role: "Data Analyst",
      location: "Mumbai, India",
      avatar: "👩‍🔬",
      rating: 5,
      highlight: "mentor"
    },
    {
      quote: "The panic button feature gave my mom peace of mind when I moved abroad. Knowing help is one tap away makes all the difference.",
      name: "Emma Chen",
      role: "Graduate Student",
      location: "London, UK",
      avatar: "👩‍🎓",
      rating: 5,
      highlight: "panic button"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fffaf1] overflow-x-hidden">
      {/* Error Message */}
      {error === "user_not_found" && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
        >
          <div className="bg-[#f05a6b] rounded-xl p-4 shadow-lg">
            <p className="text-white font-semibold">⚠️ Session Expired</p>
            <p className="text-white/90 text-sm">Please sign in again.</p>
          </div>
        </motion.div>
      )}

      {/* Floating Signup Prompt - Mobile */}
      <AnimatePresence>
        {showSignupPrompt && !dismissedPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }} 
            className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
          >
            <Card className="bg-gradient-to-r from-[#5537a7] to-[#3d0d73] border-0 p-4 shadow-2xl rounded-2xl">
              <button 
                onClick={() => setDismissedPrompt(true)} 
                className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#e5e093] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm">Get 25 Free Credits</h4>
                  <p className="text-white/80 text-xs">Join 10,000+ women today</p>
                </div>
                <Link href="/api/auth/login">
                  <Button size="sm" className="bg-white text-[#5537a7] hover:bg-white/90 font-bold rounded-xl min-h-[44px] px-5">
                    Join
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#fffaf1]/95 backdrop-blur-lg border-b border-[#3d0d73]/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={44} height={44} className="rounded-xl" />
              <span className="text-lg font-bold text-[#3d0d73] hidden sm:block">Aurora App</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/api/auth/login" className="hidden sm:block">
                <Button variant="ghost" className="text-[#3d0d73] hover:bg-[#5537a7]/10 rounded-xl font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/api/auth/login">
                <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-5 min-h-[44px] font-semibold shadow-lg shadow-[#5537a7]/20">
                  <span className="hidden sm:inline">Get Started Free</span>
                  <span className="sm:hidden">Join Free</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Emotional & Story-Driven */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf1] via-[#c9cef4]/30 to-[#f29de5]/20" />
          <motion.div 
            className="absolute top-20 right-10 w-72 h-72 bg-[#f29de5]/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 left-10 w-96 h-96 bg-[#c9cef4]/40 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5537a7]/10 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative max-w-6xl mx-auto px-4 pt-8 pb-16 md:pt-16 md:pb-24"
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Live Activity Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#5537a7]/20 rounded-full px-4 py-2 mb-6 shadow-lg"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
              <span className="text-sm font-medium text-[#3d0d73]">
                <span className="font-bold text-[#5537a7]">247 women</span> joined today
              </span>
              <ChevronRight className="w-4 h-4 text-[#5537a7]" />
            </motion.div>

            {/* Social Proof Avatars */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <div className="flex -space-x-3">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.slice(0, 5).map((user, i) => (
                    <motion.div 
                      key={user._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-10 h-10 rounded-full border-3 border-[#fffaf1] shadow-lg overflow-hidden bg-gradient-to-br from-[#f29de5] to-[#c9cef4]"
                    >
                      {user.profileImage ? (
                        <Image src={user.profileImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.[0] || "A"}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  ["👩‍💻", "👩‍🎨", "👩‍⚕️", "👩‍🔬", "👩‍💼"].map((emoji, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] border-3 border-[#fffaf1] shadow-lg flex items-center justify-center text-lg"
                    >
                      {emoji}
                    </motion.div>
                  ))
                )}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-10 h-10 rounded-full bg-[#5537a7] border-3 border-[#fffaf1] shadow-lg flex items-center justify-center"
                >
                  <span className="text-white text-[10px] font-bold">+10K</span>
                </motion.div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-[#e5e093] text-[#e5e093]" />
                  ))}
                  <span className="text-sm font-bold text-[#3d0d73] ml-1">4.9</span>
                </div>
                <p className="text-xs text-[#3d0d73]/60">Trusted by 10,000+ women</p>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#3d0d73] mb-6 leading-[1.1]"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
            >
              Your Safety.{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-[#5537a7] to-[#f29de5] bg-clip-text text-transparent">
                  Your Community.
                </span>
                <motion.svg 
                  className="absolute -bottom-2 left-0 w-full" 
                  viewBox="0 0 300 12" 
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <motion.path 
                    d="M2 10C50 4 100 4 150 6C200 8 250 4 298 8" 
                    stroke="#f29de5" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  />
                </motion.svg>
              </span>
              <br />
              <span className="text-[#5537a7]">Your Growth.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-lg sm:text-xl text-[#3d0d73]/70 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
            >
              The <span className="font-semibold text-[#5537a7]">#1 safety app</span> built by women, for women. 
              Rate workplaces, share safe routes, find mentors, and connect with a global community that has your back.
            </motion.p>

            {/* Value Props Pills */}
            <motion.div 
              className="flex flex-wrap justify-center gap-2 mb-8"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4 }}
            >
              {[
                { emoji: "🛡️", text: "Safety Ratings", color: "#f29de5" },
                { emoji: "🗺️", text: "Safe Routes", color: "#2e2ad6" },
                { emoji: "👩‍👩‍👧‍👦", text: "Support Circles", color: "#5537a7" },
                { emoji: "💼", text: "Job Opportunities", color: "#e5e093" },
                { emoji: "🎯", text: "Mentorship", color: "#d6f4ec" }
              ].map((item, i) => (
                <motion.span 
                  key={item.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-[#3d0d73] shadow-sm border border-[#3d0d73]/10"
                >
                  <span>{item.emoji}</span>
                  {item.text}
                </motion.span>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5 }}
            >
              <Link href="/api/auth/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-2xl px-10 min-h-[60px] font-bold text-lg shadow-xl shadow-[#5537a7]/30 transition-all hover:scale-105"
                >
                  Join Free — Get 25 Credits
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-[#5537a7]/30 text-[#5537a7] hover:bg-[#5537a7]/10 rounded-2xl px-8 min-h-[60px] font-semibold text-lg"
                >
                  <Play className="w-5 h-5 mr-2 fill-[#5537a7]" />
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.6 }}
            >
              {[
                { icon: CheckCircle, text: "100% Free to Start" },
                { icon: Lock, text: "Private & Encrypted" },
                { icon: Globe, text: "Available Worldwide" },
                { icon: Zap, text: "No Credit Card" }
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-2 text-[#3d0d73]/60 text-sm">
                  <item.icon className="w-4 h-4 text-[#22c55e]" />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-[#5537a7]/30 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-[#5537a7] rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Live Stats Ticker */}
      <section className="py-6 bg-gradient-to-r from-[#5537a7] to-[#3d0d73] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                <p className="text-white/70 text-xs md:text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#f29de5]/20 text-[#5537a7] border-0 mb-4 px-4 py-1.5 text-sm font-medium">
                ✨ Powerful Features
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3d0d73] mb-4">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-[#5537a7] to-[#f29de5] bg-clip-text text-transparent">
                  thrive
                </span>
              </h2>
              <p className="text-[#3d0d73]/60 text-lg max-w-2xl mx-auto">
                Built with input from thousands of women worldwide. Every feature designed to keep you safe, connected, and growing.
              </p>
            </motion.div>
          </div>

          {/* Feature Cards - Interactive */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Feature Selector */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveFeature(i)}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${
                    activeFeature === i 
                      ? "border-[#5537a7] bg-[#5537a7]/5 shadow-lg" 
                      : "border-gray-100 hover:border-[#5537a7]/30 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ backgroundColor: activeFeature === i ? feature.color + "30" : "#f5f5f5" }}
                    >
                      <feature.icon 
                        className="w-7 h-7 transition-colors"
                        style={{ color: activeFeature === i ? feature.color : "#9ca3af" }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-[#3d0d73] text-lg">{feature.title}</h3>
                        <Badge 
                          className="text-xs border-0"
                          style={{ 
                            backgroundColor: feature.color + "20", 
                            color: feature.color === "#e5e093" ? "#3d0d73" : feature.color 
                          }}
                        >
                          {feature.stats}
                        </Badge>
                      </div>
                      <p className="text-[#5537a7] text-sm font-medium mb-1">{feature.subtitle}</p>
                      <p className={`text-sm transition-all ${activeFeature === i ? "text-[#3d0d73]/70" : "text-[#3d0d73]/50 line-clamp-1"}`}>
                        {feature.desc}
                      </p>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 transition-all flex-shrink-0 ${
                        activeFeature === i ? "text-[#5537a7] rotate-90" : "text-gray-300"
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#5537a7]/10 to-[#f29de5]/10 rounded-3xl p-8 md:p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <div 
                      className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl shadow-xl"
                      style={{ backgroundColor: features[activeFeature].color + "30" }}
                    >
                      {features[activeFeature].image}
                    </div>
                    <h3 className="text-2xl font-bold text-[#3d0d73] mb-3">
                      {features[activeFeature].title}
                    </h3>
                    <p className="text-[#3d0d73]/70 mb-6 max-w-sm mx-auto">
                      {features[activeFeature].desc}
                    </p>
                    <Link href="/api/auth/login">
                      <Button 
                        className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-6 min-h-[48px] font-semibold"
                      >
                        Try {features[activeFeature].title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Floating Elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-20 h-20 bg-[#e5e093] rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-3xl">🎁</span>
              </motion.div>
              <motion.div 
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#d6f4ec] rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <span className="text-2xl">💜</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple Steps */}
      <section className="py-16 md:py-24 bg-[#fffaf1]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#d6f4ec]/50 text-[#3d0d73] border-0 mb-4 px-4 py-1.5 text-sm font-medium">
                🚀 Quick Start
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3d0d73] mb-4">
                Get started in 30 seconds
              </h2>
              <p className="text-[#3d0d73]/60 text-lg">
                No complicated setup. Just sign in and start exploring.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "1",
                icon: "🎁",
                title: "Sign up free",
                desc: "Create your account with Google or Microsoft. Get 25 credits instantly to unlock premium features.",
                color: "#f29de5",
                highlight: "25 free credits"
              },
              {
                step: "2",
                icon: "🗺️",
                title: "Explore & share",
                desc: "Rate workplaces, share safe routes, join circles, and connect with women in your area.",
                color: "#5537a7",
                highlight: "Help others"
              },
              {
                step: "3",
                icon: "✨",
                title: "Earn & grow",
                desc: "Earn credits by contributing. Unlock job opportunities, mentorship, and exclusive resources.",
                color: "#d6f4ec",
                highlight: "Unlock opportunities"
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                      style={{ backgroundColor: item.color === "#d6f4ec" ? "#5537a7" : item.color }}
                    >
                      {item.step}
                    </div>
                  </div>

                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 mt-4"
                    style={{ backgroundColor: item.color + "30" }}
                  >
                    {item.icon}
                  </div>

                  <h3 className="font-bold text-[#3d0d73] text-xl mb-3">{item.title}</h3>
                  <p className="text-[#3d0d73]/60 mb-4">{item.desc}</p>
                  
                  <Badge 
                    className="border-0"
                    style={{ 
                      backgroundColor: item.color + "30", 
                      color: item.color === "#d6f4ec" ? "#3d0d73" : item.color === "#f29de5" ? "#5537a7" : "white" 
                    }}
                  >
                    {item.highlight}
                  </Badge>
                </div>

                {/* Connector Line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-[#5537a7]/30" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/api/auth/login">
              <Button 
                size="lg" 
                className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-2xl px-10 min-h-[56px] font-bold shadow-xl shadow-[#5537a7]/30"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-[#3d0d73]/50 mt-4">
              No credit card required • Cancel anytime • 100% free to start
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Community Feed */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-[#f05a6b]/10 text-[#f05a6b] px-4 py-2 rounded-full mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f05a6b] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f05a6b]"></span>
                </span>
                <span className="text-sm font-medium">Live Community Feed</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3d0d73] mb-4">
                See what women are sharing
              </h2>
              <p className="text-[#3d0d73]/60 text-lg max-w-2xl mx-auto">
                Real stories, real experiences, real support. Join the conversation.
              </p>
            </motion.div>
          </div>

          {/* Feed Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!publicFeed ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-[#fffaf1] border-gray-100 p-5 animate-pulse rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-2 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </Card>
              ))
            ) : (
              publicFeed.slice(0, 6).map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-[#fffaf1] border border-gray-100 rounded-2xl h-full hover:shadow-lg hover:border-[#5537a7]/20 transition-all group">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {(post.authorName || "A")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#3d0d73] text-sm truncate">
                            {post.isAnonymous ? "Anonymous Sister" : post.authorName || "Aurora Member"}
                          </p>
                          <p className="text-xs text-[#3d0d73]/50">
                            {formatDistanceToNow(post._creationTime, { addSuffix: true })}
                          </p>
                        </div>
                        {post.type && (
                          <Badge className="bg-[#5537a7]/10 text-[#5537a7] border-0 text-xs">
                            {post.type}
                          </Badge>
                        )}
                      </div>
                      
                      {post.title && (
                        <h3 className="font-semibold text-[#3d0d73] mb-2 line-clamp-1 group-hover:text-[#5537a7] transition-colors">
                          {post.title}
                        </h3>
                      )}
                      <p className="text-[#3d0d73]/70 text-sm line-clamp-3 mb-4">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-[#3d0d73]/50">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {post.upvotes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {post.commentCount || 0}
                          </span>
                        </div>
                        <span className="text-xs text-[#5537a7] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Join to interact →
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/api/auth/login">
              <Button 
                size="lg" 
                className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-2xl px-10 min-h-[56px] font-bold shadow-lg shadow-[#5537a7]/20"
              >
                Join the Community
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Social Proof */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#5537a7] to-[#3d0d73] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-white/20 text-white border-0 mb-4 px-4 py-1.5 text-sm font-medium">
                💜 Loved by Women Worldwide
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Real stories from our community
              </h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Join thousands of women who've found safety, support, and success with Aurora App.
              </p>
            </motion.div>
          </div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all"
              >
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-[#e5e093] text-[#e5e093]" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/90 text-lg leading-relaxed mb-6">
                  "{testimonial.quote.split(testimonial.highlight).map((part, idx, arr) => (
                    <span key={idx}>
                      {part}
                      {idx < arr.length - 1 && (
                        <span className="text-[#e5e093] font-semibold">{testimonial.highlight}</span>
                      )}
                    </span>
                  ))}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] flex items-center justify-center text-2xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                    <p className="text-white/40 text-xs">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Row */}
          <motion.div 
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: "4.9/5", label: "App Rating", icon: Star },
              { value: "10K+", label: "Active Members", icon: Users },
              { value: "50+", label: "Countries", icon: Globe },
              { value: "24/7", label: "AI Support", icon: MessageSquare }
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-[#e5e093] mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety & Privacy Section */}
      <section className="py-16 md:py-24 bg-[#fffaf1]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#d6f4ec]/50 text-[#3d0d73] border-0 mb-4 px-4 py-1.5 text-sm font-medium">
                🔒 Your Privacy Matters
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3d0d73] mb-6">
                Built with your safety{" "}
                <span className="text-[#5537a7]">in mind</span>
              </h2>
              <p className="text-[#3d0d73]/70 text-lg mb-8">
                We take your privacy seriously. Your data is encrypted, your identity is protected, 
                and you're always in control.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Lock,
                    title: "End-to-End Encryption",
                    desc: "Your data is encrypted under GDPR, CCPA & Colombian Law 1581",
                    color: "#5537a7"
                  },
                  {
                    icon: Eye,
                    title: "Anonymous Posting",
                    desc: "Share sensitive experiences without revealing your identity",
                    color: "#f29de5"
                  },
                  {
                    icon: CheckCircle,
                    title: "Full Data Control",
                    desc: "Export, modify, or delete your data anytime you want",
                    color: "#22c55e"
                  },
                  {
                    icon: Shield,
                    title: "Offline Emergency Access",
                    desc: "Panic button and emergency contacts work without internet",
                    color: "#ec4c28"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: item.color + "20" }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3d0d73] mb-1">{item.title}</h3>
                      <p className="text-[#3d0d73]/60 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#5537a7]/10 to-[#f29de5]/10 rounded-3xl p-8 md:p-12">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#d6f4ec] rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-[#3d0d73]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#3d0d73]">Privacy Dashboard</h3>
                      <p className="text-xs text-[#3d0d73]/50">You're in control</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Profile Visibility", value: "Friends Only", icon: Users },
                      { label: "Location Sharing", value: "When I Choose", icon: MapPin },
                      { label: "Anonymous Mode", value: "Available", icon: Eye }
                    ].map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between p-3 bg-[#fffaf1] rounded-xl">
                        <div className="flex items-center gap-3">
                          <setting.icon className="w-4 h-4 text-[#5537a7]" />
                          <span className="text-sm text-[#3d0d73]">{setting.label}</span>
                        </div>
                        <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 text-xs">
                          {setting.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-[#22c55e] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-bold">Verified Secure</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f29de5]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c9cef4]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Logo */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <Image 
                src="/Au_Logo_1.png" 
                alt="Aurora App" 
                width={80} 
                height={80} 
                className="rounded-3xl shadow-2xl shadow-[#5537a7]/30" 
              />
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3d0d73] mb-6">
              Ready to join{" "}
              <span className="bg-gradient-to-r from-[#5537a7] to-[#f29de5] bg-clip-text text-transparent">
                Aurora App
              </span>
              ?
            </h2>

            <p className="text-[#3d0d73]/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Join 10,000+ women who are navigating life more safely, building meaningful connections, 
              and unlocking new opportunities every day.
            </p>

            {/* Bonus Offer */}
            <motion.div 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#e5e093]/30 to-[#f29de5]/30 border border-[#e5e093] rounded-2xl px-6 py-4 mb-8"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">🎁</span>
              <div className="text-left">
                <p className="font-bold text-[#3d0d73]">Limited Time Offer</p>
                <p className="text-sm text-[#3d0d73]/70">Sign up today and get <span className="font-bold text-[#5537a7]">25 free credits</span></p>
              </div>
            </motion.div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/api/auth/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-2xl px-12 min-h-[64px] font-bold text-lg shadow-2xl shadow-[#5537a7]/40 transition-all hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Sign-in Options */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { icon: "🔵", text: "Google" },
                { icon: "🟦", text: "Microsoft" }
              ].map((option) => (
                <span key={option.text} className="flex items-center gap-2 text-[#3d0d73]/60 text-sm">
                  <span>{option.icon}</span>
                  Sign in with {option.text}
                </span>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#3d0d73]/50">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#22c55e]" />
                100% private & secure
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#22c55e]" />
                Setup in 30 seconds
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-[#fffaf1]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={40} height={40} className="rounded-xl" />
                <span className="text-[#3d0d73] font-bold text-lg">Aurora App</span>
              </div>
              <p className="text-[#3d0d73]/60 text-sm mb-4 max-w-sm">
                The #1 safety app for women worldwide. Navigate life safely, build community, and unlock opportunities.
              </p>
              <div className="flex items-center gap-1 text-sm text-[#3d0d73]/50">
                Made with <Heart className="w-4 h-4 text-[#f29de5] mx-1" /> for women everywhere
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/legal/terms" className="block text-[#3d0d73]/60 hover:text-[#5537a7] text-sm transition-colors">
                  Terms of Service
                </Link>
                <Link href="/legal/privacy" className="block text-[#3d0d73]/60 hover:text-[#5537a7] text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/legal/cookies" className="block text-[#3d0d73]/60 hover:text-[#5537a7] text-sm transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-[#3d0d73] mb-4">Contact</h4>
              <div className="space-y-2">
                <a 
                  href="mailto:auroraapp.info@gmail.com" 
                  className="block text-[#3d0d73]/60 hover:text-[#5537a7] text-sm transition-colors"
                >
                  auroraapp.info@gmail.com
                </a>
                <p className="text-[#3d0d73]/60 text-sm">
                  Available worldwide
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#3d0d73]/50 text-sm">
              © {new Date().getFullYear()} Aurora App. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Badge className="bg-[#d6f4ec] text-[#3d0d73] border-0 text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Available in 50+ countries
              </Badge>
              <Badge className="bg-[#f29de5]/20 text-[#5537a7] border-0 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                GDPR Compliant
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
