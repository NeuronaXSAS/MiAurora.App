"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuroraWallet } from "@/components/wallet/aurora-wallet";
import { Id } from "@/convex/_generated/dataModel";

export default function WalletPage() {
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-aurora-purple)]/30 border-t-[var(--color-aurora-purple)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <AuroraWallet userId={userId} />
      </div>
    </div>
  );
}
