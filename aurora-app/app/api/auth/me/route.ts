import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const userId = cookieStore.get('convex_user_id')?.value;
    const workosUserId = cookieStore.get('workos_user_id')?.value;

    if (!userId || !workosUserId) {
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
        userId: userId as Id<"users"> 
      });
      isPremium = user?.isPremium || false;
      email = user?.email || null;
    } catch (e) {
      // Continue without premium status
    }

    return NextResponse.json({
      userId,
      workosUserId,
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
