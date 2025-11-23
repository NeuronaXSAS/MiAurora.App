"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, MessageSquare } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AIShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
}

export function AIShareDialog({
  open,
  onOpenChange,
  userId,
}: AIShareDialogProps) {
  const [title, setTitle] = useState("");
  const [messageCount, setMessageCount] = useState("4");
  const [lifeDimension, setLifeDimension] = useState<string>("professional");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareConversation = useMutation(api.aiSharing.shareConversation);
  
  // Get preview of messages to share
  const preview = useQuery(
    api.aiSharing.getShareablePreview,
    open ? { userId, messageCount: parseInt(messageCount) } : "skip"
  );

  const handleSubmit = async () => {
    // Validation
    if (title.length < 10 || title.length > 200) {
      setError("Title must be 10-200 characters");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await shareConversation({
        userId,
        title: title.trim(),
        messageCount: parseInt(messageCount),
        lifeDimension: lifeDimension as any,
        isAnonymous,
      });

      if (result.success) {
        // Reset form
        setTitle("");
        setMessageCount("4");
        setLifeDimension("professional");
        setIsAnonymous(false);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Share error:", err);
      setError(err.message || "Failed to share conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            Share AI Conversation
          </DialogTitle>
          <DialogDescription>
            Share your AI assistant conversation with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Title * (10-200 characters)
            </label>
            <Input
              placeholder="e.g., 'Career advice for switching to tech'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Message Count */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Number of Messages to Share
            </label>
            <Select value={messageCount} onValueChange={setMessageCount}>
              <SelectTrigger>
                <SelectValue placeholder="Select message count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Last 2 messages</SelectItem>
                <SelectItem value="4">Last 4 messages</SelectItem>
                <SelectItem value="6">Last 6 messages</SelectItem>
                <SelectItem value="8">Last 8 messages</SelectItem>
                <SelectItem value="10">Last 10 messages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-2">
                {preview.map((msg: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    <span className="font-semibold">
                      {msg.role === "user" ? "You" : "Aurora AI"}:
                    </span>{" "}
                    <span className="text-gray-700">
                      {msg.content.substring(0, 100)}
                      {msg.content.length > 100 ? "..." : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview && preview.length === 0 && (
            <div className="border rounded-lg p-4 bg-yellow-50 text-yellow-800 text-sm">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              You need to have a conversation with the AI assistant first before sharing.
            </div>
          )}

          {/* Life Dimension */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Category *
            </label>
            <Select value={lifeDimension} onValueChange={setLifeDimension}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="daily">Daily Life</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <label
              htmlFor="anonymous"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share anonymously
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || title.length < 10 || !preview || preview.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? "Sharing..." : "Share Conversation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
