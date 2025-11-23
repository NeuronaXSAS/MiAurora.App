import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Generate a signed upload URL for file upload
 * This URL can be used to upload files directly to Convex storage
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
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
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});
