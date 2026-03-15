import { Id } from "./_generated/dataModel";
import { verifyConvexAuthToken } from "../lib/auth-proof";

export async function requireAuthenticatedUser(
  authToken: string,
  expectedUserId?: Id<"users"> | string,
  expectedWorkosUserId?: string,
): Promise<{
  userId: Id<"users">;
  workosUserId: string;
}> {
  const proof = await verifyConvexAuthToken(authToken);
  if (!proof) {
    throw new Error("Unauthorized");
  }

  if (expectedUserId && proof.userId !== String(expectedUserId)) {
    throw new Error("Unauthorized");
  }

  if (expectedWorkosUserId && proof.workosUserId !== expectedWorkosUserId) {
    throw new Error("Unauthorized");
  }

  return {
    userId: proof.userId as Id<"users">,
    workosUserId: proof.workosUserId,
  };
}
