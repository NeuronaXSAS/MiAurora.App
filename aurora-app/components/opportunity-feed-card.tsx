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

        {/* Credit Cost and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
            <span className="font-medium text-[var(--color-aurora-yellow)]">{opportunity.creditCost} credits</span>
          </div>

          <Link href="/opportunities">
            <Button size="sm" className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
