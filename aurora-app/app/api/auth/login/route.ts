import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/workos';

export async function GET(request: NextRequest) {
  try {
    // Get provider from query params (default to authkit for full box)
    const searchParams = request.nextUrl.searchParams;
    const providerParam = searchParams.get('provider');
    
    // If no provider specified, use 'authkit' to show full AuthKit box
    // Otherwise use the specific provider
    const provider = providerParam as 'GoogleOAuth' | 'MicrosoftOAuth' | 'authkit' | undefined;

    // Generate authorization URL (defaults to authkit if no provider)
    const authUrl = await getAuthorizationUrl(provider || undefined);

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
