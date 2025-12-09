"use client";

/**
 * Demographics Analytics Component
 *
 * Privacy-preserving demographic analytics for Aurora Admin Dashboard
 * Shows aggregated, anonymized data about community demographics
 *
 * Features:
 * - Gender identity distribution
 * - Age range distribution
 * - Pronoun distribution
 * - Geographic distribution (top countries)
 * - Identity tags / community affiliations
 * - Engagement metrics by demographic
 *
 * Security: Admin-only access, no individual user data exposed
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Globe,
  Shield,
  TrendingUp,
  Heart,
  Sparkles,
  MapPin,
  UserCheck,
  Crown,
  Lock,
  BarChart3,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

// Country code to name mapping (common ones)
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  BR: "Brazil",
  MX: "Mexico",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  PT: "Portugal",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  EG: "Egypt",
  PH: "Philippines",
  ID: "Indonesia",
  TH: "Thailand",
  VN: "Vietnam",
  SG: "Singapore",
  MY: "Malaysia",
  NZ: "New Zealand",
  IE: "Ireland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
};

// Gender label formatting with emojis
const GENDER_LABELS: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  woman: { label: "Woman", emoji: "👩", color: "bg-pink-500" },
  "non-binary": { label: "Non-binary", emoji: "🌈", color: "bg-purple-500" },
  "trans-woman": { label: "Trans Woman", emoji: "🏳️‍⚧️", color: "bg-blue-400" },
  agender: { label: "Agender", emoji: "✨", color: "bg-gray-400" },
  "two-spirit": { label: "Two-Spirit", emoji: "🪶", color: "bg-amber-500" },
  questioning: { label: "Questioning", emoji: "💭", color: "bg-cyan-500" },
  custom: { label: "Custom", emoji: "💜", color: "bg-violet-500" },
  "prefer-not-to-say": { label: "Private", emoji: "🔒", color: "bg-slate-500" },
  "not-specified": {
    label: "Not Specified",
    emoji: "➖",
    color: "bg-slate-400",
  },
};

// Age range colors
const AGE_COLORS: Record<string, string> = {
  "13-17": "bg-emerald-400",
  "18-24": "bg-green-500",
  "25-34": "bg-teal-500",
  "35-44": "bg-cyan-500",
  "45-54": "bg-blue-500",
  "55-64": "bg-indigo-500",
  "65+": "bg-purple-500",
  "prefer-not-to-say": "bg-slate-500",
  "not-specified": "bg-slate-400",
};

// Pronoun display
const PRONOUN_LABELS: Record<string, string> = {
  "she/her": "She/Her",
  "they/them": "They/Them",
  "she/they": "She/They",
  "he/him": "He/Him",
  any: "Any Pronouns",
  custom: "Custom",
  "not-specified": "Not Specified",
};

interface DemographicsAnalyticsProps {
  userId: Id<"users"> | null;
}

export function DemographicsAnalytics({ userId }: DemographicsAnalyticsProps) {
  const demographics = useQuery(
    api.admin.getDemographicStats,
    userId ? { userId } : "skip",
  );

  if (!demographics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-[var(--card)] border-[var(--border)] animate-pulse"
            >
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-[var(--card)] border-[var(--border)] animate-pulse"
            >
              <CardContent className="p-6 h-64" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-[var(--color-aurora-purple)]/10 border border-[var(--color-aurora-purple)]/30 rounded-xl p-4 flex items-center gap-3">
        <Lock className="w-5 h-5 text-[var(--color-aurora-purple)]" />
        <p className="text-sm text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">
            Privacy Protected:
          </span>{" "}
          {demographics.privacyNote}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="text-[var(--color-aurora-purple)]"
          label="Total Community"
          value={demographics.totalUsers}
          subtext="Active members"
        />
        <StatCard
          icon={UserCheck}
          iconColor="text-[var(--color-aurora-mint)]"
          label="Identity Filled"
          value={`${demographics.gender.filledPercentage}%`}
          subtext={`${demographics.gender.filledCount} users shared`}
        />
        <StatCard
          icon={Globe}
          iconColor="text-[var(--color-aurora-blue)]"
          label="Countries"
          value={demographics.geography.topCountries.length}
          subtext={`${demographics.geography.filledPercentage}% with location`}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[var(--color-aurora-yellow)]"
          label="Onboarding Rate"
          value={`${demographics.engagement.onboardingRate}%`}
          subtext={`${demographics.engagement.completedOnboarding} completed`}
        />
      </div>

      {/* Main Demographics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              Gender Identity Distribution
              <Badge className="ml-auto bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]">
                {demographics.gender.filledCount} responses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demographics.gender.distribution
              .filter((item) => item.count > 0)
              .map((item) => {
                const config = GENDER_LABELS[item.label] || {
                  label: item.label,
                  emoji: "👤",
                  color: "bg-gray-500",
                };
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[var(--foreground)]">
                        <span>{config.emoji}</span>
                        {config.label}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--muted)]/30 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${config.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {demographics.gender.distribution.every(
              (item) => item.count === 0,
            ) && (
              <p className="text-center text-[var(--muted-foreground)] py-4">
                No gender data collected yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Age Range Distribution */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--color-aurora-blue)]" />
              Age Range Distribution
              <Badge className="ml-auto bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]">
                {demographics.ageRange.filledCount} responses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demographics.ageRange.distribution
              .filter(
                (item) => item.count > 0 && item.label !== "not-specified",
              )
              .map((item) => {
                const color = AGE_COLORS[item.label] || "bg-gray-500";
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)]">
                        {item.label}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--muted)]/30 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {demographics.ageRange.distribution.every(
              (item) => item.count === 0 || item.label === "not-specified",
            ) && (
              <p className="text-center text-[var(--muted-foreground)] py-4">
                No age data collected yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pronoun Distribution */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Pronoun Preferences
              <Badge className="ml-auto bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                {demographics.pronouns.filledCount} responses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {demographics.pronouns.distribution
                .filter(
                  (item) => item.count > 0 && item.label !== "not-specified",
                )
                .map((item) => (
                  <Badge
                    key={item.label}
                    className="bg-[var(--color-aurora-lavender)]/20 text-[var(--color-aurora-lavender)] hover:bg-[var(--color-aurora-lavender)]/30 text-sm py-2 px-4"
                  >
                    {PRONOUN_LABELS[item.label] || item.label}
                    <span className="ml-2 opacity-70">({item.count})</span>
                  </Badge>
                ))}
            </div>
            {demographics.pronouns.distribution.every(
              (item) => item.count === 0 || item.label === "not-specified",
            ) && (
              <p className="text-center text-[var(--muted-foreground)] py-4">
                No pronoun data collected yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--color-aurora-mint)]" />
              Top Countries
              <Badge className="ml-auto bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                {demographics.geography.filledCount} with location
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demographics.geography.topCountries.length > 0 ? (
              <div className="space-y-2">
                {demographics.geography.topCountries.map((country, index) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--muted)]/10 hover:bg-[var(--muted)]/20 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[var(--muted-foreground)]">
                        #{index + 1}
                      </span>
                      <span className="text-[var(--foreground)]">
                        {COUNTRY_NAMES[country.code] || country.code}
                      </span>
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {country.count} ({country.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--muted-foreground)] py-4">
                No geographic data collected yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Identity Tags */}
      {demographics.identityTags.length > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-aurora-salmon)]" />
              Community Identity Tags
              <p className="ml-4 text-sm font-normal text-[var(--muted-foreground)]">
                Self-identified community affiliations
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {demographics.identityTags.map((tag) => (
                <Badge
                  key={tag.tag}
                  className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/30 text-sm py-2 px-4"
                >
                  {tag.tag}
                  <span className="ml-2 opacity-70">({tag.count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium by Gender */}
      {demographics.engagement.premiumByGender.length > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              Premium Members by Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {demographics.engagement.premiumByGender.map(
                ({ gender, count }) => {
                  const config = GENDER_LABELS[gender] || {
                    label: gender,
                    emoji: "👤",
                    color: "bg-gray-500",
                  };
                  return (
                    <div
                      key={gender}
                      className="flex items-center gap-2 bg-[var(--color-aurora-yellow)]/10 rounded-lg py-2 px-4"
                    >
                      <span>{config.emoji}</span>
                      <span className="text-[var(--foreground)]">
                        {config.label}
                      </span>
                      <Badge className="bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]">
                        {count}
                      </Badge>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-[var(--muted-foreground)] pt-4 border-t border-[var(--border)]">
        <Lock className="w-3 h-3 inline-block mr-1" />
        Demographics data is collected optionally and stored securely. All
        analytics are aggregated to protect individual privacy.
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {value}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {subtext}
            </p>
          </div>
          <div className={`p-2 rounded-lg bg-[var(--muted)]/20`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DemographicsAnalytics;
