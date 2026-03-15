"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CirclesHub } from "@/components/circles/circles-hub";
import { PendingLikes } from "@/components/circles/pending-likes";
import { Users, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useAuthSession } from "@/hooks/use-auth-session";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { fadeInUp, fadeIn } from "@/lib/motion";

export function CirclesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam === "likes" ? "likes" : "circles");
  const { authToken, isLoading, userId } = useAuthSession();

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === "likes") {
      setActiveTab("likes");
    }
  }, [tabParam]);

  useEffect(() => {
    if (!isLoading && (!userId || !authToken)) {
      router.push("/");
    }
  }, [authToken, isLoading, router, userId]);

  // Get pending likes count for badge
  const pendingLikes = useQuery(
    api.connections.getPendingLikes,
    userId && authToken ? { authToken, userId } : "skip"
  );
  const pendingCount = pendingLikes?.length || 0;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without full navigation
    const url = value === "likes" ? "/circles?tab=likes" : "/circles";
    router.replace(url, { scroll: false });
  };

  if (!userId || !authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 py-6 sm:py-8 relative">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 sm:gap-4"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              {activeTab === "likes" ? (
                <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {activeTab === "likes" ? "Who Likes You" : "Support Circles"}
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {activeTab === "likes"
                  ? "Swipe right to match and connect!"
                  : "Find your tribe, share your journey"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-6 bg-[var(--accent)]/50 h-12 backdrop-blur-sm">
            <TabsTrigger
              value="circles"
              className="flex-1 min-h-[44px] data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--foreground)] transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Circles
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex-1 min-h-[44px] data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--foreground)] transition-all relative"
            >
              <Heart className="w-4 h-4 mr-2" />
              Likes You
              {pendingCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-[var(--color-aurora-pink)] text-white">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="circles" className="mt-0">
            <CirclesHub userId={userId} />
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <PendingLikes authToken={authToken} userId={userId} />
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
}
