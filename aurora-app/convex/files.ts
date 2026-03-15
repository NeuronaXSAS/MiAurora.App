import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./auth";

async function canAccessFile(ctx: any, storageId: any, requesterUserId: any) {
  const uploadedFile = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_storage", (q: any) => q.eq("storageId", storageId))
    .first();

  if (uploadedFile?.ownerId === requesterUserId) {
    return true;
  }

  const opportunity = await ctx.db
    .query("opportunities")
    .withIndex("by_thumbnail_storage", (q: any) => q.eq("thumbnailStorageId", storageId))
    .first();

  if (opportunity?.isActive) {
    return true;
  }

  const route = await ctx.db
    .query("routes")
    .withIndex("by_voice_note_storage", (q: any) => q.eq("voiceNoteStorageId", storageId))
    .first();

  if (route && (!route.isPrivate || route.creatorId === requesterUserId)) {
    return true;
  }

  const photoEntry = await ctx.db
    .query("lifeEntries")
    .withIndex("by_photo_storage", (q: any) => q.eq("photoStorageId", storageId))
    .first();

  if (photoEntry?.userId === requesterUserId) {
    return true;
  }

  const voiceEntry = await ctx.db
    .query("lifeEntries")
    .withIndex("by_voice_note_storage", (q: any) => q.eq("voiceNoteStorageId", storageId))
    .first();

  return voiceEntry?.userId === requesterUserId;
}

/**
 * Generate a signed upload URL for file upload
 * This URL can be used to upload files directly to Convex storage
 * Requires authentication to prevent unauthorized uploads
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // Verify user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized - must be authenticated to upload files");
    }

    // Generate and return upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Register an uploaded file to the authenticated user so preview URLs
 * can be resolved without exposing arbitrary storage IDs.
 */
export const registerUploadedFile = mutation({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(args.authToken, args.userId);
    const existing = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();

    if (existing) {
      if (existing.ownerId !== userId) {
        throw new Error("Unauthorized");
      }

      return { success: true, duplicate: true };
    }

    await ctx.db.insert("uploadedFiles", {
      storageId: args.storageId,
      ownerId: userId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get file URL from storage ID
 */
export const getUrl = mutation({
  args: {
    requesterUserId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const allowed = await canAccessFile(ctx, args.storageId, args.requesterUserId);
    if (!allowed) {
      return null;
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(args.authToken, args.userId);
    const uploadedFile = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();

    if (!uploadedFile || uploadedFile.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(uploadedFile._id);
    return { success: true };
  },
});
