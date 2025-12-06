/**
 * Admin API - Resource Stats
 * 
 * Returns current API usage statistics for monitoring.
 */

import { NextResponse } from "next/server";
import { getUsageStats } from "@/lib/resource-guard";

export async function GET() {
  try {
    const stats = getUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting resource stats:", error);
    return NextResponse.json(
      { error: "Failed to get resource stats" },
      { status: 500 }
    );
  }
}
