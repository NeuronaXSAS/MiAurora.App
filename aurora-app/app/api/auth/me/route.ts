import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    return NextResponse.json({
      userId,
      workosUserId,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
