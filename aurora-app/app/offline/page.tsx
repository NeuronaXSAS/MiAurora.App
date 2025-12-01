"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WifiOff, RefreshCw, Shield, Phone, Heart } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#150F22] via-[#1E1535] to-[#231E35] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Offline Icon */}
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B7A]/20 to-[#8B5CF6]/20 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <WifiOff className="w-12 h-12 text-[#FF6B7A]" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-white/60 mb-8">
          Don't worry, your safety features still work!
        </p>

        {/* Emergency Call Buttons */}
        <Card className="p-4 bg-[var(--color-aurora-orange)]/20 border-[var(--color-aurora-orange)]/30 mb-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Emergency Services</h3>
          <div className="flex gap-2">
            <a href="tel:911" className="flex-1">
              <Button variant="secondary" className="w-full min-h-[48px] font-semibold">
                <Phone className="w-4 h-4 mr-2" />
                911 (US)
              </Button>
            </a>
            <a href="tel:112" className="flex-1">
              <Button variant="secondary" className="w-full min-h-[48px] font-semibold">
                <Phone className="w-4 h-4 mr-2" />
                112 (EU)
              </Button>
            </a>
          </div>
        </Card>

        {/* Emergency Features Card */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6 text-left">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FF6B7A]" />
            Available Offline
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-red-400" />
              </div>
              <span>Emergency SOS Button</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <span>Emergency Contacts</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[#FFC285]/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-[#FFC285]" />
              </div>
              <span>Saved Resources</span>
            </li>
          </ul>
        </Card>

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          className="w-full bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F] hover:from-[#E84D5F] hover:to-[#C73A4D]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        <p className="text-white/40 text-sm mt-6">
          Aurora keeps you safe, online or offline 💜
        </p>
      </motion.div>
    </div>
  );
}
