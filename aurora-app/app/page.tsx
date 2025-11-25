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
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B7A] to-[#E84D5F] rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Aurora</span>
            </div>
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button className="bg-[#FF6B7A] hover:bg-[#E84D5F] text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
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
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE8E8] to-[#FFC285] border-2 border-[#150F22]" />
              ))}
            </div>
            <span className="text-[#FFE8E8] text-sm ml-2">
              <span className="font-bold text-white">10,000+</span> women trust Aurora
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-white">Navigate Life </span>
            <span className="bg-gradient-to-r from-[#FF6B7A] via-[#FFC285] to-[#8B5CF6] bg-clip-text text-transparent">
              Safely
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-[#FFE8E8]/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            The community-powered platform where women share safety intelligence, 
            earn credits, and unlock opportunities together.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button className="bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F] hover:from-[#E84D5F] hover:to-[#C73A4D] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-[#FF6B7A]/25">
                <Heart className="w-5 h-5 mr-2" />
                Join Aurora Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-full px-8 py-6 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Explore Safety Map
            </Button>
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
