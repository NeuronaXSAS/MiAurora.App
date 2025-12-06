"use client";

/**
 * Daily News Admin - Curate 2 stories per day
 * 
 * Simple admin interface for adding daily news stories
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Plus, Trash2, Check, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { value: "safety", label: "Safety" },
  { value: "rights", label: "Women's Rights" },
  { value: "health", label: "Health" },
  { value: "career", label: "Career" },
  { value: "finance", label: "Finance" },
  { value: "tech", label: "Tech" },
  { value: "world", label: "World News" },
] as const;

export function DailyNewsAdmin() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("world");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const createStory = useMutation(api.dailyNews.createStory);
  const todayStories = useQuery(api.dailyNews.getStoriesByDate, { date });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !sourceUrl || !sourceName) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await createStory({
        date,
        slot,
        title,
        summary,
        sourceUrl,
        sourceName,
        imageUrl: imageUrl || undefined,
        category,
      });
      setMessage({ type: "success", text: `Story added to slot ${slot}!` });
      // Reset form
      setTitle("");
      setSummary("");
      setSourceUrl("");
      setSourceName("");
      setImageUrl("");
      setSlot(slot === 1 ? 2 : 1);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to add story" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
          <Newspaper className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Daily News Admin</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Curate 2 stories per day for "What Sisters Think"
          </p>
        </div>
      </div>

      {/* Today's Stories Status */}
      <div className="p-4 rounded-xl bg-[var(--accent)]/50 border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] mb-3">
          Stories for {date}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((s) => {
            const story = todayStories?.find((st) => st.slot === s);
            return (
              <div
                key={s}
                className={`p-3 rounded-lg border ${
                  story
                    ? "bg-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-mint)]"
                    : "bg-[var(--card)] border-dashed border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={story ? "default" : "outline"}>Slot {s}</Badge>
                  {story && <Check className="w-4 h-4 text-green-500" />}
                </div>
                {story ? (
                  <p className="text-sm text-[var(--foreground)] line-clamp-2">
                    {story.title}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">Empty</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Story Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Slot
            </label>
            <select
              value={slot}
              onChange={(e) => setSlot(Number(e.target.value) as 1 | 2)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
            >
              <option value={1}>Slot 1</option>
              <option value={2}>Slot 2</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="News headline..."
            className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Summary *
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief summary for display..."
            className="w-full p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] resize-none h-20"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Source Name *
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="BBC, Reuters, etc."
              className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Source URL *
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (optional thumbnail)"
            className="w-full h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-[var(--color-aurora-mint)]/20 text-green-700"
                : "bg-[var(--color-aurora-salmon)]/20 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--color-aurora-purple)] min-h-[48px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Adding..." : "Add Story"}
        </Button>
      </form>
    </div>
  );
}
