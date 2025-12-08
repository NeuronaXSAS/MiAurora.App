/**
 * Community Judge Cases - Share verdicts for community voting
 * 
 * Allows users to share their Aurora Judge cases (anonymized)
 * for the community to vote and discuss.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Share a Judge case to the community
export const shareCase = mutation({
    args: {
        // Case details (from the analysis result)
        caseNumber: v.string(),
        person1Label: v.string(),
        person2Label: v.string(),
        argumentType: v.string(),
        situation: v.string(), // Brief description

        // AI verdict
        aiWinner: v.union(
            v.literal("person1"),
            v.literal("person2"),
            v.literal("tie"),
            v.literal("both_wrong")
        ),
        aiToxicityScore: v.number(),
        aiSuggestion: v.string(),

        // Sharing options
        isAnonymous: v.boolean(),
        sessionHash: v.string(),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        // Check if case already exists
        const existing = await ctx.db
            .query("communityJudgeCases")
            .withIndex("by_case_number", (q) => q.eq("caseNumber", args.caseNumber))
            .first();

        if (existing) {
            throw new Error("Case already shared");
        }

        // Create the community case
        const caseId = await ctx.db.insert("communityJudgeCases", {
            submitterId: args.userId,
            sessionHash: args.sessionHash,
            isAnonymous: args.isAnonymous,
            caseNumber: args.caseNumber,
            person1Label: args.isAnonymous ? "Person A" : args.person1Label,
            person2Label: args.isAnonymous ? "Person B" : args.person2Label,
            argumentType: args.argumentType,
            situation: args.situation,
            aiWinner: args.aiWinner,
            aiToxicityScore: args.aiToxicityScore,
            aiSuggestion: args.aiSuggestion,
            votePerson1: 0,
            votePerson2: 0,
            voteTie: 0,
            voteCount: 0,
            commentCount: 0,
            status: "active",
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { caseId, success: true };
    },
});

// Get active community Judge cases
export const getActiveCases = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        const cases = await ctx.db
            .query("communityJudgeCases")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .order("desc")
            .take(limit);

        return cases;
    },
});

// Get trending cases (by vote count)
export const getTrendingCases = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 6;

        const cases = await ctx.db
            .query("communityJudgeCases")
            .withIndex("by_votes")
            .order("desc")
            .filter((q) => q.eq(q.field("status"), "active"))
            .take(limit);

        return cases;
    },
});

// Vote on a community case
export const voteOnCase = mutation({
    args: {
        caseId: v.id("communityJudgeCases"),
        vote: v.union(
            v.literal("person1"),
            v.literal("person2"),
            v.literal("tie")
        ),
        anonymousId: v.optional(v.id("anonymousDebaters")),
        memberId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const caseDoc = await ctx.db.get(args.caseId);
        if (!caseDoc || caseDoc.status !== "active") {
            throw new Error("Case not found or closed");
        }

        // Check for existing vote
        if (args.anonymousId) {
            const existingVote = await ctx.db
                .query("communityJudgeCaseVotes")
                .withIndex("by_anonymous_case", (q) =>
                    q.eq("anonymousId", args.anonymousId).eq("caseId", args.caseId)
                )
                .first();
            if (existingVote) {
                return { alreadyVoted: true };
            }
        } else if (args.memberId) {
            const existingVote = await ctx.db
                .query("communityJudgeCaseVotes")
                .withIndex("by_member_case", (q) =>
                    q.eq("memberId", args.memberId).eq("caseId", args.caseId)
                )
                .first();
            if (existingVote) {
                return { alreadyVoted: true };
            }
        }

        // Record vote
        await ctx.db.insert("communityJudgeCaseVotes", {
            caseId: args.caseId,
            voterType: args.anonymousId ? "anonymous" : "member",
            anonymousId: args.anonymousId,
            memberId: args.memberId,
            vote: args.vote,
            timestamp: Date.now(),
        });

        // Update case vote counts
        const update: Record<string, number> = {
            voteCount: caseDoc.voteCount + 1,
        };
        if (args.vote === "person1") {
            update.votePerson1 = caseDoc.votePerson1 + 1;
        } else if (args.vote === "person2") {
            update.votePerson2 = caseDoc.votePerson2 + 1;
        } else {
            update.voteTie = caseDoc.voteTie + 1;
        }

        await ctx.db.patch(args.caseId, update);

        return { success: true };
    },
});

// Add comment to a case
export const addComment = mutation({
    args: {
        caseId: v.id("communityJudgeCases"),
        content: v.string(),
        parentId: v.optional(v.id("communityJudgeCaseComments")),
        anonymousId: v.optional(v.id("anonymousDebaters")),
        memberId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const caseDoc = await ctx.db.get(args.caseId);
        if (!caseDoc || caseDoc.status !== "active") {
            throw new Error("Case not found or closed");
        }

        // Create comment
        const commentId = await ctx.db.insert("communityJudgeCaseComments", {
            caseId: args.caseId,
            authorType: args.anonymousId ? "anonymous" : "member",
            anonymousId: args.anonymousId,
            memberId: args.memberId,
            content: args.content.slice(0, 1000), // Max 1000 chars
            upvotes: 0,
            downvotes: 0,
            replyCount: 0,
            parentId: args.parentId,
            isHidden: false,
        });

        // Update parent comment reply count if this is a reply
        if (args.parentId) {
            const parent = await ctx.db.get(args.parentId);
            if (parent) {
                await ctx.db.patch(args.parentId, {
                    replyCount: parent.replyCount + 1,
                });
            }
        }

        // Update case comment count
        await ctx.db.patch(args.caseId, {
            commentCount: caseDoc.commentCount + 1,
        });

        return { commentId };
    },
});

// Get comments for a case (with nested structure)
export const getCaseComments = query({
    args: {
        caseId: v.id("communityJudgeCases"),
    },
    handler: async (ctx, args) => {
        // Get all comments for this case
        const allComments = await ctx.db
            .query("communityJudgeCaseComments")
            .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
            .filter((q) => q.eq(q.field("isHidden"), false))
            .collect();

        // Get author info for anonymous debaters
        const anonymousIds = allComments
            .filter((c) => c.authorType === "anonymous" && c.anonymousId)
            .map((c) => c.anonymousId);

        const uniqueAnonymousIds = [...new Set(anonymousIds)];
        const anonymousDebaters = await Promise.all(
            uniqueAnonymousIds.map((id) => id ? ctx.db.get(id) : null)
        );
        const anonymousMap = new Map(
            anonymousDebaters
                .filter((d) => d !== null)
                .map((d) => [d!._id, d])
        );

        // Get member info
        const memberIds = allComments
            .filter((c) => c.authorType === "member" && c.memberId)
            .map((c) => c.memberId);

        const uniqueMemberIds = [...new Set(memberIds)];
        const members = await Promise.all(
            uniqueMemberIds.map((id) => id ? ctx.db.get(id) : null)
        );
        const memberMap = new Map(
            members
                .filter((m) => m !== null)
                .map((m) => [m!._id, m])
        );

        // Build nested structure
        const commentMap = new Map();
        const topLevelComments: any[] = [];

        // First pass: create all comment objects with author info
        for (const comment of allComments) {
            let author;
            if (comment.authorType === "anonymous" && comment.anonymousId) {
                const debater = anonymousMap.get(comment.anonymousId);
                author = debater ? {
                    type: "anonymous",
                    pseudonym: debater.pseudonym,
                    countryFlag: debater.countryFlag,
                } : { type: "anonymous", pseudonym: "Anonymous", countryFlag: "🌍" };
            } else if (comment.memberId) {
                const member = memberMap.get(comment.memberId);
                author = member ? {
                    type: "member",
                    name: member.name,
                    profileImage: member.profileImage,
                } : { type: "member", name: "Member" };
            }

            const enrichedComment = {
                ...comment,
                author,
                replies: [],
            };
            commentMap.set(comment._id, enrichedComment);
        }

        // Second pass: build tree structure
        for (const comment of allComments) {
            const enriched = commentMap.get(comment._id);
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    parent.replies.push(enriched);
                }
            } else {
                topLevelComments.push(enriched);
            }
        }

        // Sort by _creationTime descending
        topLevelComments.sort((a, b) => b._creationTime - a._creationTime);

        return topLevelComments;
    },
});
