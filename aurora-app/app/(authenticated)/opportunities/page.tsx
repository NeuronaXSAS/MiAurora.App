"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OpportunityCard } from "@/components/opportunity-card";
import { OpportunityCardSkeleton } from "@/components/loading-skeleton";
import { OpportunityCreateDialog } from "@/components/opportunity-create-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Briefcase, Loader2, Sparkles, Plus, Settings } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function OpportunitiesPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Fetch opportunities
  const opportunities = useQuery(api.opportunities.list, {
    category: category as any,
  });

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Fetch user's unlocked opportunities
  const unlockedOpportunities = useQuery(
    api.opportunities.getUserUnlocks,
    userId ? { userId } : "skip"
  );

  const unlockOpportunity = useMutation(api.opportunities.unlock);

  const handleUnlock = async (opportunityId: Id<"opportunities">) => {
    if (!userId) return;
    
    try {
      await unlockOpportunity({
        userId,
        opportunityId,
      });
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Failed to unlock opportunity: " + (error as Error).message);
    }
  };

  const isUnlocked = (opportunityId: string) => {
    return unlockedOpportunities?.some((opp: any) => opp._id === opportunityId) || false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Opportunities</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Unlock jobs, mentorship, and resources
                </p>
              </div>
            </div>

            {/* User Credits */}
            {user && (
              <div className="flex items-center gap-3 sm:gap-4 bg-purple-50 sm:bg-transparent rounded-lg p-3 sm:p-0">
                <div className="flex-1 sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-600">Your Credits</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{user.credits}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            )}
          </div>

          {/* Filter and Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Select
              value={category || "all"}
              onValueChange={(value) =>
                setCategory(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="mentorship">Mentorship</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Link href="/opportunities/my-opportunities">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  My Opportunities
                </Button>
              </Link>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Opportunity
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Loading State */}
          {opportunities === undefined && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {opportunities && opportunities.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
              <p className="text-gray-600">
                Check back soon for new opportunities!
              </p>
            </div>
          )}

          {/* Opportunities Grid */}
          {opportunities && opportunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  isUnlocked={isUnlocked(opportunity._id)}
                  userCredits={user?.credits || 0}
                  currentUserId={userId || undefined}
                  onUnlock={() => handleUnlock(opportunity._id)}
                />
              ))}
            </div>
          )}

          {/* Earn More Credits CTA */}
          {user && user.credits < 50 && (
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Need More Credits?</h3>
                  <p className="text-gray-700 mb-4">
                    Earn credits by contributing to the community:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Create a post: <span className="font-semibold text-purple-600">+10 credits</span></li>
                    <li>• Verify a post: <span className="font-semibold text-purple-600">+5 credits</span></li>
                    <li>• Help other women navigate safely and earn rewards!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Opportunity Dialog */}
      {userId && (
        <OpportunityCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          userId={userId}
        />
      )}
    </div>
  );
}
