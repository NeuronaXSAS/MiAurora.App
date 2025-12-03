"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Mic, 
  Share2, 
  TrendingUp,
  Heart,
  Brain,
  Sparkles,
  Clock,
  Calendar,
  Activity
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface AIInteractionsDashboardProps {
  userId: Id<"users">;
}

export function AIInteractionsDashboard({ userId }: AIInteractionsDashboardProps) {
  const chatHistory = useQuery(api.ai.getHistory, { userId, limit: 100 });
  // AI interactions stats calculated from chat history
  const aiInteractions = { voiceSessions: 0, sharedChats: 0 };

  // Calculate stats from chat history
  const stats = calculateStats(chatHistory || []);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[var(--color-aurora-purple)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalMessages}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Total Messages</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-aurora-pink)]/20 to-[var(--color-aurora-lavender)]/20 border-[var(--color-aurora-pink)]/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-[var(--color-aurora-pink)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.conversations}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Conversations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-aurora-blue)]/20 to-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-blue)]/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-aurora-blue)]/20 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-[var(--color-aurora-blue)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{aiInteractions?.voiceSessions || 0}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Voice Sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-yellow)]/30">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-aurora-yellow)]/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{aiInteractions?.sharedChats || 0}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Shared Chats</p>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Timeline */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {stats.weeklyActivity.map((count, idx) => {
              const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
              const maxCount = Math.max(...stats.weeklyActivity, 1);
              const height = (count / maxCount) * 100;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">{dayNames[idx]}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Topics */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Topics You've Discussed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.topics.map((topic, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-full text-sm bg-[var(--color-aurora-lavender)]/20 text-[var(--color-aurora-purple)] border border-[var(--color-aurora-lavender)]/30"
              >
                {topic.emoji} {topic.name}
              </span>
            ))}
            {stats.topics.length === 0 && (
              <p className="text-[var(--muted-foreground)] text-sm">
                Start chatting to see your conversation topics!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-aurora-blue)]" />
            Recent Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chatHistory && chatHistory.length > 0 ? (
            <div className="space-y-3">
              {getRecentConversations(chatHistory).slice(0, 5).map((conv, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--foreground)] line-clamp-2">{conv.preview}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {formatDistanceToNow(conv.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                    {conv.messageCount} msgs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[var(--color-aurora-purple)]/30 mx-auto mb-3" />
              <p className="text-[var(--muted-foreground)]">No conversations yet. Start chatting with Aurora!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wellness Insights */}
      <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[var(--color-aurora-purple)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Your Wellness Journey</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Aurora is here for you 💜</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Emotional Support</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{stats.supportMessages} messages</span>
            </div>
            <Progress value={Math.min((stats.supportMessages / 50) * 100, 100)} className="h-2" />
            
            <p className="text-xs text-[var(--muted-foreground)] italic mt-4">
              💡 Remember: Aurora is here to support you, but for serious concerns, please reach out to a professional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function calculateStats(messages: Array<{ role: string; content: string; _creationTime: number }>) {
  const userMessages = messages.filter(m => m.role === "user");
  const totalMessages = messages.length;
  
  // Estimate conversations (gaps > 1 hour = new conversation)
  let conversations = 1;
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i-1]._creationTime - messages[i]._creationTime;
    if (gap > 3600000) conversations++;
  }

  // Weekly activity
  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  messages.forEach(m => {
    if (m._creationTime > weekAgo) {
      const day = new Date(m._creationTime).getDay();
      const adjustedDay = day === 0 ? 6 : day - 1; // Monday = 0
      weeklyActivity[adjustedDay]++;
    }
  });

  // Detect topics from user messages
  const topicKeywords: Record<string, { name: string; emoji: string }> = {
    "sad|depressed|down|unhappy": { name: "Emotional Support", emoji: "💜" },
    "anxious|worried|stress|nervous": { name: "Anxiety & Stress", emoji: "🌸" },
    "work|job|career|boss": { name: "Career", emoji: "💼" },
    "relationship|partner|friend": { name: "Relationships", emoji: "💕" },
    "health|sick|tired|sleep": { name: "Health & Wellness", emoji: "🌿" },
    "happy|excited|great|amazing": { name: "Celebrations", emoji: "✨" },
    "help|advice|suggest": { name: "Guidance", emoji: "🧭" },
  };

  const detectedTopics: Array<{ name: string; emoji: string }> = [];
  const allUserText = userMessages.map(m => m.content.toLowerCase()).join(" ");
  
  Object.entries(topicKeywords).forEach(([pattern, topic]) => {
    if (new RegExp(pattern).test(allUserText)) {
      detectedTopics.push(topic);
    }
  });

  // Count support-related messages
  const supportMessages = userMessages.filter(m => 
    /sad|anxious|worried|stress|help|support|feel/i.test(m.content)
  ).length;

  return {
    totalMessages,
    conversations,
    weeklyActivity,
    topics: detectedTopics.slice(0, 6),
    supportMessages,
  };
}

function getRecentConversations(messages: Array<{ role: string; content: string; _creationTime: number }>) {
  const conversations: Array<{ preview: string; timestamp: number; messageCount: number }> = [];
  let currentConv: typeof messages = [];
  
  for (let i = 0; i < messages.length; i++) {
    if (i > 0) {
      const gap = messages[i-1]._creationTime - messages[i]._creationTime;
      if (gap > 3600000 && currentConv.length > 0) {
        // New conversation
        const userMsg = currentConv.find(m => m.role === "user");
        conversations.push({
          preview: userMsg?.content || "Conversation",
          timestamp: currentConv[0]._creationTime,
          messageCount: currentConv.length,
        });
        currentConv = [];
      }
    }
    currentConv.push(messages[i]);
  }
  
  // Add last conversation
  if (currentConv.length > 0) {
    const userMsg = currentConv.find(m => m.role === "user");
    conversations.push({
      preview: userMsg?.content || "Conversation",
      timestamp: currentConv[0]._creationTime,
      messageCount: currentConv.length,
    });
  }

  return conversations;
}
