"use client";

import { Suspense } from "react";
import { CirclesPageContent } from "./circles-content";

export default function CirclesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full" />
        </div>
      }
    >
      <CirclesPageContent />
    </Suspense>
  );
}
