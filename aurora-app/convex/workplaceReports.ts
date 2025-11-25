import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a workplace report
export const submitReport = mutation({
  args: {
    reporterId: v.id("users"),
    companyName: v.string(),
    incidentType: v.union(
      v.literal("harassment"),
      v.literal("discrimination"),
      v.literal("pay_inequality"),
      v.literal("hostile_environment"),
      v.literal("retaliation"),
      v.literal("other")
    ),
    description: v.string(),
    date: v.optional(v.string()),
    isAnonymous: v.boolean(),
    isPublic: v.boolean(),
    supportNeeded: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { reporterId, ...reportData } = args;

    const reportId = await ctx.db.insert("workplaceReports", {
      reporterId,
      ...reportData,
      status: "submitted",
      verificationCount: 0,
    });

    // Award credits for reporting (courage to speak up)
    const user = await ctx.db.get(reporterId);
    if (user) {
      await ctx.db.patch(reporterId, {
        credits: (user.credits || 0) + 25,
        trustScore: Math.min(1000, (user.trustScore || 0) + 10),
      });

      await ctx.db.insert("transactions", {
        userId: reporterId,
        amount: 25,
        type: "workplace_report",
        relatedId: reportId,
      });
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: reporterId,
      type: "verification",
      title: "Report Submitted",
      message: "Thank you for your courage. Your report helps protect other women.",
      isRead: false,
    });

    return { reportId, credits: 25 };
  },
});

// Get user's own reports
export const getMyReports = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workplaceReports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get public reports (for community awareness)
export const getPublicReports = query({
  args: {
    companyName: v.optional(v.string()),
    incidentType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let reports = await ctx.db
      .query("workplaceReports")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(args.limit || 50);

    if (args.companyName) {
      const searchTerm = args.companyName.toLowerCase();
      reports = reports.filter(r => 
        r.companyName.toLowerCase().includes(searchTerm)
      );
    }

    if (args.incidentType) {
      reports = reports.filter(r => r.incidentType === args.incidentType);
    }

    // Return anonymized data
    return reports.map(report => ({
      _id: report._id,
      _creationTime: report._creationTime,
      companyName: report.companyName,
      incidentType: report.incidentType,
      description: report.isAnonymous ? report.description : report.description,
      date: report.date,
      status: report.status,
      verificationCount: report.verificationCount,
      // Never expose reporter identity for anonymous reports
      isAnonymous: report.isAnonymous,
    }));
  },
});

// Verify a report (community verification)
export const verifyReport = mutation({
  args: {
    reportId: v.id("workplaceReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");
    if (!report.isPublic) throw new Error("Cannot verify private reports");
    if (report.reporterId === args.userId) throw new Error("Cannot verify own report");

    // Update verification count
    const newCount = (report.verificationCount || 0) + 1;
    await ctx.db.patch(args.reportId, {
      verificationCount: newCount,
      status: newCount >= 3 ? "verified" : report.status,
    });

    // Award credits to verifier
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 5,
      });
    }

    return { success: true };
  },
});

// Get company safety summary
export const getCompanySafetySummary = query({
  args: { companyName: v.string() },
  handler: async (ctx, args) => {
    const searchTerm = args.companyName.toLowerCase();
    
    const reports = await ctx.db
      .query("workplaceReports")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    const companyReports = reports.filter(r => 
      r.companyName.toLowerCase().includes(searchTerm)
    );

    if (companyReports.length === 0) {
      return null;
    }

    // Calculate incident type breakdown
    const incidentTypes: Record<string, number> = {};
    companyReports.forEach(r => {
      incidentTypes[r.incidentType] = (incidentTypes[r.incidentType] || 0) + 1;
    });

    const verifiedCount = companyReports.filter(r => r.status === "verified").length;

    return {
      companyName: args.companyName,
      totalReports: companyReports.length,
      verifiedReports: verifiedCount,
      incidentTypes,
      recentReports: companyReports.slice(0, 5),
    };
  },
});

// Delete own report
export const deleteReport = mutation({
  args: {
    reportId: v.id("workplaceReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report || report.reporterId !== args.userId) {
      throw new Error("Report not found or unauthorized");
    }
    await ctx.db.delete(args.reportId);
    return { success: true };
  },
});
