import { WorkOS } from '@workos-inc/node';

// Initialize WorkOS client
export const workos = new WorkOS(process.env.WORKOS_API_KEY);

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID!;
export const WORKOS_REDIRECT_URI = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI!;

/**
 * Generate authorization URL for OAuth login
 * @param provider - OAuth provider (authkit for full box, or specific provider)
 * @returns Authorization URL to redirect user to
 */
export async function getAuthorizationUrl(provider?: 'GoogleOAuth' | 'MicrosoftOAuth' | 'authkit') {
  // Use 'authkit' to show the full AuthKit box with all configured providers
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: provider || 'authkit',
    clientId: WORKOS_CLIENT_ID,
    redirectUri: WORKOS_REDIRECT_URI,
  });

  return authorizationUrl;
}

/**
 * Authenticate user with authorization code from OAuth callback
 * @param code - Authorization code from OAuth provider
 * @returns User profile and session information
 */
export async function authenticateWithCode(code: string) {
  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: WORKOS_CLIENT_ID,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('WorkOS authentication error:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Get user profile from user ID
 * @param userId - WorkOS user ID
 * @returns User profile
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await workos.userManagement.getUser(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePictureUrl: user.profilePictureUrl,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - WorkOS refresh token
 * @returns New access token and refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
      await workos.userManagement.authenticateWithRefreshToken({
        clientId: WORKOS_CLIENT_ID,
        refreshToken,
      });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}
