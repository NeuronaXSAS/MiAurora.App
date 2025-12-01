"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WifiOff, RefreshCw, Shield, Phone, Heart, Users, MapPin, AlertTriangle } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedContacts, setCachedContacts] = useState<string[]>([]);

  // Try to load cached emergency contacts from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem('aurora_emergency_contacts');
      if (cached) {
        setCachedContacts(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Error loading cached contacts:', e);
    }
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  // International emergency numbers
  const emergencyNumbers = [
    { label: "911", region: "US/CA", href: "tel:911" },
    { label: "112", region: "EU/Int'l", href: "tel:112" },
    { label: "999", region: "UK", href: "tel:999" },
    { label: "000", region: "AU", href: "tel:000" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-aurora-violet)] via-[#1E1535] to-[#231E35] flex items-center justify-center p-4 safe-area-inset">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Offline Icon with pulse animation */}
        <motion.div
          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--color-aurora-orange)]/20 to-[var(--color-aurora-purple)]/20 flex items-center justify-center border-2 border-[var(--color-aurora-orange)]/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <WifiOff className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-aurora-orange)]" />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-white/70 mb-6 text-sm sm:text-base">
          Don't worry — your safety features still work!
        </p>

        {/* Emergency Alert Banner */}
        <Card className="p-4 bg-[var(--color-aurora-orange)]/20 border-[var(--color-aurora-orange)]/40 mb-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-orange)]" />
            <h3 className="text-white font-semibold text-sm">Emergency Services</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {emergencyNumbers.map((num) => (
              <a key={num.label} href={num.href} className="block">
                <Button 
                  variant="secondary" 
                  className="w-full min-h-[52px] font-semibold bg-white/90 hover:bg-white text-[var(--color-aurora-violet)] flex flex-col items-center justify-center py-2"
                >
                  <Phone className="w-4 h-4 mb-0.5" />
                  <span className="text-base font-bold">{num.label}</span>
                  <span className="text-[10px] opacity-70">{num.region}</span>
                </Button>
              </a>
            ))}
          </div>
        </Card>

        {/* Cached Emergency Contacts */}
        {cachedContacts.length > 0 && (
          <Card className="p-4 bg-[var(--color-aurora-purple)]/20 border-[var(--color-aurora-purple)]/30 mb-4 text-left backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[var(--color-aurora-pink)]" />
              Your Emergency Contacts
            </h3>
            <div className="space-y-2">
              {cachedContacts.slice(0, 3).map((contact, idx) => (
                <a 
                  key={idx} 
                  href={`tel:${contact}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-pink)]/30 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                  </div>
                  <span className="text-white font-medium">{contact}</span>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Available Offline Features */}
        <Card className="p-4 sm:p-6 bg-white/5 border-white/10 mb-6 text-left backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
            <Shield className="w-5 h-5 text-[var(--color-aurora-mint)]" />
            Available Offline
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-orange)]/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[var(--color-aurora-orange)]" />
              </div>
              <div>
                <span className="font-medium text-white">Emergency SOS</span>
                <p className="text-xs text-white/60">One-tap emergency calls</p>
              </div>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-purple)]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              </div>
              <div>
                <span className="font-medium text-white">Trusted Contacts</span>
                <p className="text-xs text-white/60">Cached for offline access</p>
              </div>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-pink)]/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              </div>
              <div>
                <span className="font-medium text-white">Safety Resources</span>
                <p className="text-xs text-white/60">Saved guides & tips</p>
              </div>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-blue)]/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[var(--color-aurora-blue)]" />
              </div>
              <div>
                <span className="font-medium text-white">Location Sharing</span>
                <p className="text-xs text-white/60">Queued when online</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full min-h-[52px] bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Checking connection...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </>
          )}
        </Button>

        <p className="text-white/50 text-xs sm:text-sm mt-6 flex items-center justify-center gap-1">
          Aurora keeps you safe, online or offline 
          <Heart className="w-3 h-3 text-[var(--color-aurora-pink)] inline" />
        </p>
      </motion.div>
    </div>
  );
}
