"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, MapPin, Briefcase, Shield, ArrowRight,
  Heart, Users, Star, Lock, ThumbsUp, MessageSquare,
  Route, X, CheckCircle, Zap, Globe, Play, Radio
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const publicFeed = useQuery(api.feed.getPublicFeed, { limit: 10 });
  // Recent users for social proof avatars - will be available after Convex sync
  const recentUsers = useQuery((api.users as any).getRecentUsers, { limit: 8 }) as { _id: string; name: string; profileImage?: string }[] | undefined;
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      if (progress > 25 && !dismissedPrompt) setShowSignupPrompt(true);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissedPrompt]);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  // Steps data for horizontal scroll
  const steps = [
    { step: "1", title: "Sign up free", desc: "Create your account with Google or Microsoft. Get 25 credits instantly.", icon: "🎁", color: "#f29de5" },
    { step: "2", title: "Explore & share", desc: "Rate places, share safe routes, connect with women in your area.", icon: "🗺️", color: "#5537a7" },
    { step: "3", title: "Earn & unlock", desc: "Earn credits by helping others. Unlock jobs, mentorship & resources.", icon: "✨", color: "#d6f4ec" },
  ];

  return (
    <div className="min-h-screen bg-[#fffaf1]">
      {/* Error Message */}
      {error === "user_not_found" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#f05a6b] rounded-xl p-4 shadow-lg">
            <p className="text-white font-semibold">⚠️ Session Expired</p>
            <p className="text-white/90 text-sm">Please sign in again.</p>
          </motion.div>
        </div>
      )}

      {/* Floating Signup Prompt */}
      <AnimatePresence>
        {showSignupPrompt && !dismissedPrompt && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <Card className="bg-gradient-to-r from-[#5537a7] to-[#3d0d73] border-0 p-4 shadow-2xl rounded-2xl">
              <button onClick={() => setDismissedPrompt(true)} className="absolute top-2 right-2 text-white/60 hover:text-white p-1"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm">Join Aurora App</h4>
                  <p className="text-white/80 text-xs">Get 25 free credits</p>
                </div>
                <Link href="/api/auth/login"><Button size="sm" className="bg-white text-[#5537a7] hover:bg-white/90 font-semibold rounded-xl min-h-[40px] px-4">Join</Button></Link>
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
            <Link href="/api/auth/login">
              <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-5 min-h-[44px] font-semibold">
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign in</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="h-0.5 bg-gray-100"><div className="h-full bg-gradient-to-r from-[#5537a7] to-[#f29de5] transition-all duration-150" style={{ width: `${scrollProgress}%` }} /></div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf1] via-[#c9cef4]/20 to-[#f29de5]/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f29de5]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9cef4]/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            {/* Urgency Banner */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f29de5]/20 to-[#5537a7]/20 border border-[#5537a7]/30 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#3d0d73]">🎁 Join now & get <span className="text-[#5537a7] font-bold">25 free credits</span></span>
            </motion.div>

            {/* Real User Avatars - Live from database */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.slice(0, 6).map((user, i) => (
                    <div key={user._id} className="w-9 h-9 rounded-full border-2 border-[#fffaf1] shadow-md overflow-hidden bg-gradient-to-br from-[#f29de5] to-[#c9cef4]">
                      {user.profileImage ? (
                        <Image src={user.profileImage} alt="" width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{user.name?.[0] || "A"}</div>
                      )}
                    </div>
                  ))
                ) : (
                  [1,2,3,4,5,6].map(i => <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] border-2 border-[#fffaf1] shadow-md" />)
                )}
                <div className="w-9 h-9 rounded-full bg-[#5537a7] border-2 border-[#fffaf1] shadow-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">+10K</span>
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-[#3d0d73] text-sm">Join 10,000+ women</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-[#e5e093] text-[#e5e093]" />)}
                  <span className="text-xs text-[#3d0d73]/60 ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>

            <motion.h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#3d0d73] mb-4 leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              Navigate Life <span className="text-[#5537a7]">Safely</span> <span className="bg-gradient-to-r from-[#f29de5] to-[#5537a7] bg-clip-text text-transparent">Together</span>
            </motion.h1>

            <motion.p className="text-base sm:text-lg text-[#3d0d73]/70 mb-6 max-w-xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              The #1 safety app for women worldwide. Rate workplaces, share safe routes, connect with your community.
            </motion.p>

            {/* Value Props */}
            <motion.div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              {[{ emoji: "🗺️", text: "Safe routes" }, { emoji: "⭐", text: "Workplace ratings" }, { emoji: "👩‍👩‍👧‍👦", text: "Support circles" }, { emoji: "💼", text: "Job opportunities" }].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 text-[#3d0d73]/80 text-sm">{item.emoji} {item.text}</span>
              ))}
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-3 justify-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/api/auth/login">
                <Button size="lg" className="w-full sm:w-auto bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-8 min-h-[56px] font-bold shadow-xl shadow-[#5537a7]/30 text-base">
                  Start Free Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#5537a7]/30 text-[#5537a7] hover:bg-[#5537a7]/10 rounded-xl px-6 min-h-[56px] font-semibold">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div className="flex flex-wrap justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {[{ icon: Shield, text: "100% Free" }, { icon: Lock, text: "Private & Secure" }, { icon: Globe, text: "Worldwide" }].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 text-[#3d0d73]/60 text-xs sm:text-sm"><item.icon className="w-4 h-4 text-[#22c55e]" />{item.text}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal Scroll Cards */}
      <section id="how-it-works" className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 px-4">
            <Badge className="bg-[#d6f4ec]/50 text-[#3d0d73] border-0 mb-3">Simple & Free</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3d0d73]">Get started in 30 seconds</h2>
          </div>

          {/* Horizontal Scroll Container */}
          <div ref={stepsRef} className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
            {steps.map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="min-w-[280px] md:min-w-0 snap-center flex-shrink-0">
                <div className="bg-[#fffaf1] rounded-2xl p-6 border border-gray-100 h-full relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: item.color + "20" }}>{item.icon}</div>
                    <div className="w-8 h-8 rounded-full bg-[#5537a7] text-white font-bold flex items-center justify-center text-sm">{item.step}</div>
                  </div>
                  <h3 className="font-bold text-[#3d0d73] text-lg mb-2">{item.title}</h3>
                  <p className="text-[#3d0d73]/60 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scroll indicator for mobile */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {steps.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-[#5537a7]/30" />)}
          </div>

          <div className="text-center mt-8 px-4">
            <Link href="/api/auth/login">
              <Button size="lg" className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-10 min-h-[52px] font-bold shadow-lg shadow-[#5537a7]/20">
                Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-[#3d0d73]/50 mt-3">No credit card • No spam • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Live Feed Preview */}
      <section className="py-12 bg-[#fffaf1]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#d6f4ec]/50 text-[#3d0d73] px-4 py-2 rounded-full mb-3">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-sm font-medium">Live Community Feed</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3d0d73]">See what women are sharing</h2>
          </div>

          {/* Feed - Horizontal scroll mobile, grid desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
            {!publicFeed ? (
              [1,2,3].map(i => (
                <Card key={i} className="min-w-[280px] md:min-w-0 snap-center bg-white border-gray-100 p-4 animate-pulse rounded-2xl">
                  <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-20" /><div className="h-2 bg-gray-200 rounded w-14" /></div></div>
                  <div className="space-y-2"><div className="h-3 bg-gray-200 rounded w-full" /><div className="h-3 bg-gray-200 rounded w-3/4" /></div>
                </Card>
              ))
            ) : publicFeed.slice(0, 6).map((post, i) => (
              <motion.div key={post._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="min-w-[280px] md:min-w-0 snap-center">
                <Card className="bg-white border border-gray-100 rounded-2xl h-full hover:shadow-lg transition-all">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(post.authorName || "A")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{post.isAnonymous ? "Anonymous" : post.authorName || "Aurora User"}</p>
                        <p className="text-xs text-gray-500">{formatDistanceToNow(post._creationTime, { addSuffix: true })}</p>
                      </div>
                    </div>
                    {post.title && <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-1">{post.title}</h3>}
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {post.upvotes || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentCount || 0}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/api/auth/login">
              <Button size="lg" className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-8 min-h-[52px] font-semibold shadow-lg shadow-[#5537a7]/20">
                Join to see more <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#c9cef4]/30 text-[#5537a7] border-0 mb-3">Features</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3d0d73]">Everything you need to thrive</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Shield, title: "Safety Intelligence", desc: "Rate workplaces & routes", color: "#f29de5" },
              { icon: Route, title: "Safe Routes", desc: "GPS-tracked paths", color: "#2e2ad6" },
              { icon: Briefcase, title: "Opportunities", desc: "Jobs & mentorship", color: "#e5e093" },
              { icon: Users, title: "Support Circles", desc: "Connect with women", color: "#d6f4ec" },
              { icon: Heart, title: "Wellness", desc: "Health tracking", color: "#f29de5" },
              { icon: MessageSquare, title: "AI Companion", desc: "24/7 support", color: "#c9cef4" },
              { icon: Zap, title: "Credits", desc: "Earn by helping", color: "#e5e093" },
              { icon: Globe, title: "Global", desc: "Women worldwide", color: "#d6f4ec" },
            ].map((f) => (
              <motion.div key={f.title} whileHover={{ y: -2 }} className="bg-[#fffaf1] rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: f.color + "30" }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color === "#e5e093" || f.color === "#d6f4ec" ? "#3d0d73" : f.color }} />
                </div>
                <h3 className="font-bold text-[#3d0d73] text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-[#3d0d73]/60">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & Testimonials */}
      <section className="py-12 bg-gradient-to-br from-[#5537a7] to-[#3d0d73] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[{ value: "10K+", label: "Women" }, { value: "50K+", label: "Reports" }, { value: "25K+", label: "Routes" }, { value: "98%", label: "Feel Safer" }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-black">{s.value}</p>
                <p className="text-white/70 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials - Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
            {[
              { quote: "Aurora helped me find a safe route to my new job. Peace of mind every day.", name: "Sarah M.", role: "Engineer", loc: "🇺🇸 SF" },
              { quote: "Finally an app that understands what women need. Amazing mentors here.", name: "María L.", role: "Marketing", loc: "🇨🇴 Bogotá" },
              { quote: "The workplace ratings saved me from a toxic company. Invaluable.", name: "Priya K.", role: "Analyst", loc: "🇮🇳 Mumbai" },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="min-w-[280px] md:min-w-0 snap-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-[#e5e093] text-[#e5e093]" />)}</div>
                <p className="text-white/90 text-sm mb-3 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4]" />
                  <div>
                    <p className="font-semibold text-white text-xs">{t.name}</p>
                    <p className="text-white/60 text-[10px]">{t.role} • {t.loc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-12 bg-[#fffaf1]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#d6f4ec] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-[#3d0d73]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3d0d73] mb-2">Your Privacy is Our Priority</h2>
            <p className="text-[#3d0d73]/60 text-sm">Your data belongs to you. We are committed to transparency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Lock, title: "Data Protection", desc: "Encrypted under GDPR, CCPA & Colombian Law 1581", color: "#5537a7" },
              { icon: CheckCircle, title: "Full Control", desc: "Export, delete or modify your data anytime", color: "#22c55e" },
              { icon: Shield, title: "Anonymous Options", desc: "Post anonymously for sensitive experiences", color: "#f29de5" },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <p.icon className="w-7 h-7 mb-3" style={{ color: p.color }} />
                <h3 className="font-bold text-[#3d0d73] mb-1 text-sm">{p.title}</h3>
                <p className="text-xs text-[#3d0d73]/60">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#c9cef4]/20 rounded-xl p-4 text-center">
            <p className="text-xs text-[#3d0d73]/80">
              By creating an account, you agree to our <Link href="/legal/terms" className="text-[#5537a7] underline">Terms</Link> and <Link href="/legal/privacy" className="text-[#5537a7] underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Image src="/Au_Logo_1.png" alt="Aurora App" width={56} height={56} className="rounded-2xl mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#3d0d73] mb-3">Ready to join Aurora App?</h2>
          <p className="text-[#3d0d73]/60 text-sm mb-6">Get 25 free credits when you sign up. Share experiences, earn more, unlock opportunities.</p>
          <Link href="/api/auth/login">
            <Button size="lg" className="w-full sm:w-auto bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl min-h-[52px] px-10 font-bold shadow-xl shadow-[#5537a7]/30">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-[#3d0d73]/50 mt-4">Sign in with Google, Microsoft, or email</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={32} height={32} className="rounded-xl" />
              <span className="text-[#3d0d73] font-semibold text-sm">Aurora App</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#3d0d73]/60">
              <Link href="/legal/terms" className="hover:text-[#5537a7]">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-[#5537a7]">Privacy</Link>
              <a href="mailto:auroraapp.info@gmail.com" className="hover:text-[#5537a7]">Contact</a>
            </div>
            <p className="text-[#3d0d73]/50 text-xs flex items-center gap-1">Made with <Heart className="w-3 h-3 text-[#f29de5]" /> for women everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
