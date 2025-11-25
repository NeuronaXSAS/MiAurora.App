"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
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
  Clock
} from "lucide-react";
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
  const router = useRouter();

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

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Workplace Safety Reports</h1>
              <p className="text-white/80">Your voice protects others</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submit Report
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              My Reports
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <WorkplaceReportForm userId={userId} />
          </TabsContent>

          <TabsContent value="my-reports">
            <Card>
              <CardHeader>
                <CardTitle>Your Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {myReports?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>You haven't submitted any reports yet</p>
                  </div>
                )}
                <div className="space-y-4">
                  {myReports?.map((report: any) => (
                    <div key={report._id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{report.companyName}</h4>
                          <Badge className={INCIDENT_COLORS[report.incidentType]}>
                            {INCIDENT_LABELS[report.incidentType]}
                          </Badge>
                        </div>
                        <Badge variant={
                          report.status === "verified" ? "default" :
                          report.status === "submitted" ? "secondary" : "outline"
                        }>
                          {report.status === "verified" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {report.status === "submitted" && <Clock className="w-3 h-3 mr-1" />}
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Warning */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
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
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No public reports found</p>
                      {searchQuery && <p className="text-sm">Try a different search term</p>}
                    </CardContent>
                  </Card>
                )}
                {publicReports?.map((report: any) => (
                  <Card key={report._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {report.companyName}
                          </h4>
                          <Badge className={INCIDENT_COLORS[report.incidentType]}>
                            {INCIDENT_LABELS[report.incidentType]}
                          </Badge>
                        </div>
                        {report.status === "verified" && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{report.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
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
