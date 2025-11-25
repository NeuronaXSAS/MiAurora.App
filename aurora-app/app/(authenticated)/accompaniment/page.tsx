"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SisterAccompaniment } from "@/components/sister-accompaniment";
import { Id } from "@/convex/_generated/dataModel";

export default function AccompanimentPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aurora-violet" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-aurora-violet mb-2">
          Sister Accompaniment
        </h1>
        <p className="text-gray-600">
          Share your journey with trusted companions for added safety
        </p>
      </div>

      <SisterAccompaniment userId={userId} />
    </div>
  );
}
