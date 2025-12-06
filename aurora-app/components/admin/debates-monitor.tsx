"use client";

/**
 * Debates Monitor - Admin Panel
 * Real-time monitoring of daily debates with analytics and archive access
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart3, Users, MessageSquare, TrendingUp, Calendar,
  ChevronDown, ChevronRight, Eye, Archive, Download,
  ThumbsUp, ThumbsDown, Minus, Clock, UserCheck, UserX,
  Sparkles, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

export function DebatesMonitor() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showArchive, setShowArchive] = useState(false);
  const [expandedDebate, setExpandedDebate] = useState<Id<"dailyDebates"> | null>(null);

  const analytics = useQuery(api.dailyDebates.getDebateAnalytics, { date: selectedDate });
  const archives = useQuery(api.dailyDebates.getArchivedDebates, { limit: 14 });
  const debateDetails = useQuery(
    api.dailyDebates.getDebateDetails,
    expandedDebate ? { debateId: expandedDebate } : "skip"
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--color-aurora-purple)]" />
            Debates Monitor
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Real-time analytics and historical archive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="w-40"
          />
          <Button
            variant="outline"
            onClick={() => setShowArchive(!showArchive)}
            className={showArchive ? "bg-[var(--color-aurora-purple)]/10" : ""}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Votes"
            value={analytics.summary.totalVotes}
            icon={ThumbsUp}
            color="purple"
          />
          <SummaryCard
            title="Total Comments"
            value={analytics.summary.totalComments}
            icon={MessageSquare}
            color="pink"
          />
          <SummaryCard
            title="Member Engagement"
            value={analytics.summary.totalMemberEngagement}
            icon={UserCheck}
            color="mint"
            subtitle="Registered users"
          />
          <SummaryCard
            title="Conversion Opportunity"
            value={analytics.summary.conversionOpportunity}
            icon={UserX}
            color="yellow"
            subtitle="Anonymous users to convert"
          />
        </div>
      )}

      {/* Conversion Alert */}
      {analytics && analytics.summary.conversionOpportunity > 10 && (
        <Card className="p-4 bg-[var(--color-aurora-yellow)]/10 border-[var(--color-aurora-yellow)]/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            <div>
              <p className="font-medium text-[var(--foreground)]">
                {analytics.summary.conversionOpportunity} anonymous users engaged today!
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                These users are prime candidates for conversion. Consider improving signup prompts.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Archive View */}
      <AnimatePresence>
        {showArchive && archives && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                Archived Debates ({archives.totalDays} days)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {archives.archives.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setShowArchive(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      day.date === selectedDate
                        ? "bg-[var(--color-aurora-purple)]/10 border border-[var(--color-aurora-purple)]/30"
                        : "hover:bg-[var(--accent)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {new Date(day.date).toLocaleDateString("en-US", { 
                          weekday: "short", 
                          month: "short", 
                          day: "numeric" 
                        })}
                      </span>
                      {day.date === today && (
                        <Badge className="text-[9px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">
                          Today
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span>{day.totalVotes} votes</span>
                      <span>{day.totalComments} comments</span>
                      <span>{day.debateCount} debates</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debates List */}
      {analytics && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Debates for {new Date(selectedDate).toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
            {selectedDate === today && (
              <Badge className="text-[9px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 ml-2">
                Live
              </Badge>
            )}
          </h3>

          {analytics.debates.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[var(--muted-foreground)]">No debates found for this date</p>
            </Card>
          ) : (
            analytics.debates.map((debate) => (
              <DebateCard
                key={debate._id}
                debate={debate}
                isExpanded={expandedDebate === debate._id}
                onToggle={() => setExpandedDebate(
                  expandedDebate === debate._id ? null : debate._id
                )}
                details={expandedDebate === debate._id ? debateDetails : null}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "var(--color-aurora-purple)",
    pink: "var(--color-aurora-pink)",
    mint: "var(--color-aurora-mint)",
    yellow: "var(--color-aurora-yellow)",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${colorMap[color]}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: colorMap[color] }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-[var(--muted-foreground)]">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function DebateCard({ 
  debate, 
  isExpanded, 
  onToggle,
  details 
}: { 
  debate: any; 
  isExpanded: boolean; 
  onToggle: () => void;
  details: any;
}) {
  const totalVotes = debate.agreeCount + debate.disagreeCount + debate.neutralCount;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-[var(--accent)]/50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-[9px] bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0">
                {debate.category}
              </Badge>
              <span className="text-xs text-[var(--muted-foreground)]">Slot {debate.slot}</span>
              {debate.isAutoGenerated && (
                <Badge className="text-[9px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0">
                  Auto
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-[var(--foreground)] line-clamp-2">{debate.title}</h4>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--foreground)]">{debate.engagementScore}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">engagement</p>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-[var(--color-aurora-mint)]" />
            <span className="text-[var(--foreground)]">{debate.agreeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="w-3 h-3 text-[var(--color-aurora-salmon)]" />
            <span className="text-[var(--foreground)]">{debate.disagreeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-[var(--muted-foreground)]" />
            <span className="text-[var(--foreground)]">{debate.neutralCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-[var(--color-aurora-purple)]" />
            <span className="text-[var(--foreground)]">{debate.commentCount}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[var(--color-aurora-mint)]">
              <UserCheck className="w-3 h-3 inline mr-1" />
              {debate.memberVotes + debate.memberComments}
            </span>
            <span className="text-[var(--color-aurora-yellow)]">
              <UserX className="w-3 h-3 inline mr-1" />
              {debate.anonymousVotes + debate.anonymousComments}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border)]"
          >
            <div className="p-4 space-y-4">
              {/* Vote Breakdown */}
              <div>
                <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Vote Breakdown
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[var(--accent)]">
                    <span className="text-[var(--muted-foreground)]">Member votes:</span>
                    <span className="ml-2 font-medium text-[var(--foreground)]">
                      {details.stats.memberVotes}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--accent)]">
                    <span className="text-[var(--muted-foreground)]">Anonymous votes:</span>
                    <span className="ml-2 font-medium text-[var(--foreground)]">
                      {details.stats.anonymousVotes}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Votes */}
              {details.votes.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Recent Votes ({details.votes.length})
                  </h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {details.votes.slice(0, 10).map((vote: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-[var(--accent)]">
                        <span className="text-[var(--foreground)]">
                          {vote.voterInfo.flag} {vote.voterInfo.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9px] border-0 ${
                            vote.vote === "agree" ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]" :
                            vote.vote === "disagree" ? "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]" :
                            "bg-[var(--accent)] text-[var(--muted-foreground)]"
                          }`}>
                            {vote.vote}
                          </Badge>
                          <span className="text-[var(--muted-foreground)]">
                            {vote.voterType === "member" ? "👤" : "👻"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Comments */}
              {details.comments.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Recent Comments ({details.comments.length})
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.comments.slice(0, 5).map((comment: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-[var(--accent)]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--foreground)]">
                            {comment.authorInfo.flag} {comment.authorInfo.name}
                            {comment.authorInfo.badge && (
                              <Badge className="ml-1 text-[8px] bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">
                                {comment.authorInfo.badge}
                              </Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {comment.authorType === "member" ? "👤 Member" : "👻 Anonymous"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default DebatesMonitor;
