"use client";

/**
 * Resource Monitor - Admin Dashboard Component
 * 
 * Shows real-time API usage to prevent overspending on free tiers.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Video, 
  Cloud, 
  Search,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResourceUsage {
  used: number;
  limit: number;
  percentage: number;
}

interface UsageStats {
  gemini: ResourceUsage;
  agora: ResourceUsage;
  cloudinary: ResourceUsage;
  braveSearch: ResourceUsage;
}

export function ResourceMonitor() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/resource-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch resource stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-[var(--color-aurora-salmon)]";
    if (percentage >= 70) return "text-[var(--color-aurora-yellow)]";
    return "text-[var(--color-aurora-mint)]";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4" />;
    if (percentage >= 70) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-[var(--color-aurora-salmon)]";
    if (percentage >= 70) return "bg-[var(--color-aurora-yellow)]";
    return "bg-[var(--color-aurora-mint)]";
  };

  if (loading && !stats) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)] mt-2">Loading resource stats...</p>
        </CardContent>
      </Card>
    );
  }

  // Default stats if API not available
  const displayStats = stats || {
    gemini: { used: 0, limit: 150, percentage: 0 },
    agora: { used: 0, limit: 8000, percentage: 0 },
    cloudinary: { used: 0, limit: 20, percentage: 0 },
    braveSearch: { used: 0, limit: 1500, percentage: 0 },
  };

  const resources = [
    {
      name: "Gemini AI",
      icon: <Zap className="w-5 h-5" />,
      ...displayStats.gemini,
      unit: "requests/day",
      description: "AI chat & search summaries",
    },
    {
      name: "Agora",
      icon: <Video className="w-5 h-5" />,
      ...displayStats.agora,
      unit: "minutes/month",
      description: "Livestreaming",
      disabled: true,
    },
    {
      name: "Cloudinary",
      icon: <Cloud className="w-5 h-5" />,
      ...displayStats.cloudinary,
      unit: "credits/month",
      description: "Image & video storage",
    },
    {
      name: "Brave Search",
      icon: <Search className="w-5 h-5" />,
      ...displayStats.braveSearch,
      unit: "queries/month",
      description: "Web search API",
    },
  ];

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            Resource Monitor
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStats}
            disabled={loading}
            className="min-h-[36px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Free tier limits - conserve resources!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map((resource) => (
          <div key={resource.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={getStatusColor(resource.percentage)}>
                  {resource.icon}
                </span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {resource.name}
                </span>
                {'disabled' in resource && resource.disabled && (
                  <Badge variant="outline" className="text-xs">
                    Disabled
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(resource.percentage)}`}>
                  {getStatusIcon(resource.percentage)}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {resource.used}/{resource.limit} {resource.unit}
                </span>
              </div>
            </div>
            <div className="relative h-2 bg-[var(--accent)] rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 ${getProgressColor(resource.percentage)} transition-all duration-300`}
                style={{ width: `${Math.min(resource.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {resource.description}
            </p>
          </div>
        ))}

        {/* Warning Banner */}
        {resources.some(r => r.percentage >= 70) && (
          <div className="p-3 bg-[var(--color-aurora-yellow)]/10 border border-[var(--color-aurora-yellow)]/30 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-yellow)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Resource usage high
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Consider reducing API calls or upgrading to paid tiers.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
