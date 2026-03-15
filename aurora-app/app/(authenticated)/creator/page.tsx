"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatorStudio } from "@/components/creator/creator-studio";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function CreatorPage() {
  const router = useRouter();
  const { authToken, error, isLoading, userId } = useAuthSession();

  useEffect(() => {
    if (!isLoading && (!userId || !authToken) && error) {
      router.push("/");
    }
  }, [authToken, error, isLoading, router, userId]);

  if (!userId || !authToken) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-aurora-purple)]/30 border-t-[var(--color-aurora-purple)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <CreatorStudio authToken={authToken} userId={userId} />
      </div>
    </div>
  );
}
