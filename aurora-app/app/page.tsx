"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, MapPin, Briefcase, Shield, TrendingUp, ArrowRight, 
  Heart, Users, Star, CheckCircle, Globe, Lock
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LandingPage() {
  const activities = useQuery(api.feed.getPublicActivity, { limit: 5 });
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const error = searchParams?.get('error');

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#150F22] via-[#1E1535] to-[#231E35] overflow-hidden">
      {/* Error Message */}
      {error === 'user_not_found' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FF6B7A]/90 border border-[#FF6B7A] rounded-2xl p-4 shadow-2xl"
          >
            <p className="text-white font-semibold mb-1">⚠️ Session Expired</p>
            <p className="text-white/90 text-sm">Please sign in again to continue.</p>
          </motion.div>
        </div>
      )}

      {/* Subtle Aurora Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#FF6B7A]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[#FFC285]/10 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/Au_Logo_1.png" 
                alt="Aurora App" 
                width={44} 
                height={44}
                className="rounded-xl"
              />
              <span className="text-xl font-bold text-white">Aurora App</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/api/auth/login?provider=MicrosoftOAuth">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-4 hidden sm:flex">
                  Microsoft
                </Button>
              </Link>
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button className="bg-[#2e2ad6] hover:bg-[#2e2ad6]/90 text-white rounded-full px-6">
                  Sign in with Google
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f29de5] to-[#c9cef4] border-2 border-[#3d0d73]" />
              ))}
            </div>
            <span className="text-[#c9cef4] text-sm ml-2">
              <span className="font-bold text-white">10,000+</span> women trust Aurora App
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-[#fffaf1]">Your Safety. </span>
            <span className="text-[#fffaf1]">Your Community. </span>
            <span className="bg-gradient-to-r from-[#f29de5] via-[#c9cef4] to-[#2e2ad6] bg-clip-text text-transparent">
              Your Growth.
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-[#c9cef4]/90 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Aurora App — the community-powered platform where women share safety intelligence, 
            earn credits, and unlock opportunities together.
          </motion.p>

          {/* CTA Buttons - Auth Entry */}
          <motion.div 
            className="flex flex-col gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-[#fffaf1]/10 backdrop-blur-sm border border-[#c9cef4]/30 rounded-3xl p-8 max-w-md w-full">
              <p className="text-[#fffaf1] font-semibold mb-6 text-center">Sign in securely</p>
              <div className="space-y-3">
                <Link href="/api/auth/login?provider=GoogleOAuth" className="block">
                  <Button className="w-full bg-[#fffaf1] hover:bg-[#fffaf1]/90 text-[#3d0d73] border-2 border-[#2e2ad6] rounded-xl py-6 text-lg font-semibold">
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </Button>
                </Link>
                <Link href="/api/auth/login?provider=MicrosoftOAuth" className="block">
                  <Button className="w-full bg-[#fffaf1] hover:bg-[#fffaf1]/90 text-[#3d0d73] border-2 border-[#2e2ad6] rounded-xl py-6 text-lg font-semibold">
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                    Continue with Microsoft
                  </Button>
                </Link>
              </div>
              <p className="text-[#c9cef4]/60 text-sm text-center mt-4 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" />
                Secure & Private by Design
              </p>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 text-sm text-[#FFE8E8]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Anonymous Posting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Community Verified</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: "Safety Intelligence", desc: "Share and access safety ratings for workplaces and neighborhoods", color: "#FF6B7A" },
            { icon: MapPin, title: "Safe Routes", desc: "GPS-tracked routes rated by the community", color: "#8B5CF6" },
            { icon: Briefcase, title: "Opportunities", desc: "Unlock jobs, mentorship, and resources with credits", color: "#FFC285" },
            { icon: Users, title: "Support Circles", desc: "Connect with women who understand your journey", color: "#10B981" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-[#FFE8E8]/60 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Trusted by Women Worldwide
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Sarah M.", role: "Software Engineer", quote: "Aurora helped me find a safe route to my new job. The community verification gives me peace of mind.", rating: 5 },
            { name: "Maria L.", role: "Student", quote: "The workplace safety ratings helped me avoid a toxic company. This platform is a game-changer.", rating: 5 },
            { name: "Aisha K.", role: "Entrepreneur", quote: "I've connected with amazing mentors through Aurora. The credit system makes it fair for everyone.", rating: 5 },
          ].map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#FFC285] text-[#FFC285]" />
                ))}
              </div>
              <p className="text-[#FFE8E8]/80 mb-4 text-sm leading-relaxed">"{testimonial.quote}"</p>
              <div>
                <p className="text-white font-semibold">{testimonial.name}</p>
                <p className="text-[#FFE8E8]/50 text-sm">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Activity */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-pulse" />
              <h3 className="text-lg font-bold text-white">Live Community Activity</h3>
            </div>
            
            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 4).map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE8E8] to-[#FFC285]" />
                    <p className="text-[#FFE8E8]/80 text-sm flex-1">{activity.message}</p>
                    <span className="text-[#FFE8E8]/40 text-xs">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#FFE8E8]/50 text-center py-8">Loading activity...</p>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Join?
          </h2>
          <p className="text-xl text-[#FFE8E8]/70 mb-10">
            Get 25 free credits when you sign up. Start contributing and unlock opportunities.
          </p>
          <Link href="/api/auth/login?provider=GoogleOAuth">
            <Button className="bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F] hover:from-[#E84D5F] hover:to-[#C73A4D] text-white rounded-full px-12 py-6 text-xl font-bold shadow-xl shadow-[#FF6B7A]/30">
              Get Started Free
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#FFE8E8]/40 text-sm">
            © 2025 Aurora App. Made with <Heart className="w-3 h-3 inline text-[#FF6B7A]" /> for women everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
