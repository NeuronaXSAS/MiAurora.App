"use client";

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
import { Briefcase, GraduationCap, FileText, Calendar, DollarSign, MapPin, Sparkles, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface OpportunityFeedCardProps {
  opportunity: {
    _id: string;
    _creationTime: number;
    creatorId?: string;
    title: string;
    description: string;
    category: string;
    creditCost: number;
    company?: string;
    location?: string;
  };
  currentUserId?: Id<"users">;
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
  resource: "bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-mint)]",
  event: "bg-[var(--color-aurora-yellow)]/30 text-[var(--color-aurora-yellow)]",
  funding: "bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]",
};

export function OpportunityFeedCard({ opportunity, currentUserId, onDelete }: OpportunityFeedCardProps) {
  const Icon = categoryIcons[opportunity.category as keyof typeof categoryIcons] || Briefcase;
  const colorClass = categoryColors[opportunity.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
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

  return (
    <Card className="hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-[var(--foreground)]">{opportunity.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatDistanceToNow(opportunity._creationTime, { addSuffix: true })}
              </p>
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
        {/* Company and Location */}
        {(opportunity.company || opportunity.location) && (
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
            {opportunity.company && (
              <span className="font-medium text-[var(--foreground)]">{opportunity.company}</span>
            )}
            {opportunity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{opportunity.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[var(--foreground)]/80 line-clamp-2">{opportunity.description}</p>

        {/* Engagement Actions - Requires credits to interact */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1">
            {/* Like - costs 1 credit */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] min-w-[40px] p-2 hover:bg-[var(--color-aurora-mint)]/20 hover:text-[var(--color-aurora-purple)] group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement opportunity like with credit cost
                alert("Liking opportunities costs 1 credit. Feature coming soon!");
              }}
              title="Like (1 credit)"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Button>
            
            {/* Comment - costs 2 credits */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] min-w-[40px] p-2 hover:bg-[var(--color-aurora-lavender)]/30 group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement opportunity comments with credit cost
                alert("Commenting on opportunities costs 2 credits. Feature coming soon!");
              }}
              title="Comment (2 credits)"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Button>
            
            {/* Share - free */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] min-w-[40px] p-2 hover:bg-[var(--color-aurora-pink)]/20 group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/opportunities`);
                alert("Link copied!");
              }}
              title="Share (free)"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
              <span className="text-sm font-medium text-[var(--color-aurora-yellow)]">{opportunity.creditCost}</span>
            </div>
            <Link href="/opportunities">
              <Button size="sm" className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
