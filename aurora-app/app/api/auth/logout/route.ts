import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear all auth cookies
    const cookieStore = await cookies();
    
    cookieStore.delete('workos_access_token');
    cookieStore.delete('workos_refresh_token');
    cookieStore.delete('workos_user_id');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
