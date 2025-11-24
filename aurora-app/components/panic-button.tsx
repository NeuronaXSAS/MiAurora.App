"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hapticFeedback } from "@/lib/mobile-utils";

interface PanicButtonProps {
  testMode?: boolean;
}

export function PanicButton({ testMode = false }: PanicButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerAlert = useMutation(api.emergency.triggerEmergencyAlert);
  const resolveAlert = useMutation(api.emergency.resolveEmergencyAlert);
  const [alertId, setAlertId] = useState<string | null>(null);

  const startPanicSequence = () => {
    setIsPressed(true);
    setCountdown(5);
    hapticFeedback([50, 100, 50]); // Triple vibration

    // Start countdown
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          activatePanic();
          return 0;
        }
        hapticFeedback(30); // Vibrate each second
        return prev - 1;
      });
    }, 1000);
  };

  const cancelPanic = () => {
    setIsPressed(false);
    setCountdown(5);
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    hapticFeedback(10); // Single short vibration
  };

  const activatePanic = async () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }

    setIsTriggered(true);
    hapticFeedback([100, 50, 100, 50, 100]); // Strong alert pattern

    if (testMode) {
      console.log("TEST MODE: Panic button activated");
      setTimeout(() => {
        setIsTriggered(false);
        setIsPressed(false);
      }, 3000);
      return;
    }

    // Get current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await triggerAlert({
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
              alertType: "panic",
            });
            setAlertId(result.alertId);
          } catch (error) {
            console.error("Failed to trigger alert:", error);
            setIsTriggered(false);
            setIsPressed(false);
          }
        },
        (error) => {
          console.error("Location error:", error);
          // Trigger without location
          triggerAlert({
            location: { lat: 0, lng: 0 },
            alertType: "panic",
          }).then((result) => {
            setAlertId(result.alertId);
          });
        }
      );
    }
  };

  const markSafe = async () => {
    if (alertId) {
      await resolveAlert({
        alertId: alertId as any,
        status: "resolved",
        notes: "User marked themselves as safe",
      });
    }
    setIsTriggered(false);
    setIsPressed(false);
    setAlertId(null);
    hapticFeedback(50);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  if (isTriggered) {
    return (
      <div className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center p-6 animate-pulse">
        <div className="bg-white rounded-full p-8 mb-6 animate-bounce">
          <AlertTriangle className="w-24 h-24 text-red-600" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          🚨 EMERGENCY ALERT ACTIVE
        </h1>
        <p className="text-xl text-white mb-8 text-center max-w-md">
          Your emergency contacts and nearby users have been notified.
          Help is on the way.
        </p>
        <Button
          size="lg"
          onClick={markSafe}
          className="bg-white text-red-600 hover:bg-gray-100 text-xl px-12 py-6 h-auto"
        >
          <Shield className="w-6 h-6 mr-3" />
          I'm Safe Now
        </Button>
        {testMode && (
          <p className="text-white mt-4 text-sm">TEST MODE - No real alerts sent</p>
        )}
      </div>
    );
  }

  if (isPressed) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-64 h-64 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
            <div className="text-white text-center">
              <div className="text-8xl font-bold mb-2">{countdown}</div>
              <div className="text-xl">Activating Emergency Alert</div>
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-full border-8 border-white"
            style={{
              animation: `shrink ${countdown}s linear`,
            }}
          />
        </div>
        <Button
          size="lg"
          variant="outline"
          onClick={cancelPanic}
          className="mt-12 bg-white text-black hover:bg-gray-200 text-xl px-12 py-6 h-auto"
        >
          <X className="w-6 h-6 mr-3" />
          Cancel
        </Button>
        <p className="text-white mt-6 text-center max-w-md">
          Release to cancel. Emergency services will be notified in {countdown} seconds.
        </p>
        {testMode && (
          <p className="text-yellow-400 mt-4 text-sm">TEST MODE - No real alerts will be sent</p>
        )}
      </div>
    );
  }

  return (
    <button
      onMouseDown={startPanicSequence}
      onMouseUp={cancelPanic}
      onMouseLeave={cancelPanic}
      onTouchStart={startPanicSequence}
      onTouchEnd={cancelPanic}
      className="fixed top-20 right-4 lg:bottom-24 lg:top-auto lg:right-6 w-14 h-14 lg:w-16 lg:h-16 bg-aurora-orange hover:bg-aurora-orange/90 rounded-full shadow-2xl flex items-center justify-center z-[9999] transition-transform active:scale-95 border-4 border-white animate-pulse"
      style={{ boxShadow: '0 0 30px rgba(236, 76, 40, 0.6)' }}
      aria-label="Emergency SOS Button - Hold to activate"
      title="Emergency SOS - Hold to activate"
    >
      <AlertTriangle className="w-10 h-10 text-white drop-shadow-lg" />
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
        <span className="text-aurora-orange text-xs font-bold">SOS</span>
      </div>
    </button>
  );
}

// Add keyframe animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shrink {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
