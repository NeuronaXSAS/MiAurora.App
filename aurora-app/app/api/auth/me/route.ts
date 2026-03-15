import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createConvexAuthToken } from "@/lib/auth-proof";
import { readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await readSession(cookieStore);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user data to get premium status
    let isPremium = false;
    let email = null;
    try {
      const user = await convex.query(api.users.getUser, { 
        userId: session.convexUserId as Id<"users"> 
      });
      if (!user || user.workosId !== session.workosUserId) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      isPremium = user.isPremium || false;
      email = user.email || null;
    } catch (e) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const authToken = await createConvexAuthToken({
      userId: session.convexUserId,
      workosUserId: session.workosUserId,
    });

    return NextResponse.json({
      authToken,
      userId: session.convexUserId,
      workosUserId: session.workosUserId,
      isPremium,
      email,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
