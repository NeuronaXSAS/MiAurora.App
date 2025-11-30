"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, GraduationCap, FileText, Calendar, DollarSign, Lock, CheckCircle2, Star, MoreVertical, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface OpportunityCardProps {
  opportunity: {
    _id: string;
    creatorId?: string;
    title: string;
    description: string;
    category: string;
    creditCost: number;
    companyName?: string;
    company?: string;
    salaryRange?: string;
    salary?: string;
    safetyRating?: number;
    externalUrl?: string;
    externalLink?: string;
    thumbnailStorageId?: string;
    location?: string;
    requirements?: string[];
    contactEmail?: string;
  };
  isUnlocked: boolean;
  userCredits: number;
  currentUserId?: Id<"users">;
  onUnlock: () => void;
  onDelete?: () => void;
}

const categoryIcons = {
  job: Briefcase,
  mentorship: GraduationCap,
  resource: FileText,
  event: Calendar,
  funding: DollarSign,
};

const categoryColors = {
  job: "bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]",
  mentorship: "bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-violet)]",
  resource: "bg-[var(--color-aurora-mint)]/30 text-green-700",
  event: "bg-[var(--color-aurora-yellow)]/30 text-yellow-800",
  funding: "bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]",
};

export function OpportunityCard({
  opportunity,
  isUnlocked,
  userCredits,
  currentUserId,
  onUnlock,
  onDelete,
}: OpportunityCardProps) {
  const Icon = categoryIcons[opportunity.category as keyof typeof categoryIcons] || Briefcase;
  const colorClass = categoryColors[opportunity.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
  const canAfford = userCredits >= opportunity.creditCost;
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const isCreator = currentUserId === opportunity.creatorId;

  const deleteOpportunity = useMutation(api.opportunities.deleteOpportunity);

  const handleDelete = async () => {
    if (!currentUserId || !isCreator) return;

    if (!confirm("Are you sure? Users who unlocked this opportunity will keep access, but you'll stop earning credits from new unlocks.")) {
      return;
    }

    try {
      await deleteOpportunity({
        opportunityId: opportunity._id as Id<"opportunities">,
        userId: currentUserId,
      });
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete opportunity: " + (error as Error).message);
    }
  };

  // Fetch thumbnail URL if storage ID exists
  useEffect(() => {
    if (opportunity.thumbnailStorageId) {
      fetch(`/api/files/url?storageId=${opportunity.thumbnailStorageId}`)
        .then((res) => res.json())
        .then((data) => setThumbnailUrl(data.url))
        .catch((err) => console.error("Error fetching thumbnail:", err));
    }
  }, [opportunity.thumbnailStorageId]);

  const companyName = opportunity.company || opportunity.companyName;
  const salaryInfo = opportunity.salary || opportunity.salaryRange;
  const externalUrl = opportunity.externalLink || opportunity.externalUrl;

  return (
    <Card className={`hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)] ${!isUnlocked && !canAfford ? 'opacity-75' : ''}`}>
      {/* Thumbnail Image */}
      {thumbnailUrl && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={thumbnailUrl}
            alt={opportunity.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {!thumbnailUrl && (
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-[var(--foreground)] line-clamp-2 sm:truncate">{opportunity.title}</h3>
                <Badge className={`${colorClass} flex-shrink-0 text-xs`}>
                  {opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)}
                </Badge>
              </div>
              {companyName && (
                <p className="text-sm text-[var(--muted-foreground)] truncate">{companyName}</p>
              )}
              {opportunity.location && (
                <p className="text-xs text-[var(--muted-foreground)] truncate">{opportunity.location}</p>
              )}
            </div>
          </div>
          {isCreator && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0 -mr-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Opportunity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* Description */}
        <p className={`text-sm sm:text-base text-[var(--foreground)]/80 ${!isUnlocked ? 'line-clamp-2' : ''}`}>
          {opportunity.description}
        </p>

        {/* Details (only if unlocked) */}
        {isUnlocked && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            {salaryInfo && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="font-medium text-[var(--foreground)]">Salary:</span>
                <span className="text-[var(--muted-foreground)]">{salaryInfo}</span>
              </div>
            )}
            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-[var(--foreground)]">Requirements:</span>
                <ul className="list-disc list-inside text-[var(--muted-foreground)] mt-1 space-y-1">
                  {opportunity.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {opportunity.safetyRating && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-[var(--color-aurora-yellow)] fill-[var(--color-aurora-yellow)]" />
                <span className="font-medium text-[var(--foreground)]">Safety Rating:</span>
                <span className="text-[var(--muted-foreground)]">{opportunity.safetyRating}/5</span>
              </div>
            )}
            {opportunity.contactEmail && (
              <div className="text-sm text-[var(--foreground)]">
                <span className="font-medium">Contact:</span>{" "}
                <a
                  href={`mailto:${opportunity.contactEmail}`}
                  className="text-[var(--color-aurora-purple)] hover:text-[var(--color-aurora-violet)] underline"
                >
                  {opportunity.contactEmail}
                </a>
              </div>
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-aurora-purple)] hover:text-[var(--color-aurora-violet)] underline inline-block"
              >
                View full details →
              </a>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Badge variant="outline" className="text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Unlocked
              </Badge>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="font-medium text-[var(--foreground)]">{opportunity.creditCost} credits</span>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <Button
              onClick={onUnlock}
              disabled={!canAfford}
              size="sm"
              className={`w-full sm:w-auto ${canAfford 
                ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]" 
                : "bg-[var(--muted-foreground)]/20 text-[var(--muted-foreground)] min-h-[44px]"
              }`}
            >
              {canAfford ? `Unlock (${opportunity.creditCost} credits)` : 'Insufficient Credits'}
            </Button>
          )}
        </div>

        {/* Insufficient credits warning */}
        {!isUnlocked && !canAfford && (
          <div className="text-xs text-[var(--color-aurora-orange)] bg-[var(--color-aurora-orange)]/10 p-2 rounded-lg">
            You need {opportunity.creditCost - userCredits} more credits to unlock this
          </div>
        )}
      </CardContent>
    </Card>
  );
}
