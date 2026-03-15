"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuroraWallet } from "@/components/wallet/aurora-wallet";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function WalletPage() {
  const router = useRouter();
  const { authToken, isLoading, userId } = useAuthSession();

  useEffect(() => {
    if (!isLoading && (!userId || !authToken)) {
      router.push("/");
    }
  }, [authToken, isLoading, router, userId]);

  if (!userId || !authToken) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-aurora-purple)]/30 border-t-[var(--color-aurora-purple)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <AuroraWallet authToken={authToken} userId={userId} />
      </div>
    </div>
  );
}
