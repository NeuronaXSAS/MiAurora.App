"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Server, Database, AlertTriangle, CheckCircle2 } from "lucide-react";

interface DiagnosticsPayload {
  runtime?: {
    nodeEnv?: string;
    convexUrl?: string;
    workosRedirectUri?: string;
  };
  configStatus?: {
    services?: Record<string, string>;
  };
  warnings?: string[];
}

export default function AdminSystemPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setLoadingUser(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        const response = await fetch("/api/admin/system-diagnostics");
        const data = await response.json();
        setDiagnostics(data);
      } catch (error) {
        console.error("Failed to load diagnostics", error);
      }
    };
    loadDiagnostics();
  }, []);

  const isAdmin = useQuery(api.admin.isAdmin, userId ? { userId } : "skip");
  const environmentDiagnostics = useQuery(
    api.cleanup.getEnvironmentDiagnostics,
    userId && isAdmin ? {} : "skip",
  );
  const readiness = useQuery(
    api.cleanup.getFeatureReadinessAudit,
    userId && isAdmin ? {} : "skip",
  );
  const resetAudit = useQuery(
    api.cleanup.getProductionResetAudit,
    userId && isAdmin ? {} : "skip",
  );

  if (loadingUser || isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading admin diagnostics...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="w-10 h-10 mx-auto text-[var(--color-aurora-salmon)]" />
            <div className="text-xl font-semibold">Access denied</div>
            <div className="text-[var(--muted-foreground)]">
              This diagnostics surface is limited to Aurora administrators.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
              <Server className="w-7 h-7 text-[var(--color-aurora-purple)]" />
              System Diagnostics
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Canonical environment, readiness, and reset visibility for Aurora.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin")}>
            Back to Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Runtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Stage: <strong>{environmentDiagnostics?.detectedStage || "unknown"}</strong></div>
              <div>Node: <strong>{diagnostics?.runtime?.nodeEnv || "unknown"}</strong></div>
              <div>Convex deployment: <strong>{environmentDiagnostics?.deployment?.convexDeployment || "unset"}</strong></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reset Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Delete records: <strong>{resetAudit?.resetImpact?.recordsToDelete ?? "--"}</strong></div>
              <div>Preserve records: <strong>{resetAudit?.resetImpact?.recordsToPreserve ?? "--"}</strong></div>
              <div>Seeded users detected: <strong>{resetAudit?.generatedContent?.seededUsers ?? "--"}</strong></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Warnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(diagnostics?.warnings || environmentDiagnostics?.warnings || []).length === 0 ? (
                <div className="flex items-center gap-2 text-[var(--color-aurora-mint)]">
                  <CheckCircle2 className="w-4 h-4" />
                  No active warnings
                </div>
              ) : (
                (diagnostics?.warnings || environmentDiagnostics?.warnings || []).map((warning) => (
                  <div key={warning} className="flex items-start gap-2 text-[var(--color-aurora-salmon)]">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(diagnostics?.configStatus?.services || {}).map(([service, state]) => (
              <div
                key={service}
                className="rounded-xl border border-[var(--border)] p-3 flex items-center justify-between gap-3"
              >
                <span className="font-medium text-[var(--foreground)]">{service}</span>
                <Badge variant="outline">{state}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readiness &&
              Object.entries(readiness)
                .filter(([key]) => key !== "currentDataFootprint")
                .map(([feature, info]) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-[var(--border)] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-semibold capitalize">
                        {feature.replace(/([A-Z])/g, " $1")}
                      </div>
                      <Badge
                        className={
                          info.status === "working"
                            ? "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]"
                            : info.status === "working_with_risk"
                              ? "bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]"
                              : "bg-[var(--color-aurora-salmon)] text-white"
                        }
                      >
                        {info.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">{info.note}</div>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Data Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(resetAudit?.inventory || []).slice(0, 12).map((item) => (
              <div
                key={item.tableName}
                className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  <div>
                    <div className="font-medium">{item.tableName}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {item.classification}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
