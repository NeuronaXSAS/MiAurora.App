"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

/**
 * Global Floating Action Button for Route Tracking
 * 
 * This elegant circular button appears on all mobile views, centered above the bottom navigation.
 * 
 * TO REPLACE WITH AURORA LOGO:
 * 1. Add your logo image to /public/aurora-logo.svg (or .png)
 * 2. Replace the Sparkles icon below with:
 *    <img src="/aurora-logo.svg" alt="Aurora" className="w-8 h-8" />
 * 3. Adjust size (w-8 h-8) as needed for your logo
 */
export function RouteTrackingFAB() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/routes/track")}
      className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 group relative"
      aria-label="Start tracking route"
    >
      {/* Subtle pulse animation ring */}
      <div className="absolute inset-0 rounded-full bg-aurora-violet/30 animate-ping" />
      
      {/* Logo Container - REPLACE THIS SECTION WITH YOUR LOGO */}
      <div className="relative z-10">
        {/* Temporary placeholder - Replace with your Aurora logo */}
        <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-200" />
        
        {/* When you have your logo, use this instead:
        <img 
          src="/aurora-logo.svg" 
          alt="Aurora" 
          className="w-8 h-8 group-hover:scale-110 transition-transform duration-200"
        />
        */}
      </div>
    </button>
  );
}
