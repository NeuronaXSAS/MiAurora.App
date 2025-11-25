"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles, MapPin, Briefcase, Shield, ArrowRight,
  Heart, Users, Star, Lock, ThumbsUp, MessageSquare,
  Route, Play, ChevronDown, X
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FeedAd } from "@/components/ads/feed-ad";

export default function LandingPage() {
  // Use skip pattern to handle errors gracefully
  const publicFeed = useQuery(api.feed.getPublicFeed, { limit: 20 });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  
  // Handle feed loading errors
  useEffect(() => {
    if (publicFeed === undefined) {
      // Still loading
      setFeedError(false);
    }
  }, [publicFeed]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Show signup prompt after scrolling 30% or viewing 3+ posts
      if (progress > 30 && !dismissedPrompt) {
        setShowSignupPrompt(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissedPrompt]);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get("error");

  // Public post card component
  const PublicPostCard = ({ post, index }: { post: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-[var(--card)] border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-4">
          {/* Author */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-lavender)]" />
            <div className="flex-1">
              <p className="font-semibold text-[var(--foreground)] text-sm">
                {post.isAnonymous ? "Anonymous" : post.authorName || "Aurora User"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatDistanceToNow(post._creationTime, { addSuffix: true })}
              </p>
            </div>
            {post.category && (
              <Badge variant="secondary" className="text-xs">
                {post.category}
              </Badge>
            )}
          </div>

          {/* Content */}
          {post.title && (
            <h3 className="font-semibold text-[var(--foreground)] mb-2">{post.title}</h3>
          )}
          <p className="text-[var(--foreground)] text-sm mb-3 line-clamp-3">
            {post.content}
          </p>

          {/* Location */}
          {post.location && (
            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mb-3">
              <MapPin className="w-3 h-3" />
              <span>{post.location}</span>
            </div>
          )}

          {/* Rating */}
          {post.rating && (
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < post.rating ? "fill-[var(--color-aurora-yellow)] text-[var(--color-aurora-yellow)]" : "text-[var(--muted-foreground)]"}`}
                />
              ))}
            </div>
          )}

          {/* Engagement - Blurred to encourage signup */}
          <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)]">
            <button className="flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{post.upvotes || 0}</span>
            </button>
            <button className="flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </button>
            <div className="flex-1" />
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button size="sm" variant="ghost" className="text-[var(--color-aurora-purple)] text-xs">
                Join to interact
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Error Message */}
      {error === "user_not_found" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-aurora-salmon)] rounded-xl p-4 shadow-lg"
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
            <Card className="bg-gradient-to-r from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] border-0 p-4 shadow-2xl">
              <button
                onClick={() => setDismissedPrompt(true)}
                className="absolute top-2 right-2 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Join Aurora App</h4>
                  <p className="text-white/80 text-sm mb-3">
                    Get 25 free credits, share your experiences, and connect with the community.
                  </p>
                  <Link href="/api/auth/login?provider=GoogleOAuth">
                    <Button className="w-full bg-white text-[var(--color-aurora-violet)] hover:bg-white/90 font-semibold">
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

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={40} height={40} className="rounded-xl" />
              <span className="text-lg font-bold text-[var(--foreground)] hidden sm:block">Aurora App</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-full px-4 sm:px-6">
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-[var(--border)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </nav>


      {/* Hero Section - Compact */}
      <section className="bg-gradient-to-b from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-lavender)] border-2 border-[var(--color-aurora-violet)]" />
              ))}
            </div>
            <span className="text-white/80 text-sm ml-2">
              <span className="font-bold text-white">10,000+</span> women trust Aurora App
            </span>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-5xl font-black mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Your Safety. Your Community.{" "}
            <span className="text-[var(--color-aurora-pink)]">Your Growth.</span>
          </motion.h1>

          <motion.p
            className="text-lg text-white/80 mb-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Community-powered safety intelligence for women. Share experiences, earn credits, unlock opportunities.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button size="lg" className="bg-white text-[var(--color-aurora-violet)] hover:bg-white/90 rounded-full px-8 font-semibold">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-white/70">
              <Shield className="w-4 h-4" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Lock className="w-4 h-4" />
              <span>Anonymous Posting</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Users className="w-4 h-4" />
              <span>Community Verified</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="bg-[var(--background)] py-4 text-center border-b border-[var(--border)]">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="inline-flex items-center gap-2 text-[var(--muted-foreground)] text-sm"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Scroll to explore community posts</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Main Content - Feed Preview */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Column */}
          <div className="lg:col-span-2 space-y-4" ref={feedRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Community Feed</h2>
              <Badge variant="outline" className="text-[var(--color-aurora-mint)]">
                <span className="w-2 h-2 bg-[var(--color-aurora-mint)] rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>

            {/* Loading State */}
            {!publicFeed && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[var(--card)] border-[var(--border)] p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[var(--accent)] rounded w-24" />
                        <div className="h-3 bg-[var(--accent)] rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-[var(--accent)] rounded w-full" />
                      <div className="h-4 bg-[var(--accent)] rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Feed Items */}
            {publicFeed && publicFeed.length > 0 && (
              <div className="space-y-4">
                {publicFeed.map((post: any, index: number) => (
                  <div key={post._id}>
                    <PublicPostCard post={post} index={index} />
                    {/* Insert ad every 4 posts */}
                    {(index + 1) % 4 === 0 && <FeedAd />}
                  </div>
                ))}

                {/* Join CTA after feed */}
                <Card className="bg-gradient-to-r from-[var(--color-aurora-lavender)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30 p-6 text-center">
                  <Sparkles className="w-10 h-10 text-[var(--color-aurora-purple)] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                    Want to see more?
                  </h3>
                  <p className="text-[var(--muted-foreground)] text-sm mb-4">
                    Join Aurora App to access the full feed, share your experiences, and earn credits.
                  </p>
                  <Link href="/api/auth/login?provider=GoogleOAuth">
                    <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
                      Join the Community
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </Card>
              </div>
            )}

            {/* Empty State - Show when feed is empty or on error */}
            {(publicFeed && publicFeed.length === 0) && (
              <Card className="bg-[var(--card)] border-[var(--border)] p-8 text-center">
                <Users className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Be the first to share
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-4">
                  Join Aurora App and start sharing your experiences with the community.
                </p>
                <Link href="/api/auth/login?provider=GoogleOAuth">
                  <Button className="bg-[var(--color-aurora-purple)]">Get Started</Button>
                </Link>
              </Card>
            )}
            
            {/* Error fallback - show signup CTA instead of error */}
            {feedError && (
              <Card className="bg-gradient-to-r from-[var(--color-aurora-lavender)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30 p-6 text-center">
                <Sparkles className="w-10 h-10 text-[var(--color-aurora-purple)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                  Join Aurora App
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-4">
                  Sign up to access the community feed, share experiences, and earn credits.
                </p>
                <Link href="/api/auth/login?provider=GoogleOAuth">
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sign Up Card */}
            <Card className="bg-[var(--card)] border-[var(--border)] p-5 sticky top-20">
              <h3 className="font-bold text-[var(--foreground)] mb-3">Join Aurora App</h3>
              <p className="text-[var(--muted-foreground)] text-sm mb-4">
                Get 25 free credits when you sign up. Share experiences, earn more, unlock opportunities.
              </p>
              <div className="space-y-2">
                <Link href="/api/auth/login?provider=GoogleOAuth" className="block">
                  <Button className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
                    Sign up with Google
                  </Button>
                </Link>
                <Link href="/api/auth/login?provider=MicrosoftOAuth" className="block">
                  <Button variant="outline" className="w-full">
                    Sign up with Microsoft
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Features */}
            <Card className="bg-[var(--card)] border-[var(--border)] p-5">
              <h3 className="font-bold text-[var(--foreground)] mb-4">Why Aurora App?</h3>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: "Safety Intelligence", desc: "Rate workplaces & neighborhoods", color: "var(--color-aurora-pink)" },
                  { icon: Route, title: "Safe Routes", desc: "GPS-tracked community routes", color: "var(--color-aurora-blue)" },
                  { icon: Briefcase, title: "Opportunities", desc: "Jobs, mentorship & resources", color: "var(--color-aurora-yellow)" },
                  { icon: Users, title: "Support Circles", desc: "Connect with your tribe", color: "var(--color-aurora-mint)" },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)] text-sm">{feature.title}</p>
                      <p className="text-[var(--muted-foreground)] text-xs">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Testimonial */}
            <Card className="bg-[var(--card)] border-[var(--border)] p-5">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--color-aurora-yellow)] text-[var(--color-aurora-yellow)]" />
                ))}
              </div>
              <p className="text-[var(--foreground)] text-sm mb-3 italic">
                "Aurora helped me find a safe route to my new job. The community verification gives me peace of mind."
              </p>
              <p className="text-[var(--muted-foreground)] text-xs">— Sarah M., Software Engineer</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/Au_Logo_1.png" alt="Aurora App" width={32} height={32} className="rounded-lg" />
              <span className="text-[var(--foreground)] font-semibold">Aurora App</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
              <Link href="/legal/terms" className="hover:text-[var(--foreground)]">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-[var(--color-aurora-pink)]" /> for women everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
