"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WorkplaceReportForm } from "@/components/workplace-report-form";
import { 
  Shield, 
  FileText, 
  Search, 
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const INCIDENT_LABELS: Record<string, string> = {
  harassment: "Sexual Harassment",
  discrimination: "Discrimination",
  pay_inequality: "Pay Inequality",
  hostile_environment: "Hostile Environment",
  retaliation: "Retaliation",
  other: "Other",
};

const INCIDENT_COLORS: Record<string, string> = {
  harassment: "bg-red-100 text-red-700",
  discrimination: "bg-orange-100 text-orange-700",
  pay_inequality: "bg-yellow-100 text-yellow-700",
  hostile_environment: "bg-purple-100 text-purple-700",
  retaliation: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

export default function ReportPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState("submit");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const deleteReport = useMutation(api.workplaceReports.deleteReport);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

  const myReports = useQuery(
    api.workplaceReports.getMyReports,
    userId ? { userId } : "skip"
  );

  const publicReports = useQuery(api.workplaceReports.getPublicReports, {
    companyName: searchQuery || undefined,
    limit: 30,
  });

  const handleDeleteReport = async (reportId: Id<"workplaceReports">) => {
    if (!userId) return;
    if (confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      setDeletingId(reportId);
      try {
        await deleteReport({ reportId, userId });
      } catch (error) {
        alert("Failed to delete report");
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] via-[var(--color-aurora-pink)] to-[var(--color-aurora-salmon)] text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Workplace Safety Reports</h1>
              <p className="text-white/80 text-sm sm:text-base">Your voice protects others</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <TabsTrigger value="submit" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Submit Report</span>
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">My Reports</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <WorkplaceReportForm userId={userId} />
          </TabsContent>

          <TabsContent value="my-reports">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Your Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {myReports?.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                    <p className="text-[var(--muted-foreground)]">You haven't submitted any reports yet</p>
                  </div>
                )}
                <div className="space-y-4">
                  {myReports?.map((report: any) => (
                    <div key={report._id} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--accent)]/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[var(--foreground)]">{report.companyName}</h4>
                          <Badge className={INCIDENT_COLORS[report.incidentType]}>
                            {INCIDENT_LABELS[report.incidentType]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            report.status === "verified" ? "default" :
                            report.status === "submitted" ? "secondary" : "outline"
                          }>
                            {report.status === "verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {report.status === "submitted" && <Clock className="w-3 h-3 mr-1" />}
                            {report.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReport(report._id)}
                            disabled={deletingId === report._id}
                            className="text-[var(--color-aurora-salmon)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10 min-h-[36px] min-w-[36px]"
                          >
                            {deletingId === report._id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--foreground)] line-clamp-2">{report.description}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-2">
                        {formatDistanceToNow(report._creationTime, { addSuffix: true })}
                        {report.isPublic && " • Public"}
                        {report.isAnonymous && " • Anonymous"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search by company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--background)] border-[var(--border)] min-h-[44px]"
                />
              </div>

              {/* Warning */}
              <Card className="bg-[var(--color-aurora-yellow)]/10 border-[var(--color-aurora-yellow)]/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-yellow)] flex-shrink-0" />
                    <p className="text-sm text-[var(--foreground)]">
                      These reports are shared by community members. While we verify reports 
                      through community consensus, please use this information as one data point 
                      in your decision-making.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Reports */}
              <div className="space-y-4">
                {publicReports?.length === 0 && (
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="py-8 text-center">
                      <Building className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                      <p className="text-[var(--muted-foreground)]">No public reports found</p>
                      {searchQuery && <p className="text-sm text-[var(--muted-foreground)]">Try a different search term</p>}
                    </CardContent>
                  </Card>
                )}
                {publicReports?.map((report: any) => (
                  <Card key={report._id} className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <Building className="w-4 h-4" />
                            {report.companyName}
                          </h4>
                          <Badge className={INCIDENT_COLORS[report.incidentType]}>
                            {INCIDENT_LABELS[report.incidentType]}
                          </Badge>
                        </div>
                        {report.status === "verified" && (
                          <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-2">{report.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                        <span>{formatDistanceToNow(report._creationTime, { addSuffix: true })}</span>
                        {report.date && <span>Incident: {report.date}</span>}
                        <span>{report.verificationCount || 0} verifications</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
