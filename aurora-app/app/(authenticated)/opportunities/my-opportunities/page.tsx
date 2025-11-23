"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpportunityEditDialog } from "@/components/opportunity-edit-dialog";
import { Briefcase, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function MyOpportunitiesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<any | null>(null);

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

  // Fetch user's opportunities
  const opportunities = useQuery(
    api.opportunities.getByCreator,
    userId ? { creatorId: userId } : "skip"
  );

  const deleteOpportunity = useMutation(api.opportunities.deleteOpportunity);
  const updateStatus = useMutation(api.opportunities.updateStatus);

  const handleDelete = async (opportunityId: Id<"opportunities">) => {
    if (!userId) return;
    
    if (!confirm("Are you sure you want to delete this opportunity?")) {
      return;
    }

    try {
      await deleteOpportunity({
        opportunityId,
        userId,
      });
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete opportunity: " + (error as Error).message);
    }
  };

  const handleToggleStatus = async (opportunityId: Id<"opportunities">, currentStatus: boolean) => {
    try {
      await updateStatus({
        opportunityId,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 lg:top-0 z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">My Opportunities</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage your created opportunities
                </p>
              </div>
            </div>

            <Link href="/opportunities">
              <Button variant="outline">
                Back to All Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Loading State */}
          {opportunities === undefined && (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {/* Empty State */}
          {opportunities && opportunities.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first opportunity to get started!
              </p>
              <Link href="/opportunities">
                <Button>
                  Create Opportunity
                </Button>
              </Link>
            </div>
          )}

          {/* Opportunities List */}
          {opportunities && opportunities.length > 0 && (
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <Card key={opportunity._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                          <Badge variant={opportunity.isActive ? "default" : "secondary"}>
                            {opportunity.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {opportunity.company || "Community Member"}
                          {opportunity.location && ` • ${opportunity.location}`}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {opportunity.description}
                        </p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {opportunity.creditCost} credits
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(opportunity._id, opportunity.isActive)}
                      >
                        {opportunity.isActive ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOpportunity(opportunity)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(opportunity._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {userId && editingOpportunity && (
        <OpportunityEditDialog
          open={!!editingOpportunity}
          onOpenChange={(open) => !open && setEditingOpportunity(null)}
          userId={userId}
          opportunity={editingOpportunity}
        />
      )}
    </div>
  );
}
