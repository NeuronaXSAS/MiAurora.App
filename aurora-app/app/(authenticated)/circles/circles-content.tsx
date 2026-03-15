"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/page-transition";
import {
  Bot,
  Briefcase,
  Heart,
  Loader2,
  Plus,
  Send,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

const CATEGORY_META: Record<
  string,
  { title: string; summary: string; accent: string; icon: typeof Heart }
> = {
  relationships: {
    title: "Relationship Reset",
    summary: "Aurora and the combo help unpack mixed signals, boundaries, and emotional safety.",
    accent: "from-[var(--color-aurora-pink)] to-[var(--color-aurora-lavender)]",
    icon: Heart,
  },
  career: {
    title: "Career Room",
    summary: "Use Aurora Combo for salary talks, workplace politics, leadership moves, and burnout recovery.",
    accent: "from-[var(--color-aurora-blue)] to-[var(--color-aurora-lavender)]",
    icon: Briefcase,
  },
  finance: {
    title: "Money Clarity",
    summary: "Get multiple AI perspectives for budgeting, debt stress, emergency funds, and hard tradeoffs.",
    accent: "from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)]",
    icon: Wallet,
  },
  safety: {
    title: "Safety Circle",
    summary: "Aurora centers risk, exits, trusted contacts, and practical safety planning without panic.",
    accent: "from-[var(--color-aurora-salmon)] to-[var(--color-aurora-pink)]",
    icon: Shield,
  },
  wellness: {
    title: "Wellness Reset",
    summary: "Great for stress, anxiety spirals, decision fatigue, and rebuilding gentle routines.",
    accent: "from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)]",
    icon: Sparkles,
  },
};

const VOICE_BADGES = [
  "Aurora - emotional anchor",
  "Steady Sofia - grounding guide",
  "Signal Samira - risk checker",
  "Clarity June - pattern finder",
  "Action Nia - next-step planner",
];

interface CircleMessage {
  _id: Id<"circleAiMessages">;
  senderType: "user" | "aurora" | "companion";
  senderName: string;
  personaId?: string;
  content: string;
  createdAt: number;
}

export function CirclesPageContent() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authToken, isLoading, userId } = useAuthSession();
  const [selectedCircleId, setSelectedCircleId] = useState<Id<"circles"> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    category: "relationships",
    focusPrompt: "",
  });

  useEffect(() => {
    if (!isLoading && (!userId || !authToken)) {
      router.push("/");
    }
  }, [authToken, isLoading, router, userId]);

  const myCircles =
    useQuery(api.circles.getMyCircles, userId && authToken ? { authToken, userId } : "skip") ?? [];
  const safeCircles = myCircles.filter(
    (circle): circle is NonNullable<(typeof myCircles)[number]> => circle !== null,
  );
  const categories = useQuery(api.circles.getCircleCategories, {}) ?? [];
  const circleDetails = useQuery(
    api.circles.getCircleDetails,
    selectedCircleId && userId && authToken
      ? { authToken, circleId: selectedCircleId, userId }
      : "skip",
  );

  const createCircle = useMutation(api.circles.createCircle);

  useEffect(() => {
    if (!selectedCircleId && safeCircles.length > 0) {
      setSelectedCircleId(safeCircles[0]._id);
    }
  }, [safeCircles, selectedCircleId]);
  const selectedMeta = useMemo(() => {
    if (!circleDetails) return CATEGORY_META.relationships;
    return CATEGORY_META[circleDetails.category] || CATEGORY_META.relationships;
  }, [circleDetails]);

  if (!userId || !authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  const handleCreateCircle = async () => {
    if (!newCircle.name.trim() || !newCircle.description.trim()) return;

    const createdId = await createCircle({
      authToken,
      creatorId: userId,
      name: newCircle.name.trim(),
      description: newCircle.description.trim(),
      category: newCircle.category as
        | "career"
        | "motherhood"
        | "health"
        | "safety"
        | "relationships"
        | "finance"
        | "wellness"
        | "tech"
        | "entrepreneurship"
        | "general",
      isPrivate: true,
      focusPrompt: newCircle.focusPrompt.trim() || undefined,
      tags: [newCircle.category, "aurora-combo"],
    });

    setShowCreateDialog(false);
    setSelectedCircleId(createdId);
    setNewCircle({
      name: "",
      description: "",
      category: "relationships",
      focusPrompt: "",
    });
  };

  const handleSend = async () => {
    if (!selectedCircleId || !message.trim() || isSending) return;

    const currentMessage = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/circle-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          circleId: selectedCircleId,
          message: currentMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Circle chat failed");
      }
    } catch (error) {
      console.error("Circle chat error:", error);
      alert("Aurora Combo could not answer right now. Please try again.");
      setMessage(currentMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
              <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Aurora Combo
                </p>
                <h1 className="mt-2 text-2xl font-bold">AI Circles</h1>
                <p className="mt-2 text-sm text-white/80">
                  Create private themed circles where Aurora and her companions answer with multiple perspectives.
                </p>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  {VOICE_BADGES.map((voice) => (
                    <Badge key={voice} className="bg-[var(--color-aurora-lavender)]/25 text-[var(--color-aurora-violet)]">
                      {voice}
                    </Badge>
                  ))}
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full min-h-[48px] bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)] text-white rounded-2xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Create AI Circle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-[var(--border)] bg-[var(--card)]">
                    <DialogHeader>
                      <DialogTitle className="text-[var(--foreground)]">
                        Launch a new Aurora circle
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Circle name</label>
                        <Input
                          value={newCircle.name}
                          onChange={(event) =>
                            setNewCircle((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Breakup recovery room"
                          className="min-h-[48px] rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Theme</label>
                        <Select
                          value={newCircle.category}
                          onValueChange={(value) =>
                            setNewCircle((current) => ({
                              ...current,
                              category: value,
                            }))
                          }
                        >
                          <SelectTrigger className="min-h-[48px] rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">What should this circle help with?</label>
                        <Textarea
                          rows={4}
                          value={newCircle.description}
                          onChange={(event) =>
                            setNewCircle((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          placeholder="For women who need clear, emotionally safe advice about confusing relationship dynamics."
                          className="rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Optional special instruction</label>
                        <Textarea
                          rows={3}
                          value={newCircle.focusPrompt}
                          onChange={(event) =>
                            setNewCircle((current) => ({
                              ...current,
                              focusPrompt: event.target.value,
                            }))
                          }
                          placeholder="Example: keep it practical and direct, avoid soft platitudes."
                          className="rounded-2xl"
                        />
                      </div>
                      <Button
                        onClick={handleCreateCircle}
                        disabled={!newCircle.name.trim() || !newCircle.description.trim()}
                        className="w-full min-h-[48px] rounded-2xl bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)] text-white"
                      >
                        Create private circle
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Your circles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {safeCircles.length === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    You do not have any AI circles yet. Create one to start a themed conversation.
                  </p>
                )}
                {safeCircles.map((circle) => {
                  const meta = CATEGORY_META[circle.category] || CATEGORY_META.relationships;
                  const Icon = meta.icon;
                  const isSelected = selectedCircleId === circle._id;

                  return (
                    <button
                      key={circle._id}
                      onClick={() => setSelectedCircleId(circle._id)}
                      className={`w-full rounded-3xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-[var(--color-aurora-blue)] bg-[var(--color-aurora-lavender)]/20 shadow-md"
                          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--color-aurora-lavender)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-[var(--foreground)]">
                              {circle.name}
                            </p>
                            <Badge className="bg-[var(--color-aurora-mint)]/40 text-[var(--color-aurora-violet)]">
                              private
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                            {circle.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Suggested themes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div key={key} className="rounded-3xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{meta.title}</p>
                          <p className="text-sm text-[var(--muted-foreground)]">{meta.summary}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <main>
            {!circleDetails ? (
              <Card className="border-[var(--border)] bg-[var(--card)]">
                <CardContent className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                  <Bot className="w-14 h-14 text-[var(--color-aurora-purple)]" />
                  <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
                    Choose a circle
                  </h2>
                  <p className="mt-2 max-w-lg text-[var(--muted-foreground)]">
                    Open one of your AI circles to chat with Aurora and her support combo, or create a new private room for the topic that matters most right now.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
                <div className={`bg-gradient-to-r ${selectedMeta.accent} px-6 py-6 text-white`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                        Aurora Combo circle
                      </p>
                      <h2 className="mt-2 text-3xl font-bold">{circleDetails.name}</h2>
                      <p className="mt-2 text-sm text-white/85">{circleDetails.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VOICE_BADGES.slice(0, 4).map((voice) => (
                        <Badge key={voice} className="bg-white/15 text-white border-0">
                          {voice}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <CardContent className="flex min-h-[72vh] flex-col p-0">
                  <div className="border-b border-[var(--border)] px-6 py-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {selectedMeta.summary}
                    </p>
                  </div>

                  <ErrorBoundary fallback={<CircleMessagesFallback isSending={isSending} />}>
                    <CircleMessagesPanel
                      authToken={authToken}
                      userId={userId}
                      circleId={selectedCircleId!}
                      isSending={isSending}
                      messagesEndRef={messagesEndRef}
                    />
                  </ErrorBoundary>

                  <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:px-6">
                    <div className="flex gap-3">
                      <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Tell Aurora Combo what is happening, what you are feeling, or what decision you need help with."
                        className="min-h-[92px] rounded-3xl border-[var(--border)] bg-[var(--background)]"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || isSending}
                        className="min-h-[92px] min-w-[56px] rounded-3xl bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)] text-white"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      Private AI circle. Aurora prioritizes dignity, safety, and practical next steps. If you describe immediate danger, the response will shift to safety guidance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </PageTransition>
  );
}

function CircleMessagesPanel({
  authToken,
  userId,
  circleId,
  isSending,
  messagesEndRef,
}: {
  authToken: string;
  userId: NonNullable<ReturnType<typeof useAuthSession>["userId"]>;
  circleId: Id<"circles">;
  isSending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rawCircleMessages = useQuery(api.circles.getCircleMessages, {
    authToken,
    userId,
    circleId,
    limit: 60,
  });
  const circleMessages = useMemo(
    () => (rawCircleMessages ?? []) as CircleMessage[],
    [rawCircleMessages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [circleMessages, isSending, messagesEndRef]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
      {circleMessages.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[var(--color-aurora-lavender)] bg-[var(--color-aurora-lavender)]/10 p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Start the first conversation
          </h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Describe the situation with enough context for Aurora and the combo to respond with distinct, helpful viewpoints.
          </p>
        </div>
      )}

      {circleMessages.map((entry) => {
        const isUser = entry.senderType === "user";
        const bubbleClass = isUser
          ? "bg-[var(--color-aurora-blue)] text-white ml-auto"
          : entry.senderType === "aurora"
            ? "bg-[var(--color-aurora-lavender)]/20 text-[var(--foreground)]"
            : "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]";

        return (
          <div key={entry._id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${bubbleClass}`}>
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.14em] opacity-70">
                <span>{entry.senderName}</span>
                {entry.personaId && entry.personaId !== "aurora" && (
                  <span className="normal-case tracking-normal opacity-80">
                    {entry.personaId.replace(/-/g, " ")}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {entry.content}
              </p>
            </div>
          </div>
        );
      })}

      {isSending && (
        <div className="flex justify-start">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
              Aurora Combo is thinking
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function CircleMessagesFallback({ isSending }: { isSending: boolean }) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
      <div className="rounded-3xl border border-[var(--color-aurora-lavender)]/40 bg-[var(--color-aurora-lavender)]/10 p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          This circle is still syncing
        </h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          You can keep sending messages. Aurora Combo will resume the full transcript as soon as the live backend catches up.
        </p>
      </div>
      {isSending && (
        <div className="flex justify-start">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
              Aurora Combo is thinking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
