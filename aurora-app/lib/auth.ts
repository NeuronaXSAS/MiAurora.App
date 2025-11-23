import { cookies } from 'next/headers';
import { getUserProfile, refreshAccessToken } from './workos';

/**
 * Get current authenticated user from cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    
    const userId = cookieStore.get('workos_user_id')?.value;

    if (!userId) {
      return null;
    }

    // Get user profile
    const user = await getUserProfile(userId);

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use in server components/actions that require auth
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
