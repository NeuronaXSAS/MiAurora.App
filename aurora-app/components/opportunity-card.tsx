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
  job: "bg-blue-100 text-blue-800",
  mentorship: "bg-purple-100 text-purple-800",
  resource: "bg-green-100 text-green-800",
  event: "bg-orange-100 text-orange-800",
  funding: "bg-pink-100 text-pink-800",
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
    <Card className={`hover-lift animate-fade-in-up ${!isUnlocked && !canAfford ? 'opacity-75' : ''}`}>
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

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {!thumbnailUrl && (
              <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{opportunity.title}</h3>
              {companyName && (
                <p className="text-sm text-gray-600">{companyName}</p>
              )}
              {opportunity.location && (
                <p className="text-xs text-gray-500">{opportunity.location}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={colorClass}>
              {opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)}
            </Badge>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className={`text-gray-700 ${!isUnlocked ? 'line-clamp-2' : ''}`}>
          {opportunity.description}
        </p>

        {/* Details (only if unlocked) */}
        {isUnlocked && (
          <div className="space-y-2 pt-2 border-t">
            {salaryInfo && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Salary:</span>
                <span className="text-gray-600">{salaryInfo}</span>
              </div>
            )}
            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Requirements:</span>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                  {opportunity.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {opportunity.safetyRating && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">Safety Rating:</span>
                <span className="text-gray-600">{opportunity.safetyRating}/5</span>
              </div>
            )}
            {opportunity.contactEmail && (
              <div className="text-sm">
                <span className="font-medium">Contact:</span>{" "}
                <a
                  href={`mailto:${opportunity.contactEmail}`}
                  className="text-purple-600 hover:text-purple-700 underline"
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
                className="text-sm text-purple-600 hover:text-purple-700 underline inline-block"
              >
                View full details →
              </a>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Unlocked
              </Badge>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{opportunity.creditCost} credits</span>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <Button
              onClick={onUnlock}
              disabled={!canAfford}
              size="sm"
            >
              {canAfford ? `Unlock (${opportunity.creditCost} credits)` : 'Insufficient Credits'}
            </Button>
          )}
        </div>

        {/* Insufficient credits warning */}
        {!isUnlocked && !canAfford && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            You need {opportunity.creditCost - userCredits} more credits to unlock this
          </div>
        )}
      </CardContent>
    </Card>
  );
}
