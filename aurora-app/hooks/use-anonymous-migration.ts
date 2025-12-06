"use client";

/**
 * Task 10.3: Anonymous → Member Migration Hook
 * 
 * Automatically migrates anonymous debate history when user signs up.
 * Preserves: pseudonym, country flag, votes, comments
 */

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getAnonymousProfile,
  clearAnonymousProfile,
  isMigrationPending,
  clearMigrationPending,
  getMigrationSummary,
} from "@/lib/anonymous-session";

interface MigrationResult {
  success: boolean;
  migratedComments: number;
  migratedVotes: number;
  pseudonym?: string;
  countryFlag?: string;
  error?: string;
}

interface UseMigrationReturn {
  // State
  hasPendingMigration: boolean;
  migrationSummary: ReturnType<typeof getMigrationSummary>;
  isMigrating: boolean;
  migrationResult: MigrationResult | null;
  
  // Actions
  performMigration: (userId: Id<"users">) => Promise<MigrationResult>;
  dismissMigration: () => void;
}

export function useAnonymousMigration(): UseMigrationReturn {
  const [hasPendingMigration, setHasPendingMigration] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState(getMigrationSummary());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  
  const migrateToUser = useMutation(api.anonymousDebaters.migrateToUser);

  // Check for pending migration on mount
  useEffect(() => {
    const summary = getMigrationSummary();
    setMigrationSummary(summary);
    setHasPendingMigration(summary.hasPendingMigration && summary.totalInteractions > 0);
  }, []);

  const performMigration = useCallback(async (userId: Id<"users">): Promise<MigrationResult> => {
    const profile = getAnonymousProfile();
    
    if (!profile?.sessionHash) {
      return {
        success: false,
        migratedComments: 0,
        migratedVotes: 0,
        error: "No anonymous profile found",
      };
    }

    setIsMigrating(true);
    
    try {
      const result = await migrateToUser({
        sessionHash: profile.sessionHash,
        userId,
      });

      if (result.success) {
        // Clear local anonymous data
        clearAnonymousProfile();
        clearMigrationPending();
        setHasPendingMigration(false);
        
        const migrationResult: MigrationResult = {
          success: true,
          migratedComments: result.migratedComments || 0,
          migratedVotes: result.migratedVotes || 0,
          pseudonym: result.pseudonym,
          countryFlag: result.countryFlag,
        };
        
        setMigrationResult(migrationResult);
        return migrationResult;
      } else {
        return {
          success: false,
          migratedComments: 0,
          migratedVotes: 0,
          error: result.message || "Migration failed",
        };
      }
    } catch (error) {
      const errorResult: MigrationResult = {
        success: false,
        migratedComments: 0,
        migratedVotes: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      setMigrationResult(errorResult);
      return errorResult;
    } finally {
      setIsMigrating(false);
    }
  }, [migrateToUser]);

  const dismissMigration = useCallback(() => {
    clearAnonymousProfile();
    clearMigrationPending();
    setHasPendingMigration(false);
    setMigrationResult(null);
  }, []);

  return {
    hasPendingMigration,
    migrationSummary,
    isMigrating,
    migrationResult,
    performMigration,
    dismissMigration,
  };
}
