"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Briefcase, Shield, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LandingPage() {
  // Fetch public activity (no auth required)
  const activities = useQuery(api.feed.getPublicActivity, { limit: 5 });

  return (
    <div className="relative min-h-screen bg-[#0a0118] overflow-hidden">
      {/* Animated Aurora Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Glassmorphic Navbar */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Image 
              src="/Au_Logo_1.png" 
              alt="Aurora App" 
              width={180} 
              height={60}
              className="h-12 w-auto"
            />
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button 
                variant="outline" 
                className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Floating Glass Elements */}
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-white/10"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-10 w-24 h-24 backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-white/10"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 backdrop-blur-xl bg-white/10 border-white/20 text-white px-6 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              The Front Page of the Internet for Women
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Aurora App
          </motion.h1>
          
          <motion.p 
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Share Intelligence. Earn Credits.
          </motion.p>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Navigate life safely and advance your career with community power.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/api/auth/login?provider=GoogleOAuth" className="group">
              <motion.div
                className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-3 text-white font-semibold text-lg">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </div>
              </motion.div>
            </Link>
            
            <Link href="/api/auth/login?provider=MicrosoftOAuth" className="group">
              <motion.div
                className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-3 text-white font-semibold text-lg">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M13 1h10v10H13z" />
                    <path fill="#7fba00" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  Continue with Microsoft
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Live Activity HUD */}
          <motion.div 
            className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <h3 className="text-lg font-bold text-white">
                  Live Community Activity
                </h3>
              </div>
              <span className="text-xs text-gray-400 backdrop-blur-xl bg-white/5 px-3 py-1 rounded-full">Real-time</span>
            </div>
            
            {!activities && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3 animate-pulse"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-3 h-3 bg-purple-500/50 rounded-full" />
                    <div className="h-4 bg-white/10 rounded flex-1" />
                  </motion.div>
                ))}
              </div>
            )}

            {activities && activities.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No recent activity. Be the first to contribute!
              </div>
            )}

            {activities && activities.length > 0 && (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={`${activity.timestamp}-${index}`}
                    className="flex items-start gap-4 backdrop-blur-xl bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all duration-300 border border-white/5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        activity.color === "green" ? "bg-green-500/20" :
                        activity.color === "blue" ? "bg-blue-500/20" : "bg-purple-500/20"
                      }`}>
                        {activity.type === "post" && <Shield className="w-5 h-5 text-green-400" />}
                        {activity.type === "route" && <MapPin className="w-5 h-5 text-blue-400" />}
                        {activity.type === "opportunity" && <Briefcase className="w-5 h-5 text-purple-400" />}
                      </div>
                      <motion.div
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                          activity.color === "green" ? "bg-green-500" :
                          activity.color === "blue" ? "bg-blue-500" : "bg-purple-500"
                        }`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bento Grid Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-24">
          {[
            { icon: Shield, title: "Safety Intelligence", desc: "Share and access safety ratings for workplaces, venues, and neighborhoods", color: "from-purple-500 to-pink-500" },
            { icon: Briefcase, title: "Career Opportunities", desc: "Unlock vetted jobs, mentorship, and resources with earned credits", color: "from-pink-500 to-rose-500" },
            { icon: MapPin, title: "Interactive Map", desc: "Navigate cities safely with real-time community-verified safety data", color: "from-cyan-500 to-blue-500" },
            { icon: TrendingUp, title: "Credit Economy", desc: "Contribute to the community and earn credits to unlock premium opportunities", color: "from-green-500 to-emerald-500" },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
              
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works - Interactive Path */}
        <div className="mt-32 max-w-5xl mx-auto relative">
          <motion.h2 
            className="text-5xl font-black text-center mb-20 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          
          {/* Glowing Connection Line */}
          <svg className="absolute top-40 left-0 w-full h-32 -z-10" viewBox="0 0 1000 100">
            <motion.path
              d="M 50 50 Q 250 20, 500 50 T 950 50"
              stroke="url(#gradient)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              { num: "1", title: "Share & Contribute", desc: "Rate workplaces, venues, and spaces. Help other women navigate safely.", color: "from-purple-500 to-pink-500" },
              { num: "2", title: "Earn Credits", desc: "Get rewarded with credits for every contribution and verification.", color: "from-pink-500 to-rose-500" },
              { num: "3", title: "Unlock Opportunities", desc: "Use credits to access jobs, mentorship, resources, and exclusive events.", color: "from-cyan-500 to-blue-500" },
            ].map((step, index) => (
              <motion.div
                key={step.num}
                className="text-center relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.3 }}
              >
                <motion.div
                  className={`w-24 h-24 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center text-4xl font-black text-white mx-auto mb-6 shadow-2xl`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(168, 85, 247, 0.5)",
                      "0 0 40px rgba(236, 72, 153, 0.5)",
                      "0 0 20px rgba(168, 85, 247, 0.5)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {step.num}
                </motion.div>
                <h3 className="font-bold text-2xl text-white mb-4">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Massive CTA */}
        <motion.div 
          className="mt-32 text-center relative"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-3xl" />
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-[3rem] p-16 max-w-4xl mx-auto">
            <motion.h2 
              className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Ready to Get Started?
            </motion.h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of women building a safer, more equitable world.
            </p>
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.button
                  className="relative px-12 py-6 text-xl font-bold text-white rounded-2xl overflow-hidden group"
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(168, 85, 247, 0.5)",
                      "0 0 60px rgba(236, 72, 153, 0.5)",
                      "0 0 30px rgba(168, 85, 247, 0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                  <span className="relative flex items-center gap-3">
                    Sign Up Now - Get 25 Free Credits
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                </motion.button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-32 py-12 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Aurora App. Made with <span className="text-pink-400">❤️</span> for women everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
