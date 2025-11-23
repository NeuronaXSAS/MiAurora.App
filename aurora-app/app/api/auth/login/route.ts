import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/workos';

export async function GET(request: NextRequest) {
  try {
    // Get provider from query params (default to Google)
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') as 'GoogleOAuth' | 'MicrosoftOAuth' || 'GoogleOAuth';

    // Generate authorization URL
    const authUrl = await getAuthorizationUrl(provider);

    // Redirect to WorkOS authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 }
    );
  }
}
