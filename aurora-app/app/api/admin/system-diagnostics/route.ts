import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { CONFIG, getConfigStatus } from "@/lib/config";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const [environmentDiagnostics, featureReadiness] = await Promise.all([
      convex.query(api.cleanup.getEnvironmentDiagnostics, {}),
      convex.query(api.cleanup.getFeatureReadinessAudit, {}),
    ]);

    const warnings = [
      !CONFIG.convexUrl ? "NEXT_PUBLIC_CONVEX_URL is missing in the Next.js runtime." : null,
      !CONFIG.workos.redirectUri
        ? "NEXT_PUBLIC_WORKOS_REDIRECT_URI is missing in the Next.js runtime."
        : null,
      !process.env.ADMIN_API_KEY
        ? "ADMIN_API_KEY is not configured. Admin-triggered automation routes stay locked."
        : null,
      !process.env.BRAVE_SEARCH_API_KEY
        ? "BRAVE_SEARCH_API_KEY is missing. Web search will degrade."
        : null,
    ].filter(Boolean);

    return NextResponse.json({
      runtime: {
        nodeEnv: CONFIG.nodeEnv,
        convexUrl: CONFIG.convexUrl,
        workosRedirectUri: CONFIG.workos.redirectUri,
      },
      configStatus: getConfigStatus(),
      environmentDiagnostics,
      featureReadiness,
      warnings,
    });
  } catch (error) {
    console.error("System diagnostics error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
