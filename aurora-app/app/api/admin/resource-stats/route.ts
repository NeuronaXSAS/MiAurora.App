/**
 * Admin API - Resource Stats
 *
 * Returns current API usage statistics for monitoring.
 * Requires admin authentication.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUsageStats } from "@/lib/resource-guard";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const convexUserId = cookieStore.get("convex_user_id")?.value;

    if (!convexUserId) {
      return NextResponse.json(
        { error: "Unauthorized - not authenticated" },
        { status: 401 },
      );
    }

    // Verify user is admin
    const isAdmin = await convex.query(api.admin.isAdmin, {
      userId: convexUserId as Id<"users">,
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 },
      );
    }

    const stats = getUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting resource stats:", error);
    return NextResponse.json(
      { error: "Failed to get resource stats" },
      { status: 500 },
    );
  }
}
