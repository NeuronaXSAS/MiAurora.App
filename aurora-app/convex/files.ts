import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
 * Get file URL from storage ID
 */
export const getUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized - must be authenticated to delete files");
    }

    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});
