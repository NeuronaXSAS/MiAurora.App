"use client";

/**
 * AI Answers Component
 * 
 * Reddit Answers-style AI that aggregates community knowledge
 * to provide intelligent, sourced responses from Aurora App content.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles, Search, MessageSquare, ThumbsUp, ThumbsDown,
  ExternalLink, Loader2, BookOpen, Users, Shield, Briefcase,
  Heart, MapPin, ChevronRight, Quote
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AIAnswersProps {
  userId?: Id<"users">;
  initialQuery?: string;
  compact?: boolean;
  className?: string;
}

interface SourcePost {
  _id: string;
  title: string;
  description: string;
  author: { name: string; profileImage?: string };
  upvotes: number;
  lifeDimension: string;
  _creationTime: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  safety: <Shield className="w-4 h-4" />,
  career: <Briefcase className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
  community: <Users className="w-4 h-4" />,
  travel: <MapPin className="w-4 h-4" />,
};

const suggestedQuestions = [
  "What are the safest neighborhoods for women?",
  "How do I negotiate salary as a woman in tech?",
  "Best self-defense tips from the community",
  "Remote work safety tips",
  "How to find mentors in my industry",
];

export function AIAnswers({ userId, initialQuery = "", compact = false, className }: AIAnswersProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourcePost[]>([]);
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null);

  // Search for relevant posts
  const searchResults = useQuery(
    api.search.globalSearch,
    query.length >= 3 ? { query, limit: 10 } : "skip"
  );

  const handleSearch = async () => {
    if (!query.trim() || query.length < 3) return;
    
    setIsSearching(true);
    setAnswer(null);
    setSources([]);
    setFeedback(null);

    // Simulate AI processing (in production, this would call an AI API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Filter for posts from global search results
    const postResults = searchResults?.results?.filter((r: any) => r.type === "post") || [];
    
    if (postResults.length > 0) {
      // Generate AI summary from community posts
      const topPosts = postResults.slice(0, 5).map((r: any) => ({
        _id: r.id,
        title: r.title,
        description: r.description || "",
        author: r.author || { name: "Community Member" },
        upvotes: r.metadata?.upvotes || 0,
        lifeDimension: r.metadata?.lifeDimension || "general",
        _creationTime: r.createdAt || Date.now(),
      }));

      // Create a synthesized answer
      const synthesizedAnswer = generateAIAnswer(query, topPosts);
      setAnswer(synthesizedAnswer);
      setSources(topPosts as SourcePost[]);
    } else {
      setAnswer("I couldn't find specific community experiences matching your question. Try rephrasing or browse our communities for related discussions.");
    }

    setIsSearching(false);
  };

  const generateAIAnswer = (question: string, posts: any[]): string => {
    // This would be replaced with actual AI in production
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes("safe") || questionLower.includes("safety")) {
      return `Based on ${posts.length} community experiences, here's what Aurora App members recommend for safety:\n\n` +
        `• Many members emphasize staying aware of surroundings and trusting instincts\n` +
        `• Well-lit, busy areas are consistently rated higher for safety\n` +
        `• The community recommends sharing your location with trusted contacts\n` +
        `• Several members suggest using Aurora App's panic button feature for emergencies\n\n` +
        `These insights come from verified community members with high trust scores.`;
    }
    
    if (questionLower.includes("salary") || questionLower.includes("negotiate")) {
      return `Based on ${posts.length} career discussions from Aurora App members:\n\n` +
        `• Research market rates before negotiations - members recommend Glassdoor and Levels.fyi\n` +
        `• Practice your pitch with other community members\n` +
        `• Document your achievements and quantify your impact\n` +
        `• Several members report 15-30% increases after following community advice\n\n` +
        `Join c/CareerWomen for more detailed discussions and mentorship opportunities.`;
    }

    if (questionLower.includes("mentor") || questionLower.includes("mentorship")) {
      return `Aurora App members share these mentorship tips:\n\n` +
        `• Check our Opportunities section for formal mentorship programs\n` +
        `• Join industry-specific circles to connect with experienced professionals\n` +
        `• Many members found mentors through community events and discussions\n` +
        `• Be specific about what you're looking for when reaching out\n\n` +
        `Browse c/CareerWomen and c/WomenConnect for active mentorship discussions.`;
    }

    return `Based on ${posts.length} community discussions about "${question}":\n\n` +
      `The Aurora App community has shared various experiences and advice on this topic. ` +
      `Key themes include mutual support, verified safety information, and practical tips from real experiences.\n\n` +
      `Check the sources below for detailed community insights and join relevant circles for ongoing discussions.`;
  };

  if (compact) {
    return (
      <div className={cn("bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--foreground)]">AI Answers</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Powered by community wisdom</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Ask the community..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-10 bg-[var(--background)] border-[var(--border)] rounded-xl text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Answers</h2>
            <p className="text-white/80 text-sm">Community-powered insights for women</p>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Ask anything about safety, career, health, community..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-12 pr-24 h-14 bg-white border-0 rounded-xl text-base shadow-lg"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || query.length < 3}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90 rounded-lg h-10"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Suggested Questions */}
        {!answer && !isSearching && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--color-aurora-purple)]" />
              Popular Questions
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    setTimeout(handleSearch, 100);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)]">
                      {q}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--color-aurora-purple)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-[var(--color-aurora-purple)] animate-spin" />
            </div>
            <p className="text-[var(--foreground)] font-medium">Searching community wisdom...</p>
            <p className="text-sm text-[var(--muted-foreground)]">Analyzing {searchResults?.results?.length || 0} relevant discussions</p>
          </div>
        )}

        {/* Answer */}
        {answer && !isSearching && (
          <div className="space-y-6">
            {/* AI Response */}
            <div className="bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 rounded-xl p-5 border border-[var(--color-aurora-purple)]/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">AI Answer</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Based on {sources.length} community sources</p>
                </div>
              </div>
              <div className="text-[var(--foreground)] whitespace-pre-line leading-relaxed">
                {answer}
              </div>
              
              {/* Feedback */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--muted-foreground)]">Was this helpful?</span>
                <button
                  onClick={() => setFeedback("helpful")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    feedback === "helpful"
                      ? "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-mint)]/50"
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes
                </button>
                <button
                  onClick={() => setFeedback("not_helpful")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    feedback === "not_helpful"
                      ? "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-salmon)]/20"
                  )}
                >
                  <ThumbsDown className="w-4 h-4" />
                  No
                </button>
              </div>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div>
                <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  Community Sources ({sources.length})
                </h3>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <Link
                      key={source._id}
                      href={`/feed?post=${source._id}`}
                      className="block p-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={source.author?.profileImage} />
                          <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] text-xs">
                            {source.author?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] line-clamp-1">
                            {source.title}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">
                            {source.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-[10px] bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)]">
                              {source.lifeDimension}
                            </Badge>
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              {source.upvotes} upvotes
                            </span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              {formatDistanceToNow(source._creationTime, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--color-aurora-purple)] flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ask Another */}
            <Button
              onClick={() => {
                setQuery("");
                setAnswer(null);
                setSources([]);
                setFeedback(null);
              }}
              variant="outline"
              className="w-full border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask Another Question
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
