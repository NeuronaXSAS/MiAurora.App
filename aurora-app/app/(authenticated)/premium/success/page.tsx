"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Sparkles, 
  Crown, 
  Coins,
  ArrowRight,
  Loader2 
} from "lucide-react";
import { motion } from "framer-motion";
import type { Id } from "@/convex/_generated/dataModel";

function PremiumSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type"); // 'subscription' or 'credits'
  
  const awardDailyLogin = useMutation(api.credits.awardDailyLogin);

  useEffect(() => {
    // Simulate processing delay for better UX
    const timer = setTimeout(() => {
      setIsProcessing(false);
      
      // Award daily login bonus as a welcome gesture
      const userId = localStorage.getItem("aurora_user_id");
      if (userId) {
        awardDailyLogin({ userId: userId as Id<"users"> }).catch(() => {
          // Silently fail - not critical
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [awardDailyLogin]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--color-aurora-purple)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Processing your purchase...
            </h2>
            <p className="text-[var(--muted-foreground)]">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-[var(--color-aurora-salmon)]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-aurora-salmon)]/10 flex items-center justify-center">
              <span className="text-3xl">😔</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Something went wrong
            </h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              {error}
            </p>
            <Button onClick={() => router.push("/premium")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-[var(--color-aurora-mint)] overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
            >
              {type === "subscription" ? (
                <Crown className="w-10 h-10" />
              ) : (
                <Coins className="w-10 h-10" />
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold mb-2">
                {type === "subscription" 
                  ? "Welcome to Aurora Premium!" 
                  : "Credits Added!"}
              </h1>
              <p className="text-white/80">
                {type === "subscription"
                  ? "Your premium features are now active"
                  : "Your credits are ready to use"}
              </p>
            </motion.div>
          </div>

          <CardContent className="p-6">
            {/* Success Checkmark */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-aurora-mint)]/20 mb-6">
              <CheckCircle className="w-6 h-6 text-[var(--color-aurora-violet)]" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  Payment successful
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Confirmation sent to your email
                </p>
              </div>
            </div>

            {/* What's Next */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-[var(--foreground)]">
                What&apos;s next?
              </h3>
              
              {type === "subscription" ? (
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Enjoy ad-free browsing across Aurora App
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Your monthly credits have been added
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Access exclusive events and content
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Send gifts to your favorite creators
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Unlock premium opportunities
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)] mt-0.5" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Join paid events and workshops
                    </span>
                  </li>
                </ul>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/feed")}
                className="w-full bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90"
              >
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push("/profile")}
                className="w-full"
              >
                View My Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Reminder */}
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
          Remember: Safety features are always free 💜
        </p>
      </motion.div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--color-aurora-purple)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Loading...
          </h2>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export wrapped in Suspense
export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PremiumSuccessContent />
    </Suspense>
  );
}
