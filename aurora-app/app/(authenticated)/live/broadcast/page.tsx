"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

// Dynamically import BroadcastStudio with no SSR to avoid window/Agora SDK issues
const BroadcastStudio = dynamic(
  () => import("@/components/live/broadcast-studio").then(mod => ({ default: mod.BroadcastStudio })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }
);

export default function BroadcastPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return <BroadcastStudio userId={userId} />;
}
