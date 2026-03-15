"use client";

import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface AuthSessionState {
  authToken: string | null;
  email: string | null;
  error: string | null;
  isLoading: boolean;
  isPremium: boolean;
  userId: Id<"users"> | null;
  workosUserId: string | null;
}

const initialState: AuthSessionState = {
  authToken: null,
  email: null,
  error: null,
  isLoading: true,
  isPremium: false,
  userId: null,
  workosUserId: null,
};

export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>(initialState);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setState({
            ...initialState,
            error: data.error || "Not authenticated",
            isLoading: false,
          });
          return;
        }

        setState({
          authToken: data.authToken || null,
          email: data.email || null,
          error: null,
          isLoading: false,
          isPremium: Boolean(data.isPremium),
          userId: (data.userId as Id<"users">) || null,
          workosUserId: data.workosUserId || null,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          ...initialState,
          error: error instanceof Error ? error.message : "Failed to load session",
          isLoading: false,
        });
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
