import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithCode } from '@/lib/workos';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Exchange code for user profile and tokens
    const { user, accessToken, refreshToken } = await authenticateWithCode(code);

    // Create or get user in Convex
    // Construct name from available fields, fallback to email
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user.email.split('@')[0] || user.email;
    
    const convexUser = await convex.mutation(api.users.getOrCreateUser, {
      workosId: user.id,
      email: user.email,
      name: displayName,
      profileImage: user.profilePictureUrl || undefined,
    });

    if (!convexUser) {
      throw new Error('Failed to create or get user in Convex');
    }

    // Set secure HTTP-only cookies
    const cookieStore = await cookies();
    
    cookieStore.set('workos_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    cookieStore.set('workos_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Store user ID for quick access
    cookieStore.set('workos_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Store Convex user ID
    cookieStore.set('convex_user_id', convexUser._id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Redirect to feed page (or onboarding if new user)
    return NextResponse.redirect(new URL('/feed', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
