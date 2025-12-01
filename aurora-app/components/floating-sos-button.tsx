"use client";

import { useState } from "react";
import { Shield, X, Phone, MapPin, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function FloatingSOSButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSOSClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    setShowConfirm(false);
    router.push("/emergency");
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Main SOS Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleSOSClick}
        className={cn(
          "fixed top-4 right-4 z-50",
          "w-14 h-14 min-w-[56px] min-h-[56px] rounded-full",
          "bg-gradient-to-br from-[var(--color-aurora-orange)] to-red-600",
          "shadow-2xl shadow-[var(--color-aurora-orange)]/50",
          "flex items-center justify-center",
          "transition-all duration-200",
          "active:scale-90",
          "hover:shadow-[var(--color-aurora-orange)]/70",
          "border-2 border-white/30"
        )}
        style={{ 
          paddingTop: "env(safe-area-inset-top)",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }}
        aria-label="Emergency SOS - Tap to access emergency options"
        role="button"
      >
        <Shield className="w-7 h-7 text-white drop-shadow-lg" />
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={handleCancel}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-sm"
            >
              <div className="bg-gradient-to-br from-aurora-violet to-aurora-blue rounded-3xl p-6 shadow-2xl border border-white/10">
                {/* Close Button */}
                <button
                  onClick={handleCancel}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-aurora-orange/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-aurora-orange" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white text-center mb-2">
                  Emergency Alert
                </h3>

                {/* Description */}
                <p className="text-white/80 text-center mb-6">
                  This will activate your emergency protocol and notify your trusted contacts.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleConfirm}
                    className={cn(
                      "w-full py-4 min-h-[56px] rounded-2xl font-semibold",
                      "bg-gradient-to-r from-[var(--color-aurora-orange)] to-red-600",
                      "text-white shadow-lg text-lg",
                      "transition-all duration-200",
                      "active:scale-95",
                      "flex items-center justify-center gap-2"
                    )}
                    aria-label="Activate emergency alert"
                  >
                    <Shield className="w-6 h-6" />
                    Activate Emergency
                  </button>

                  <button
                    onClick={handleCancel}
                    className={cn(
                      "w-full py-4 min-h-[52px] rounded-2xl font-semibold",
                      "bg-white/10 hover:bg-white/20",
                      "text-white",
                      "transition-all duration-200",
                      "active:scale-95"
                    )}
                    aria-label="Cancel and close"
                  >
                    Cancel
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-white/60 text-center mb-3">
                    Quick Actions
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        // Use tel:112 for international emergency (works in most countries)
                        window.location.href = "tel:112";
                      }}
                      className="flex-1 py-4 min-h-[52px] rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                      aria-label="Call emergency services"
                    >
                      <Phone className="w-5 h-5 text-white" />
                      <span className="text-sm font-medium text-white">Emergency Call</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push("/map");
                        setShowConfirm(false);
                      }}
                      className="flex-1 py-4 min-h-[52px] rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                      aria-label="Share your location"
                    >
                      <MapPin className="w-5 h-5 text-white" />
                      <span className="text-sm font-medium text-white">Share Location</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
