import { mutation } from "./_generated/server";

export const seedGlobalResources = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("safetyResources").first();
    if (existing) {
      return { message: "Resources already seeded" };
    }

    const resources = [
      // Global Hotlines
      {
        name: "International Association for Suicide Prevention",
        category: "hotline" as const,
        description: "Find crisis centers worldwide. Provides resources and support for suicide prevention globally.",
        website: "https://www.iasp.info/resources/Crisis_Centres/",
        isGlobal: true,
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Crisis Support", "Suicide Prevention", "Mental Health"],
        hours: "24/7 (varies by center)",
        languages: ["Multiple Languages"],
      },
      {
        name: "UN Women - Safe Spaces",
        category: "shelter" as const,
        description: "UN Women's global initiative providing safe spaces for women and girls affected by violence.",
        website: "https://www.unwomen.org/",
        isGlobal: true,
        isVerified: true,
        isActive: true,
        priority: 2,
        services: ["Safe Shelter", "Legal Aid", "Counseling", "Economic Empowerment"],
      },
      // US Resources
      {
        name: "National Domestic Violence Hotline",
        category: "hotline" as const,
        description: "24/7 confidential support for domestic violence survivors. Advocates available in 200+ languages.",
        phone: "1-800-799-7233",
        website: "https://www.thehotline.org/",
        country: "United States",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Crisis Support", "Safety Planning", "Shelter Referrals", "Legal Advocacy"],
        hours: "24/7",
        languages: ["English", "Spanish", "200+ via interpreters"],
      },
      {
        name: "RAINN (Rape, Abuse & Incest National Network)",
        category: "hotline" as const,
        description: "Nation's largest anti-sexual violence organization. Free, confidential support.",
        phone: "1-800-656-4673",
        website: "https://www.rainn.org/",
        country: "United States",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Sexual Assault Support", "Counseling", "Legal Resources"],
        hours: "24/7",
        languages: ["English", "Spanish"],
      },
      {
        name: "National Sexual Assault Hotline",
        category: "counseling" as const,
        description: "Free, confidential support from trained staff members.",
        phone: "1-800-656-4673",
        website: "https://hotline.rainn.org/",
        country: "United States",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Crisis Counseling", "Referrals", "Information"],
        hours: "24/7",
      },
      // UK Resources
      {
        name: "National Domestic Abuse Helpline (UK)",
        category: "hotline" as const,
        description: "Run by Refuge. Free, confidential support for women experiencing domestic abuse.",
        phone: "0808 2000 247",
        website: "https://www.nationaldahelpline.org.uk/",
        country: "United Kingdom",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Crisis Support", "Safety Planning", "Refuge Referrals"],
        hours: "24/7",
        languages: ["English", "Interpreters available"],
      },
      {
        name: "Women's Aid UK",
        category: "shelter" as const,
        description: "National charity working to end domestic abuse against women and children.",
        website: "https://www.womensaid.org.uk/",
        country: "United Kingdom",
        isVerified: true,
        isActive: true,
        priority: 2,
        services: ["Shelter", "Legal Support", "Children's Services", "Training"],
      },
      // Canada Resources
      {
        name: "Assaulted Women's Helpline",
        category: "hotline" as const,
        description: "24-hour telephone and TTY crisis line for all women in Ontario who have experienced abuse.",
        phone: "1-866-863-0511",
        website: "https://www.awhl.org/",
        country: "Canada",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Crisis Support", "Safety Planning", "Referrals"],
        hours: "24/7",
        languages: ["English", "200+ via interpreters"],
      },
      // India Resources
      {
        name: "Women Helpline India",
        category: "hotline" as const,
        description: "Government of India helpline for women in distress.",
        phone: "181",
        country: "India",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Emergency Response", "Police Assistance", "Legal Aid"],
        hours: "24/7",
        languages: ["Hindi", "English", "Regional Languages"],
      },
      {
        name: "National Commission for Women",
        category: "legal" as const,
        description: "Statutory body addressing issues related to safeguarding women's rights.",
        phone: "7827-170-170",
        website: "http://ncw.nic.in/",
        country: "India",
        isVerified: true,
        isActive: true,
        priority: 2,
        services: ["Legal Aid", "Complaints", "Policy Advocacy"],
      },
      // Australia Resources
      {
        name: "1800RESPECT",
        category: "hotline" as const,
        description: "National sexual assault, domestic and family violence counselling service.",
        phone: "1800 737 732",
        website: "https://www.1800respect.org.au/",
        country: "Australia",
        isVerified: true,
        isActive: true,
        priority: 1,
        services: ["Counseling", "Crisis Support", "Referrals"],
        hours: "24/7",
        languages: ["English", "Interpreters available"],
      },
      // Legal Resources
      {
        name: "Legal Aid Society",
        category: "legal" as const,
        description: "Free legal services for low-income individuals facing domestic violence.",
        website: "https://www.legal-aid.org/",
        country: "United States",
        isVerified: true,
        isActive: true,
        priority: 3,
        services: ["Legal Representation", "Restraining Orders", "Custody"],
      },
      // Financial Resources
      {
        name: "Allstate Foundation Purple Purse",
        category: "financial" as const,
        description: "Financial empowerment program for domestic violence survivors.",
        website: "https://www.purplepurse.com/",
        country: "United States",
        isVerified: true,
        isActive: true,
        priority: 4,
        services: ["Financial Education", "Emergency Funds", "Job Training"],
      },
      // Community Resources
      {
        name: "Lean In Circles",
        category: "community" as const,
        description: "Small peer groups that meet regularly to learn and grow together.",
        website: "https://leanin.org/circles",
        isGlobal: true,
        isVerified: true,
        isActive: true,
        priority: 5,
        services: ["Peer Support", "Career Development", "Networking"],
      },
    ];

    for (const resource of resources) {
      await ctx.db.insert("safetyResources", {
        ...resource,
        verificationCount: 10,
      });
    }

    return { message: `Seeded ${resources.length} resources` };
  },
});
