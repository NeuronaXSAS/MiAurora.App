"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize PostHog
    initPostHog();
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
