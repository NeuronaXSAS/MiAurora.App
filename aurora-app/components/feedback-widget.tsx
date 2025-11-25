"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { MessageSquare, X, ThumbsUp, ThumbsDown, Bug, Lightbulb } from "lucide-react";
import { BottomSheet } from "./ui/bottom-sheet";

type FeedbackType = "bug" | "feature" | "positive" | "negative";

interface FeedbackWidgetProps {
  userId?: string;
  context?: string; // Current page/feature context
}

export function FeedbackWidget({ userId, context }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !feedbackType) return;

    setIsSubmitting(true);
    try {
      // Send to analytics
      if (typeof window !== "undefined" && (window as any).posthog) {
        (window as any).posthog.capture("feedback_submitted", {
          type: feedbackType,
          message,
          context,
          userId,
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }

      // TODO: Also send to backend for storage/review
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage("");
        setFeedbackType(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-aurora-violet hover:bg-aurora-violet/90 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Feedback Sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Send Feedback"
        snapPoints={[70]}
        defaultSnap={0}
      >
        {submitted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-600">
              Your feedback helps us make Aurora better for everyone.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedback Type Selection */}
            {!feedbackType ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFeedbackType("bug")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-aurora-violet hover:bg-aurora-violet/5 transition-all"
                >
                  <Bug className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="font-semibold">Report Bug</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Something isn't working
                  </p>
                </button>

                <button
                  onClick={() => setFeedbackType("feature")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-aurora-violet hover:bg-aurora-violet/5 transition-all"
                >
                  <Lightbulb className="w-8 h-8 text-aurora-yellow mx-auto mb-3" />
                  <p className="font-semibold">Feature Request</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Suggest an improvement
                  </p>
                </button>

                <button
                  onClick={() => setFeedbackType("positive")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-aurora-violet hover:bg-aurora-violet/5 transition-all"
                >
                  <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold">Positive</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Share what you love
                  </p>
                </button>

                <button
                  onClick={() => setFeedbackType("negative")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-aurora-violet hover:bg-aurora-violet/5 transition-all"
                >
                  <ThumbsDown className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <p className="font-semibold">Negative</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Tell us what's wrong
                  </p>
                </button>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setFeedbackType(null)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Change feedback type
                </button>

                {/* Message Input */}
                <div className="space-y-2">
                  <Label>Your Feedback</Label>
                  <Textarea
                    placeholder={
                      feedbackType === "bug"
                        ? "Describe what happened and what you expected..."
                        : feedbackType === "feature"
                        ? "Describe the feature you'd like to see..."
                        : "Tell us more..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-gray-500">
                    Context: {context || "General feedback"}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className="w-full bg-aurora-violet hover:bg-aurora-violet/90"
                >
                  {isSubmitting ? "Sending..." : "Send Feedback"}
                </Button>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
