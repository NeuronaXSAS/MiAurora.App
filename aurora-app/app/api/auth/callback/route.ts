import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithCode } from '@/lib/workos';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {
  clearAuthCookies,
  readOauthCodeVerifier,
  readOauthState,
  setSessionCookie,
} from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=invalid_oauth_callback', request.url));
    }

    const cookieStore = await cookies();
    const [expectedState, codeVerifier] = await Promise.all([
      readOauthState(cookieStore),
      readOauthCodeVerifier(cookieStore),
    ]);

    if (!expectedState || !codeVerifier || expectedState !== state) {
      clearAuthCookies(cookieStore);
      return NextResponse.redirect(new URL("/?error=invalid_oauth_state", request.url));
    }

    // Exchange code for user profile and tokens
    const { user } = await authenticateWithCode(code, codeVerifier);

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

    clearAuthCookies(cookieStore);
    await setSessionCookie(cookieStore, {
      convexUserId: convexUser._id,
      workosUserId: user.id,
      email: user.email,
    });

    // Redirect to feed page (or onboarding if new user)
    return NextResponse.redirect(new URL('/feed', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    const cookieStore = await cookies();
    clearAuthCookies(cookieStore);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
