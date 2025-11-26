"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, MapPin, Briefcase, Shield, ArrowRight,
  Heart, Users, Star, Lock, ThumbsUp, MessageSquare,
  Route, ChevronDown, X, CheckCircle, Zap, Globe
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const publicFeed = useQuery(api.feed.getPublicFeed, { limit: 10 });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      if (progress > 30 && !dismissedPrompt) {
        setShowSignupPrompt(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissedPrompt]);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  // Public post card - simplified and clean
  const PublicPostCard = ({ post, index }: { post: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] flex items-center justify-center text-white font-bold">
              {(post.authorName || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {post.isAnonymous ? "Anonymous" : post.authorName || "Aurora User"}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(post._creationTime, { addSuffix: true })}
              </p>
            </div>
            {post.category && (
              <Badge className="bg-[#c9cef4]/30 text-[#5537a7] border-0 text-xs">
                {post.category}
              </Badge>
            )}
          </div>

          {post.title && (
            <h3 className="font-semibold text-gray-900 mb-2 text-base">{post.title}</h3>
          )}
          <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
            {post.content}
          </p>

          {post.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
              <MapPin className="w-3.5 h-3.5 text-[#5537a7]" />
              <span>{post.location}</span>
            </div>
          )}

          {post.rating && (
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < post.rating ? "fill-[#e5e093] text-[#e5e093]" : "text-gray-200"}`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{post.upvotes || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </div>
            <div className="flex-1" />
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button size="sm" variant="ghost" className="text-[#5537a7] hover:bg-[#5537a7]/10 text-xs font-medium">
                Join to interact →
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#fffaf1]">
      {/* Error Message */}
      {error === "user_not_found" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#f05a6b] rounded-xl p-4 shadow-lg"
          >
            <p className="text-white font-semibold">⚠️ Session Expired</p>
            <p className="text-white/90 text-sm">Please sign in again.</p>
          </motion.div>
        </div>
      )}

      {/* Floating Signup Prompt */}
      <AnimatePresence>
        {showSignupPrompt && !dismissedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <Card className="bg-gradient-to-r from-[#5537a7] to-[#3d0d73] border-0 p-5 shadow-2xl rounded-2xl">
              <button
                onClick={() => setDismissedPrompt(true)}
                className="absolute top-3 right-3 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Join Aurora App</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Get 25 free credits and connect with the community.
                  </p>
                  <Link href="/api/auth/login?provider=GoogleOAuth">
                    <Button className="w-full bg-white text-[#5537a7] hover:bg-white/90 font-semibold rounded-xl min-h-[44px]">
                      Sign up free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar - Clean & Light */}
      <nav className="sticky top-0 z-40 bg-[#fffaf1]/95 backdrop-blur-lg border-b border-[#3d0d73]/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={44} height={44} className="rounded-xl" />
              <span className="text-lg font-bold text-[#3d0d73] hidden sm:block">Aurora App</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-5 min-h-[44px] font-semibold">
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#5537a7] to-[#f29de5] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </nav>

      {/* Hero Section - Light & Impactful */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf1] via-[#c9cef4]/20 to-[#f29de5]/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f29de5]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9cef4]/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-6"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] border-2 border-[#fffaf1]" />
                  ))}
                </div>
                <span className="text-[#3d0d73]/70 text-sm ml-2">
                  <span className="font-bold text-[#3d0d73]">10,000+</span> women trust Aurora
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#3d0d73] mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Your Safety.{" "}
                <span className="text-[#5537a7]">Your Community.</span>{" "}
                <span className="bg-gradient-to-r from-[#f29de5] to-[#5537a7] bg-clip-text text-transparent">Your Growth.</span>
              </motion.h1>

              <motion.p
                className="text-lg text-[#3d0d73]/70 mb-8 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Community-powered safety intelligence for women. Share experiences, earn credits, unlock opportunities.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/api/auth/login?provider=GoogleOAuth">
                  <Button size="lg" className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-8 min-h-[52px] font-semibold shadow-lg shadow-[#5537a7]/30 w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-[#5537a7]/30 text-[#5537a7] hover:bg-[#5537a7]/10 rounded-xl px-8 min-h-[52px] font-semibold w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: Shield, text: "Privacy First" },
                  { icon: Lock, text: "Anonymous Posting" },
                  { icon: CheckCircle, text: "Community Verified" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-[#3d0d73]/60 text-sm">
                    <item.icon className="w-4 h-4 text-[#5537a7]" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right - App Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5537a7] to-[#f29de5] rounded-3xl blur-2xl opacity-20 scale-105" />
                <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Image src="/Au_Logo_1.png" alt="Aurora" width={40} height={40} className="rounded-xl" />
                    <div>
                      <p className="font-bold text-[#3d0d73]">Aurora App</p>
                      <p className="text-xs text-gray-500">Safety Intelligence</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: MapPin, text: "Safe route to downtown", color: "#d6f4ec" },
                      { icon: Star, text: "Workplace rated 4.8★", color: "#e5e093" },
                      { icon: Users, text: "12 women nearby", color: "#c9cef4" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: item.color + "40" }}>
                        <item.icon className="w-5 h-5 text-[#5537a7]" />
                        <span className="text-sm text-[#3d0d73]">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-[#c9cef4]/30 text-[#5537a7] border-0 mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#3d0d73] mb-4">
              Everything you need to thrive
            </h2>
            <p className="text-[#3d0d73]/60 max-w-2xl mx-auto">
              Aurora App combines safety, community, and opportunity in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Safety Intelligence", desc: "Rate workplaces, neighborhoods & routes", color: "#f29de5" },
              { icon: Route, title: "Safe Routes", desc: "GPS-tracked community-verified routes", color: "#2e2ad6" },
              { icon: Briefcase, title: "Opportunities", desc: "Jobs, mentorship & career resources", color: "#e5e093" },
              { icon: Users, title: "Support Circles", desc: "Connect with women who understand", color: "#d6f4ec" },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -5 }}
                className="bg-[#fffaf1] rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feature.color + "30" }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color === "#e5e093" || feature.color === "#d6f4ec" ? "#3d0d73" : feature.color }} />
                </div>
                <h3 className="font-bold text-[#3d0d73] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#3d0d73]/60">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="bg-[#fffaf1] py-6 text-center border-y border-gray-100">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="inline-flex items-center gap-2 text-[#3d0d73]/50 text-sm"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Explore community posts</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Feed Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-5" ref={feedRef}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#3d0d73]">Community Feed</h2>
              <Badge className="bg-[#d6f4ec]/50 text-[#3d0d73] border-0">
                <span className="w-2 h-2 bg-[#22c55e] rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>

            {/* Loading State */}
            {!publicFeed && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white border-gray-100 p-5 animate-pulse rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-24" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Feed Items */}
            {publicFeed && publicFeed.length > 0 && (
              <div className="space-y-5">
                {publicFeed.map((post: any, index: number) => (
                  <PublicPostCard key={post._id} post={post} index={index} />
                ))}

                {/* Join CTA */}
                <Card className="bg-gradient-to-br from-[#c9cef4]/30 to-[#f29de5]/20 border-[#5537a7]/20 p-8 text-center rounded-2xl">
                  <Sparkles className="w-12 h-12 text-[#5537a7] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#3d0d73] mb-2">
                    Want to see more?
                  </h3>
                  <p className="text-[#3d0d73]/60 text-sm mb-6 max-w-md mx-auto">
                    Join Aurora App to access the full feed, share your experiences, and earn credits.
                  </p>
                  <Link href="/api/auth/login?provider=GoogleOAuth">
                    <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl px-8 min-h-[48px] font-semibold">
                      Join the Community
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {publicFeed && publicFeed.length === 0 && (
              <Card className="bg-white border-gray-100 p-10 text-center rounded-2xl">
                <Users className="w-14 h-14 text-[#c9cef4] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#3d0d73] mb-2">
                  Be the first to share
                </h3>
                <p className="text-[#3d0d73]/60 text-sm mb-6">
                  Join Aurora App and start sharing your experiences.
                </p>
                <Link href="/api/auth/login?provider=GoogleOAuth">
                  <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl min-h-[44px]">
                    Get Started
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sign Up Card */}
            <Card className="bg-white border-gray-100 p-6 sticky top-20 rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#3d0d73] mb-3 text-lg">Join Aurora App</h3>
              <p className="text-[#3d0d73]/60 text-sm mb-5">
                Get 25 free credits when you sign up. Share experiences, earn more, unlock opportunities.
              </p>
              <div className="space-y-3">
                <Link href="/api/auth/login?provider=GoogleOAuth" className="block">
                  <Button className="w-full bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl min-h-[48px] font-semibold">
                    Sign up with Google
                  </Button>
                </Link>
                <Link href="/api/auth/login?provider=MicrosoftOAuth" className="block">
                  <Button variant="outline" className="w-full border-gray-200 text-[#3d0d73] hover:bg-gray-50 rounded-xl min-h-[48px]">
                    Sign up with Microsoft
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Stats */}
            <Card className="bg-gradient-to-br from-[#5537a7] to-[#3d0d73] p-6 rounded-2xl text-white">
              <h3 className="font-bold mb-4">Community Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "10K+", label: "Women" },
                  { value: "50K+", label: "Posts" },
                  { value: "25K+", label: "Routes" },
                  { value: "4.9★", label: "Rating" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Testimonial */}
            <Card className="bg-white border-gray-100 p-6 rounded-2xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#e5e093] text-[#e5e093]" />
                ))}
              </div>
              <p className="text-[#3d0d73] text-sm mb-4 italic leading-relaxed">
                "Aurora helped me find a safe route to my new job. The community verification gives me peace of mind."
              </p>
              <p className="text-[#3d0d73]/50 text-xs">— Sarah M., Software Engineer</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={36} height={36} className="rounded-xl" />
              <span className="text-[#3d0d73] font-semibold">Aurora App</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-[#3d0d73]/60">
              <Link href="/legal/terms" className="hover:text-[#5537a7]">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-[#5537a7]">Privacy</Link>
            </div>
            <p className="text-[#3d0d73]/50 text-sm flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-[#f29de5]" /> for women everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
