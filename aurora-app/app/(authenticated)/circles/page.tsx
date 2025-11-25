"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CirclesHub } from "@/components/circles/circles-hub";
import { Id } from "@/convex/_generated/dataModel";
import { Users } from "lucide-react";

export default function CirclesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Support Circles</h1>
              <p className="text-white/80">Find your tribe, share your journey</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <CirclesHub userId={userId} />
      </div>
    </div>
  );
}
