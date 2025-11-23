"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function ModerationDashboard() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");
  const [contentTypeFilter, setContentTypeFilter] = useState<"reel" | "post" | "comment" | "livestream_snapshot" | undefined>();

  const queue = useQuery(api.moderation.getModerationQueue, {
    status: statusFilter,
    contentType: contentTypeFilter,
    limit: 50,
  });

  const stats = useQuery(api.moderation.getModerationStats, {});

  const approveContent = useMutation(api.moderation.approveContent);
  const rejectContent = useMutation(api.moderation.rejectContent);
  const banUser = useMutation(api.moderation.banUser);

  const handleApprove = async (queueId: Id<"moderationQueue">, adminId: Id<"users">) => {
    try {
      await approveContent({ queueId, adminId });
      alert("Content approved!");
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve content");
    }
  };

  const handleReject = async (queueId: Id<"moderationQueue">, adminId: Id<"users">, deleteContent: boolean) => {
    if (!confirm(`Are you sure you want to ${deleteContent ? "delete" : "flag"} this content?`)) return;

    try {
      await rejectContent({ queueId, adminId, deleteContent });
      alert("Content rejected!");
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject content");
    }
  };

  const handleBan = async (userId: Id<"users">, adminId: Id<"users">) => {
    const reason = prompt("Enter ban reason:");
    if (!reason) return;

    if (!confirm("Are you sure you want to ban this user? This action is permanent.")) return;

    try {
      await banUser({ userId, adminId, reason });
      alert("User banned!");
    } catch (error) {
      console.error("Failed to ban user:", error);
      alert("Failed to ban user");
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 80) return "Severe";
    if (score >= 50) return "Moderate";
    return "Low";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Moderation Dashboard</h1>
        <p className="text-gray-600">AI-powered safety engine for Aurora</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Flagged</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Severity</p>
                <p className="text-2xl font-bold">{stats.avgScore}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value as any)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={contentTypeFilter || "all"}
          onValueChange={(value) => setContentTypeFilter(value === "all" ? undefined : value as any)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="reel">Reels</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="livestream_snapshot">Livestream</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Moderation Queue */}
      <div className="space-y-4">
        {queue?.map((item: any) => (
          <Card key={item._id} className="p-6">
            <div className="flex gap-6">
              {/* Content Preview */}
              <div className="flex-shrink-0">
                {item.contentType === "reel" || item.contentType === "livestream_snapshot" ? (
                  <img
                    src={item.contentPreview}
                    alt="Content preview"
                    className="w-32 h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center px-2">
                      {item.contentPreview.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Content Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{item.contentType}</Badge>
                      <Badge className={getSeverityColor(item.score)}>
                        {getSeverityLabel(item.score)} ({item.score})
                      </Badge>
                      <Badge variant="secondary">
                        Confidence: {item.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Author:</strong> {item.author?.name} ({item.author?.email})
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Trust Score:</strong> {item.author?.trustScore}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">AI Analysis:</p>
                  <p className="text-sm text-gray-700">{item.reason}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Categories:</p>
                  <div className="flex gap-2">
                    {item.categories.map((cat: string) => (
                      <Badge key={cat} variant="destructive">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Admin Actions */}
                {item.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(item._id, item.authorId)}
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>

                    <Button
                      onClick={() => handleReject(item._id, item.authorId, false)}
                      variant="outline"
                      size="sm"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Flag Only
                    </Button>

                    <Button
                      onClick={() => handleReject(item._id, item.authorId, true)}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete Content
                    </Button>

                    <Button
                      onClick={() => handleBan(item.authorId, item.authorId)}
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  </div>
                )}

                {item.status !== "pending" && (
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Status:</strong> {item.status}
                    </p>
                    {item.reviewedAt && (
                      <p>
                        <strong>Reviewed:</strong> {new Date(item.reviewedAt).toLocaleString()}
                      </p>
                    )}
                    {item.adminNotes && (
                      <p>
                        <strong>Notes:</strong> {item.adminNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {queue?.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">All Clear!</h3>
            <p className="text-gray-600">No items in the moderation queue.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
