import { cookies } from 'next/headers';
import { getUserProfile } from './workos';
import { readSession } from "./server-session";

/**
 * Get current authenticated user from cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = await readSession(cookieStore);

    if (!session) {
      return null;
    }

    // Get user profile
    const user = await getUserProfile(session.workosUserId);

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
