/**
 * Aurora App - Massive Seed Data Generator
 * 
 * Creates 1000+ posts, users, routes, opportunities, and interactions
 * to demonstrate the full functionality of Aurora App globally.
 */

import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================
// GLOBAL DATA SETS
// ============================================

const CITIES = [
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Manchester", country: "UK", lat: 53.4808, lng: -2.2426 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Munich", country: "Germany", lat: 48.1351, lng: 11.5820 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Milan", country: "Italy", lat: 45.4642, lng: 9.1900 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Medellín", country: "Colombia", lat: 6.2442, lng: -75.5812 },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297 },
  { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378 },
];

const FEMALE_NAMES = [
  "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia",
  "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", "Avery",
  "Ella", "Scarlett", "Grace", "Chloe", "Victoria", "Riley", "Aria", "Lily",
  "Aurora", "Zoey", "Nora", "Camila", "Hannah", "Lillian", "Addison",
  "María", "Carmen", "Ana", "Lucía", "Elena", "Paula", "Laura", "Marta",
  "Sakura", "Yuki", "Hana", "Mei", "Aiko", "Rin", "Sora", "Miku",
  "Priya", "Ananya", "Diya", "Aisha", "Fatima", "Zara", "Leila", "Nadia",
  "Chioma", "Amara", "Zainab", "Nneka", "Adaeze", "Chiamaka", "Oluchi",
  "Valentina", "Camila", "Mariana", "Gabriela", "Fernanda", "Daniela",
  "Ji-yeon", "Min-ji", "Soo-yeon", "Hye-jin", "Yuna", "Minji", "Seoyeon",
  "Ingrid", "Astrid", "Freya", "Sigrid", "Linnea", "Maja", "Elsa", "Saga",
  "Anastasia", "Natasha", "Olga", "Svetlana", "Irina", "Ekaterina", "Daria",
  "Cleo", "Thalia", "Athena", "Daphne", "Iris", "Penelope", "Cassandra",
  "Aaliyah", "Imani", "Nia", "Kira", "Maya", "Zuri", "Amani", "Sanaa",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Tanaka", "Yamamoto", "Suzuki", "Watanabe", "Kim",
  "Park", "Choi", "Singh", "Patel", "Kumar", "Sharma", "Müller", "Schmidt",
  "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz",
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo",
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Okonkwo", "Adeyemi", "Okafor", "Nwosu", "Eze", "Chukwu", "Abubakar",
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Marketing",
  "Design", "Engineering", "Legal", "Consulting", "Media",
  "Retail", "Hospitality", "Real Estate", "Non-profit", "Government",
  "Manufacturing", "Transportation", "Energy", "Agriculture", "Arts",
  "Science", "Research", "Pharmaceuticals", "Telecommunications", "Insurance",
];

const COMPANIES = [
  "Google", "Microsoft", "Apple", "Amazon", "Meta", "Netflix", "Spotify",
  "Salesforce", "Adobe", "Oracle", "IBM", "Intel", "Cisco", "Dell",
  "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Bank of America", "Citi",
  "McKinsey", "BCG", "Bain", "Deloitte", "PwC", "EY", "KPMG", "Accenture",
  "Johnson & Johnson", "Pfizer", "Merck", "Novartis", "Roche", "AstraZeneca",
  "Unilever", "P&G", "Nestlé", "Coca-Cola", "PepsiCo", "Nike", "Adidas",
  "Toyota", "BMW", "Mercedes-Benz", "Tesla", "Ford", "General Motors",
  "Airbnb", "Uber", "Lyft", "DoorDash", "Instacart", "Stripe", "Square",
  "Shopify", "Zoom", "Slack", "Dropbox", "Atlassian", "HubSpot", "Zendesk",
  "Local Startup", "Community Organization", "Small Business", "Freelance",
];

const HAIR_STYLES = ["variant01", "variant02", "variant03", "variant04", "variant05", "variant06", "variant07", "variant08"];
const HAIR_COLORS = ["0e0e0e", "3a1a00", "71472d", "b5651d", "e6be8a", "c41e3a", "ff69b4", "4a0080"];
const SKIN_COLORS = ["f5d0c5", "d4a574", "c68642", "8d5524", "5c3317", "3b2219"];
const EYES_STYLES = ["variant01", "variant02", "variant03", "variant04", "variant05"];
const MOUTH_STYLES = ["happy01", "happy02", "happy03", "happy04", "happy05", "happy06"];
const EARRINGS = ["variant01", "variant02", "variant03", "variant04", "variant05", "variant06"];
const BG_COLORS = ["f29de5", "c9cef4", "d6f4ec", "e5e093", "fffaf1", "ffd1dc", "b5e7a0", "aec6cf"];

// Post content templates
const POST_TEMPLATES = {
  professional: [
    { title: "Amazing workplace culture at {company}", desc: "Just started my new role and the team is incredibly supportive. Women in leadership positions, flexible hours, and genuine commitment to diversity. Highly recommend!" },
    { title: "Interview experience at {company}", desc: "Had my interview today. The process was respectful and professional. They asked about my skills, not my personal life. This is how it should be everywhere!" },
    { title: "Salary negotiation success!", desc: "Finally got the raise I deserved after using the tips from this community. Remember: know your worth and don't be afraid to ask. We deserve equal pay!" },
    { title: "Remote work opportunity in {industry}", desc: "Found this amazing remote position that offers great work-life balance. Perfect for those of us juggling multiple responsibilities. The future of work is flexible!" },
    { title: "Mentorship program changed my career", desc: "Six months into my mentorship and I've already been promoted. Having a senior woman guide me through the corporate maze has been invaluable." },
    { title: "Networking event in {city}", desc: "Attended the women in tech meetup last night. Made so many connections! If you're in {city}, definitely join the next one." },
    { title: "Breaking into {industry}", desc: "After months of preparation, I finally landed my dream job in {industry}. Don't give up, sisters! Your time will come." },
    { title: "Toxic workplace red flags", desc: "Sharing my experience so others can avoid similar situations. Trust your instincts - if something feels wrong, it probably is." },
  ],
  social: [
    { title: "Safe café recommendation in {city}", desc: "Found this wonderful café where women can work and meet safely. Great lighting, friendly staff, and always busy. Perfect for solo visits!" },
    { title: "Women's community event this weekend", desc: "Organizing a meetup for women in {city}. Let's support each other and build our network. DM me for details!" },
    { title: "Book club starting in {city}", desc: "Looking for women interested in joining a monthly book club. We'll read books by female authors and discuss over coffee." },
    { title: "Fitness group for women", desc: "Started a morning running group in {city}. Safety in numbers! We meet at 6 AM in the park. All fitness levels welcome." },
    { title: "Support group meeting", desc: "Weekly support group for women going through career transitions. No judgment, just support and practical advice." },
    { title: "Art exhibition by local women artists", desc: "Beautiful exhibition showcasing talented women from our community. Running until end of month. Highly recommend visiting!" },
  ],
  daily: [
    { title: "Safe route to work in {city}", desc: "Sharing my daily commute route. Well-lit streets, busy sidewalks, and several safe spots along the way. Stay safe, sisters!" },
    { title: "Best time to visit {location}", desc: "After months of observation, I've found the safest times to visit this area. Mornings are best, avoid after 9 PM." },
    { title: "Grocery store with great security", desc: "This store has excellent security and well-lit parking. Staff is always helpful and the area feels safe even at night." },
    { title: "Public transport safety tip", desc: "Always sit near the driver on buses and in well-populated train cars. Share your location with a friend when traveling alone." },
    { title: "Neighborhood watch update", desc: "Our community has started a women's safety patrol. We look out for each other. Interested in joining? Let me know!" },
    { title: "Safe parking spots in downtown {city}", desc: "Mapped out the safest parking areas downtown. Look for well-lit spots near security cameras. Sharing the list!" },
    { title: "Walking buddy system", desc: "Started a walking buddy system in our neighborhood. Never walk alone at night - we've got each other's backs!" },
    { title: "Emergency contacts in {city}", desc: "Compiled a list of emergency contacts and safe spaces in {city}. Save these numbers - you never know when you'll need them." },
  ],
  travel: [
    { title: "Solo travel to {city} - Safety review", desc: "Just returned from my solo trip. Here's my honest review of safety for women travelers. Overall positive experience with some tips!" },
    { title: "Women-friendly hotel in {city}", desc: "Stayed at this hotel and felt completely safe. Women-only floor option, 24/7 security, and helpful staff. Highly recommend!" },
    { title: "Airport safety tips for {city}", desc: "Navigating {city} airport as a solo female traveler. Here are my tips for staying safe from arrival to departure." },
    { title: "Best neighborhoods for women in {city}", desc: "Spent a month exploring {city}. These are the safest and most welcoming neighborhoods for women travelers." },
    { title: "Night out safety in {city}", desc: "Enjoyed the nightlife safely! Stick to these areas, use verified ride services, and always let someone know your plans." },
    { title: "Cultural tips for women visiting {country}", desc: "Important cultural considerations for women traveling to {country}. Respect local customs while staying safe." },
  ],
  financial: [
    { title: "Investment group for women", desc: "Started an investment club with other women. We're learning together and building wealth. Financial independence is freedom!" },
    { title: "Budgeting app recommendation", desc: "This app helped me save 30% more each month. Designed with women's financial goals in mind. Game changer!" },
    { title: "Negotiating freelance rates", desc: "Finally charging what I'm worth! Here's how I researched market rates and confidently presented my pricing." },
    { title: "Emergency fund tips", desc: "Building an emergency fund as a single woman. Here's my strategy for saving 6 months of expenses." },
    { title: "Side hustle success story", desc: "Turned my hobby into a profitable side business. Now earning extra income while doing what I love!" },
  ],
};

const POLL_TEMPLATES = [
  { title: "Best time for women's meetups?", options: ["Morning (8-11 AM)", "Afternoon (2-5 PM)", "Evening (6-8 PM)", "Weekends only"] },
  { title: "Most important workplace benefit?", options: ["Flexible hours", "Remote work", "Parental leave", "Mental health support", "Equal pay transparency"] },
  { title: "Preferred safety feature in Aurora App?", options: ["Panic button", "Route tracking", "Guardian system", "Safety map", "Check-ins"] },
  { title: "How do you commute to work?", options: ["Public transport", "Walking", "Driving", "Cycling", "Ride-sharing"] },
  { title: "What motivates you most?", options: ["Career growth", "Work-life balance", "Financial independence", "Making an impact", "Learning new skills"] },
  { title: "Best self-care practice?", options: ["Exercise", "Meditation", "Reading", "Socializing", "Creative hobbies"] },
  { title: "Biggest career challenge?", options: ["Work-life balance", "Gender bias", "Imposter syndrome", "Networking", "Skill gaps"] },
  { title: "Favorite way to connect with other women?", options: ["Online communities", "Local meetups", "Professional networks", "Fitness groups", "Book clubs"] },
];

const ROUTE_TAGS = [
  "well-lit", "busy-area", "safe-at-night", "security-cameras", "police-nearby",
  "shops-open", "residential", "main-road", "sidewalks", "bike-lanes",
  "public-transport", "emergency-phones", "safe-stops", "verified-safe",
  "morning-recommended", "evening-caution", "weekend-busy", "scenic",
];

const OPPORTUNITY_TEMPLATES = {
  job: [
    { title: "Senior Software Engineer", company: "Tech Startup", salary: "$120,000 - $160,000", desc: "Join our diverse engineering team. We prioritize work-life balance and have 40% women in leadership." },
    { title: "Marketing Manager", company: "Global Brand", salary: "$80,000 - $100,000", desc: "Lead our marketing initiatives. Flexible hours, remote-first, and strong mentorship program." },
    { title: "Data Analyst", company: "Finance Corp", salary: "$70,000 - $90,000", desc: "Analyze market trends and customer data. Great benefits and career growth opportunities." },
    { title: "Product Designer", company: "Design Agency", salary: "$90,000 - $120,000", desc: "Create beautiful user experiences. Collaborative team with focus on diversity and inclusion." },
    { title: "HR Business Partner", company: "Healthcare Company", salary: "$75,000 - $95,000", desc: "Shape our people strategy. We're committed to creating an inclusive workplace." },
  ],
  mentorship: [
    { title: "Tech Leadership Mentorship", desc: "1-on-1 mentorship with a VP of Engineering. Learn to navigate tech leadership as a woman." },
    { title: "Entrepreneurship Guidance", desc: "Get guidance from a successful female founder. From idea to funding to scaling." },
    { title: "Career Transition Support", desc: "Thinking of changing careers? Get support from someone who's done it successfully." },
    { title: "Executive Coaching", desc: "Prepare for C-suite roles with an experienced executive coach." },
    { title: "Public Speaking Coaching", desc: "Build confidence and skills for presentations and public speaking." },
  ],
  resource: [
    { title: "Salary Negotiation Guide", desc: "Comprehensive guide to negotiating your worth. Includes scripts and strategies." },
    { title: "Resume Templates for Women in Tech", desc: "ATS-friendly templates designed to highlight your achievements." },
    { title: "Interview Preparation Kit", desc: "Common questions, best answers, and confidence-building exercises." },
    { title: "Legal Rights at Work", desc: "Know your rights. Guide to workplace laws and how to protect yourself." },
  ],
  event: [
    { title: "Women in Tech Conference 2025", desc: "Annual conference featuring inspiring speakers, workshops, and networking." },
    { title: "Leadership Summit", desc: "Two-day summit focused on developing women leaders across industries." },
    { title: "Startup Weekend for Women", desc: "Build a startup in 54 hours. Mentors, resources, and prizes available." },
  ],
  funding: [
    { title: "Women Founders Grant", desc: "$50,000 grant for women-led startups. No equity required." },
    { title: "Tech Scholarship Fund", desc: "Full scholarship for women pursuing tech education and certifications." },
    { title: "Small Business Loan Program", desc: "Low-interest loans specifically for women-owned businesses." },
  ],
};

const CIRCLE_TEMPLATES = [
  { name: "Women in Tech", category: "tech" as const, desc: "Support network for women in technology. Share experiences, job opportunities, and advice." },
  { name: "Working Moms", category: "motherhood" as const, desc: "Balancing career and family. Tips, support, and understanding from those who get it." },
  { name: "Career Changers", category: "career" as const, desc: "Making a career pivot? Join us for support and practical advice." },
  { name: "Entrepreneurs Circle", category: "entrepreneurship" as const, desc: "Women building businesses. Share wins, challenges, and resources." },
  { name: "Mental Health Support", category: "wellness" as const, desc: "Safe space to discuss mental health. No judgment, just support." },
  { name: "Financial Freedom", category: "finance" as const, desc: "Building wealth and financial independence together." },
  { name: "Safety First", category: "safety" as const, desc: "Sharing safety tips, resources, and looking out for each other." },
  { name: "Healthy Living", category: "health" as const, desc: "Fitness, nutrition, and overall wellness discussions." },
  { name: "Relationship Support", category: "relationships" as const, desc: "Navigating relationships, setting boundaries, and self-love." },
  { name: "General Support", category: "general" as const, desc: "A place for everything else. All women welcome!" },
];

const SAFETY_RESOURCES = [
  { name: "National Domestic Violence Hotline", category: "hotline" as const, phone: "1-800-799-7233", country: "USA", desc: "24/7 confidential support for domestic violence survivors.", isGlobal: false },
  { name: "RAINN", category: "hotline" as const, phone: "1-800-656-4673", country: "USA", desc: "Nation's largest anti-sexual violence organization.", isGlobal: false },
  { name: "Women's Aid UK", category: "hotline" as const, phone: "0808 2000 247", country: "UK", desc: "Support for women and children experiencing domestic abuse.", isGlobal: false },
  { name: "UN Women", category: "community" as const, website: "https://www.unwomen.org", desc: "Global champion for gender equality.", isGlobal: true },
  { name: "Global Fund for Women", category: "financial" as const, website: "https://www.globalfundforwomen.org", desc: "Funding women-led organizations worldwide.", isGlobal: true },
  { name: "Women's Shelters Canada", category: "shelter" as const, phone: "1-800-363-9010", country: "Canada", desc: "Network of shelters across Canada.", isGlobal: false },
  { name: "Linha da Mulher", category: "hotline" as const, phone: "180", country: "Brazil", desc: "Central de Atendimento à Mulher.", isGlobal: false },
  { name: "Línea Púrpura", category: "hotline" as const, phone: "155", country: "Colombia", desc: "Línea de orientación a mujeres víctimas de violencia.", isGlobal: false },
  { name: "Women Helpline India", category: "hotline" as const, phone: "181", country: "India", desc: "24/7 helpline for women in distress.", isGlobal: false },
  { name: "Legal Aid Society", category: "legal" as const, website: "https://www.legal-aid.org", country: "USA", desc: "Free legal services for those who cannot afford representation.", isGlobal: false },
];

const COMMENT_TEMPLATES = [
  "This is so helpful, thank you for sharing! 💜",
  "I had a similar experience. Solidarity, sister!",
  "Great advice! I'll definitely try this.",
  "Thank you for being so open about this.",
  "This community is amazing. We lift each other up!",
  "Saving this for future reference. So valuable!",
  "You're inspiring! Keep sharing your journey.",
  "I needed to hear this today. Thank you! 🙏",
  "Absolutely agree! We need more of this.",
  "This should be shared more widely!",
  "Your courage to share this helps others. Thank you.",
  "I've been through something similar. You're not alone.",
  "Such important information. Bookmarking this!",
  "Love this community! Women supporting women 💪",
  "This is exactly what I was looking for!",
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me"];
  const num = randomInt(1, 999);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${num}@${randomElement(domains)}`;
}

function generateWorkosId(): string {
  return `user_seed_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateRouteCoordinates(startLat: number, startLng: number, distance: number): Array<{lat: number, lng: number, timestamp: number, elevation?: number}> {
  const coords = [];
  const numPoints = Math.max(20, Math.floor(distance / 50)); // One point every ~50 meters
  const baseTime = Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000; // Random day in last month
  
  let lat = startLat;
  let lng = startLng;
  
  for (let i = 0; i < numPoints; i++) {
    // Add small random movement (roughly 10-50 meters per point)
    lat += (Math.random() - 0.5) * 0.0005;
    lng += (Math.random() - 0.5) * 0.0005;
    
    coords.push({
      lat,
      lng,
      timestamp: baseTime + i * 30000, // 30 seconds between points
      elevation: randomInt(0, 100),
    });
  }
  
  return coords;
}

function fillTemplate(template: string, city: typeof CITIES[0], company?: string): string {
  return template
    .replace(/{city}/g, city.name)
    .replace(/{country}/g, city.country)
    .replace(/{location}/g, `${city.name}, ${city.country}`)
    .replace(/{company}/g, company || randomElement(COMPANIES))
    .replace(/{industry}/g, randomElement(INDUSTRIES));
}

// ============================================
// CLEANUP MUTATION
// ============================================

export const cleanAllData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting complete data cleanup...");
    
    // Delete in order to respect foreign key relationships
    const tables = [
      "votes", "verifications", "pollVotes", "comments", "reelComments", "reelCommentLikes",
      "reelLikes", "livestreamLikes", "livestreamViewers", "routeCompletions", "routeFlags",
      "unlocks", "transactions", "notifications", "emergencyContacts", "emergencyAlerts",
      "emergencyResponses", "directMessages", "messages", "savedPosts", "tips", "payouts",
      "subscriptions", "userReports", "moderationQueue", "analytics_events",
      "hydrationLogs", "emotionalCheckins", "meditationSessions", "cycleLogs",
      "safetyCheckins", "workplaceReports", "accompanimentSessions", "locationShares",
      "guardianNotifications", "auroraGuardians", "resourceVerifications", "resourceReports",
      "circleMembers", "circlePosts", "circles", "safetyResources",
      "corporateSafetyIndex", "urbanSafetyIndex",
      "reels", "livestreams", "routes", "opportunities", "posts", "users",
    ];
    
    let totalDeleted = 0;
    
    for (const tableName of tables) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
          totalDeleted++;
        }
        if (records.length > 0) {
          console.log(`Deleted ${records.length} records from ${tableName}`);
        }
      } catch (error) {
        console.log(`Skipping ${tableName}: ${error}`);
      }
    }
    
    console.log(`Total records deleted: ${totalDeleted}`);
    return { success: true, totalDeleted };
  },
});

// ============================================
// SEED USERS
// ============================================

export const seedUsers = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} users...`);
    const userIds: Id<"users">[] = [];
    
    for (let i = 0; i < count; i++) {
      const firstName = randomElement(FEMALE_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const city = randomElement(CITIES);
      
      const userId = await ctx.db.insert("users", {
        workosId: generateWorkosId(),
        email: generateEmail(firstName, lastName),
        name: `${firstName} ${lastName}`,
        credits: randomInt(25, 500),
        trustScore: randomInt(0, 800),
        industry: randomElement(INDUSTRIES),
        location: `${city.name}, ${city.country}`,
        onboardingCompleted: true,
        bio: `${randomElement(INDUSTRIES)} professional based in ${city.name}. Passionate about women's empowerment and community building.`,
        interests: [randomElement(INDUSTRIES), "Women Empowerment", "Safety", randomElement(["Fitness", "Reading", "Travel", "Art", "Music"])],
        isPremium: Math.random() > 0.85, // 15% premium users
        avatarConfig: {
          seed: `${firstName}${lastName}${i}`,
          backgroundColor: randomElement(BG_COLORS),
          hairStyle: randomElement(HAIR_STYLES),
          hairColor: randomElement(HAIR_COLORS),
          skinColor: randomElement(SKIN_COLORS),
          eyesStyle: randomElement(EYES_STYLES),
          mouthStyle: randomElement(MOUTH_STYLES),
          earrings: randomElement(EARRINGS),
          freckles: Math.random() > 0.7,
        },
      });
      
      userIds.push(userId);
      
      // Add signup bonus transaction
      await ctx.db.insert("transactions", {
        userId,
        amount: 25,
        type: "signup_bonus",
      });
    }
    
    console.log(`Created ${userIds.length} users`);
    return { success: true, userIds };
  },
});

// ============================================
// SEED POSTS
// ============================================

export const seedPosts = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} posts...`);
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      throw new Error("No users found. Run seedUsers first.");
    }
    
    const postIds: Id<"posts">[] = [];
    const dimensions: Array<"professional" | "social" | "daily" | "travel" | "financial"> = ["professional", "social", "daily", "travel", "financial"];
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const dimension = randomElement(dimensions);
      const city = randomElement(CITIES);
      const templates = POST_TEMPLATES[dimension];
      const template = randomElement(templates);
      const company = randomElement(COMPANIES);
      
      const title = fillTemplate(template.title, city, company);
      const description = fillTemplate(template.desc, city, company);
      
      const hasLocation = Math.random() > 0.3; // 70% have location
      const isAnonymous = Math.random() > 0.85; // 15% anonymous
      
      const postId = await ctx.db.insert("posts", {
        authorId: user._id,
        lifeDimension: dimension,
        title,
        description,
        rating: randomInt(3, 5),
        location: hasLocation ? {
          name: `${city.name}, ${city.country}`,
          coordinates: [city.lng + (Math.random() - 0.5) * 0.1, city.lat + (Math.random() - 0.5) * 0.1],
        } : undefined,
        verificationCount: randomInt(0, 20),
        isVerified: Math.random() > 0.7,
        isAnonymous,
        upvotes: randomInt(0, 150),
        downvotes: randomInt(0, 10),
        commentCount: randomInt(0, 30),
        postType: "standard",
        moderationStatus: "approved",
      });
      
      postIds.push(postId);
    }
    
    console.log(`Created ${postIds.length} posts`);
    return { success: true, count: postIds.length };
  },
});

// ============================================
// SEED POLLS
// ============================================

export const seedPolls = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} polls...`);
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) throw new Error("No users found");
    
    const pollIds: Id<"posts">[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const city = randomElement(CITIES);
      const pollTemplate = randomElement(POLL_TEMPLATES);
      
      const pollOptions = pollTemplate.options.map(text => ({
        text,
        votes: randomInt(5, 100),
      }));
      
      const postId = await ctx.db.insert("posts", {
        authorId: user._id,
        lifeDimension: randomElement(["professional", "social", "daily"] as const),
        title: pollTemplate.title,
        description: `Community poll from ${city.name}. Share your thoughts!`,
        rating: 5,
        location: {
          name: `${city.name}, ${city.country}`,
          coordinates: [city.lng, city.lat],
        },
        verificationCount: randomInt(0, 10),
        isVerified: false,
        isAnonymous: false,
        upvotes: randomInt(10, 80),
        downvotes: randomInt(0, 5),
        commentCount: randomInt(5, 25),
        postType: "poll",
        pollOptions,
        moderationStatus: "approved",
      });
      
      pollIds.push(postId);
    }
    
    console.log(`Created ${pollIds.length} polls`);
    return { success: true, count: pollIds.length };
  },
});

// ============================================
// SEED ROUTES
// ============================================

export const seedRoutes = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} routes...`);
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) throw new Error("No users found");
    
    const routeIds: Id<"routes">[] = [];
    const routeTypes: Array<"walking" | "running" | "cycling" | "commuting"> = ["walking", "running", "cycling", "commuting"];
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const city = randomElement(CITIES);
      const routeType = randomElement(routeTypes);
      
      // Generate realistic distances based on route type
      const distanceRanges: Record<"walking" | "running" | "cycling" | "commuting", number[]> = {
        walking: [500, 5000],
        running: [2000, 15000],
        cycling: [5000, 30000],
        commuting: [1000, 20000],
      };
      const [minDist, maxDist] = distanceRanges[routeType];
      const distance = randomInt(minDist, maxDist);
      
      // Calculate duration based on typical speeds
      const speeds: Record<"walking" | "running" | "cycling" | "commuting", number> = { walking: 5, running: 10, cycling: 20, commuting: 15 };
      const duration = Math.floor((distance / 1000 / speeds[routeType]) * 3600);
      
      const startLat = city.lat + (Math.random() - 0.5) * 0.05;
      const startLng = city.lng + (Math.random() - 0.5) * 0.05;
      const coordinates = generateRouteCoordinates(startLat, startLng, distance);
      const endCoord = coordinates[coordinates.length - 1];
      
      const sharingLevel = randomElement(["public", "public", "public", "anonymous", "private"] as const);
      const tags = [];
      for (let t = 0; t < randomInt(2, 5); t++) {
        tags.push(randomElement(ROUTE_TAGS));
      }
      
      const routeId = await ctx.db.insert("routes", {
        creatorId: user._id,
        title: `${routeType.charAt(0).toUpperCase() + routeType.slice(1)} in ${city.name}`,
        routeType,
        coordinates,
        distance,
        duration,
        elevationGain: randomInt(0, 200),
        startLocation: {
          lat: startLat,
          lng: startLng,
          name: `${city.name} - Start Point`,
        },
        endLocation: {
          lat: endCoord.lat,
          lng: endCoord.lng,
          name: `${city.name} - End Point`,
        },
        tags: [...new Set(tags)],
        rating: randomInt(3, 5),
        journalEntry: `Great ${routeType} route in ${city.name}! ${randomElement(["Well-lit streets", "Busy area", "Beautiful scenery", "Safe neighborhood"])}. Highly recommend for other women!`,
        isPrivate: sharingLevel === "private",
        isAnonymous: sharingLevel === "anonymous",
        sharingLevel,
        completionCount: randomInt(0, 50),
        totalRating: randomInt(10, 200),
        verificationCount: randomInt(0, 30),
        creditsEarned: sharingLevel !== "private" ? 15 : 0,
      });
      
      routeIds.push(routeId);
      
      // Create a post for public routes
      if (sharingLevel === "public" && Math.random() > 0.3) {
        await ctx.db.insert("posts", {
          authorId: user._id,
          lifeDimension: "daily",
          title: `Safe ${routeType} route in ${city.name}`,
          description: `Sharing my verified ${routeType} route! Distance: ${(distance/1000).toFixed(1)}km. ${randomElement(["Well-lit", "Busy area", "Safe at night", "Great for morning exercise"])}. Stay safe, sisters! 💜`,
          rating: randomInt(4, 5),
          location: {
            name: `${city.name}, ${city.country}`,
            coordinates: [startLng, startLat],
          },
          verificationCount: randomInt(0, 15),
          isVerified: Math.random() > 0.5,
          isAnonymous: false,
          routeId,
          upvotes: randomInt(5, 80),
          downvotes: randomInt(0, 3),
          commentCount: randomInt(2, 15),
          moderationStatus: "approved",
        });
      }
    }
    
    console.log(`Created ${routeIds.length} routes`);
    return { success: true, count: routeIds.length };
  },
});

// ============================================
// SEED OPPORTUNITIES
// ============================================

export const seedOpportunities = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} opportunities...`);
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) throw new Error("No users found");
    
    const oppIds: Id<"opportunities">[] = [];
    const categories: Array<"job" | "mentorship" | "resource" | "event" | "funding"> = ["job", "mentorship", "resource", "event", "funding"];
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const city = randomElement(CITIES);
      const category = randomElement(categories);
      const templates = OPPORTUNITY_TEMPLATES[category];
      const template = randomElement(templates) as { title: string; desc: string; salary?: string; company?: string };
      const company = randomElement(COMPANIES);
      
      const oppId = await ctx.db.insert("opportunities", {
        creatorId: user._id,
        title: template.title,
        description: template.desc,
        category,
        company: category === "job" ? company : undefined,
        location: `${city.name}, ${city.country}`,
        creditCost: randomInt(5, 50),
        salary: (template as any).salary,
        safetyRating: category === "job" ? randomInt(3, 5) : undefined,
        requirements: category === "job" ? [
          `${randomInt(2, 5)}+ years experience`,
          randomElement(["Bachelor's degree", "Master's preferred", "Relevant certification"]),
          randomElement(["Strong communication", "Team player", "Leadership skills"]),
        ] : undefined,
        isActive: true,
      });
      
      oppIds.push(oppId);
    }
    
    console.log(`Created ${oppIds.length} opportunities`);
    return { success: true, count: oppIds.length };
  },
});

// ============================================
// SEED CIRCLES
// ============================================

export const seedCircles = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating circles...");
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) throw new Error("No users found");
    
    const circleIds: Id<"circles">[] = [];
    
    for (const template of CIRCLE_TEMPLATES) {
      const creator = randomElement(users);
      const memberCount = randomInt(50, 500);
      
      const circleId = await ctx.db.insert("circles", {
        name: template.name,
        description: template.desc,
        category: template.category,
        creatorId: creator._id,
        isPrivate: false,
        memberCount,
        postCount: randomInt(20, 200),
        rules: [
          "Be respectful and supportive",
          "No harassment or discrimination",
          "Keep discussions on topic",
          "Protect member privacy",
        ],
        tags: [template.category, "women", "support", "community"],
        isActive: true,
      });
      
      circleIds.push(circleId);
      
      // Add creator as admin
      await ctx.db.insert("circleMembers", {
        circleId,
        userId: creator._id,
        role: "admin",
        joinedAt: Date.now() - randomInt(30, 180) * 24 * 60 * 60 * 1000,
      });
      
      // Add random members
      const memberUsers = users.filter(u => u._id !== creator._id).slice(0, Math.min(memberCount, 50));
      for (const member of memberUsers) {
        await ctx.db.insert("circleMembers", {
          circleId,
          userId: member._id,
          role: Math.random() > 0.95 ? "moderator" : "member",
          joinedAt: Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000,
        });
      }
      
      // Add some posts to each circle
      for (let p = 0; p < randomInt(5, 15); p++) {
        const author = randomElement(memberUsers.length > 0 ? memberUsers : [creator]);
        await ctx.db.insert("circlePosts", {
          circleId,
          authorId: author._id,
          content: `${randomElement(COMMENT_TEMPLATES)} This ${template.name} circle is amazing! So grateful for this community.`,
          isAnonymous: Math.random() > 0.8,
          likes: randomInt(5, 50),
          commentCount: randomInt(0, 20),
        });
      }
    }
    
    console.log(`Created ${circleIds.length} circles`);
    return { success: true, count: circleIds.length };
  },
});

// ============================================
// SEED SAFETY RESOURCES
// ============================================

export const seedSafetyResources = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating safety resources...");
    
    const resourceIds: Id<"safetyResources">[] = [];
    
    for (const resource of SAFETY_RESOURCES) {
      const resourceId = await ctx.db.insert("safetyResources", {
        name: resource.name,
        category: resource.category,
        description: resource.desc,
        phone: resource.phone,
        website: resource.website,
        country: resource.country,
        isGlobal: resource.isGlobal || false,
        services: ["Support", "Information", "Referrals"],
        hours: resource.category === "hotline" ? "24/7" : "Mon-Fri 9AM-5PM",
        languages: ["English", "Spanish"],
        isVerified: true,
        isActive: true,
        priority: randomInt(1, 5),
        verificationCount: randomInt(10, 100),
      });
      
      resourceIds.push(resourceId);
    }
    
    // Add more global resources
    const additionalResources = [
      { name: "Women's Crisis Center", category: "shelter" as const, country: "USA", city: "New York" },
      { name: "Safe Haven Network", category: "shelter" as const, country: "UK", city: "London" },
      { name: "Legal Aid for Women", category: "legal" as const, country: "Canada", city: "Toronto" },
      { name: "Women's Health Clinic", category: "medical" as const, country: "Australia", city: "Sydney" },
      { name: "Career Counseling Center", category: "counseling" as const, country: "Germany", city: "Berlin" },
      { name: "Financial Empowerment Program", category: "financial" as const, country: "France", city: "Paris" },
      { name: "Women in Tech Hub", category: "employment" as const, country: "USA", city: "San Francisco" },
      { name: "Education Access Initiative", category: "education" as const, country: "India", city: "Mumbai" },
      { name: "Community Support Network", category: "community" as const, country: "Brazil", city: "São Paulo" },
    ];
    
    for (const res of additionalResources) {
      const resourceId = await ctx.db.insert("safetyResources", {
        name: res.name,
        category: res.category,
        description: `${res.name} providing essential services for women in ${res.city}, ${res.country}.`,
        country: res.country,
        city: res.city,
        isGlobal: false,
        isVerified: true,
        isActive: true,
        priority: randomInt(1, 8),
        verificationCount: randomInt(5, 50),
      });
      resourceIds.push(resourceId);
    }
    
    console.log(`Created ${resourceIds.length} safety resources`);
    return { success: true, count: resourceIds.length };
  },
});

// ============================================
// SEED WORKPLACE REPORTS
// ============================================

export const seedWorkplaceReports = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} workplace reports...`);
    
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) throw new Error("No users found");
    
    const reportIds: Id<"workplaceReports">[] = [];
    const incidentTypes = ["harassment", "discrimination", "pay_inequality", "hostile_environment", "retaliation", "other"] as const;
    
    const reportTemplates = [
      { type: "harassment" as const, desc: "Experienced inappropriate comments from a supervisor. HR was notified but no action was taken." },
      { type: "discrimination" as const, desc: "Passed over for promotion despite better qualifications. The position went to a less experienced male colleague." },
      { type: "pay_inequality" as const, desc: "Discovered I'm being paid 20% less than male colleagues in the same role with similar experience." },
      { type: "hostile_environment" as const, desc: "Constant microaggressions and exclusion from important meetings. The culture is toxic for women." },
      { type: "retaliation" as const, desc: "After reporting an incident, I was moved to a less desirable project and excluded from team activities." },
      { type: "other" as const, desc: "Lack of support for working mothers. No flexibility despite company policy stating otherwise." },
    ];
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const city = randomElement(CITIES);
      const company = randomElement(COMPANIES);
      const template = randomElement(reportTemplates);
      
      const reportId = await ctx.db.insert("workplaceReports", {
        reporterId: user._id,
        companyName: company,
        incidentType: template.type,
        description: template.desc,
        date: new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isAnonymous: Math.random() > 0.3, // 70% anonymous
        isPublic: Math.random() > 0.4, // 60% public
        supportNeeded: randomInt(0, 1) === 1 ? ["legal", "counseling"] : undefined,
        status: randomElement(["submitted", "reviewed", "verified"] as const),
        verificationCount: randomInt(0, 15),
        location: {
          name: `${company} - ${city.name}`,
          coordinates: [city.lng + (Math.random() - 0.5) * 0.02, city.lat + (Math.random() - 0.5) * 0.02],
        },
      });
      
      reportIds.push(reportId);
    }
    
    console.log(`Created ${reportIds.length} workplace reports`);
    return { success: true, count: reportIds.length };
  },
});

// ============================================
// SEED COMMENTS & INTERACTIONS
// ============================================

export const seedComments = mutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    console.log(`Creating ${count} comments...`);
    
    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    
    if (users.length === 0 || posts.length === 0) {
      throw new Error("No users or posts found");
    }
    
    let created = 0;
    
    for (let i = 0; i < count; i++) {
      const user = randomElement(users);
      const post = randomElement(posts);
      
      await ctx.db.insert("comments", {
        postId: post._id,
        authorId: user._id,
        content: randomElement(COMMENT_TEMPLATES),
        upvotes: randomInt(0, 30),
        downvotes: randomInt(0, 3),
        isDeleted: false,
        depth: 0,
        replyCount: randomInt(0, 5),
        moderationStatus: "approved",
      });
      
      created++;
    }
    
    console.log(`Created ${created} comments`);
    return { success: true, count: created };
  },
});

export const seedVotesAndVerifications = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating votes and verifications...");
    
    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    
    if (users.length === 0 || posts.length === 0) {
      throw new Error("No users or posts found");
    }
    
    let votesCreated = 0;
    let verificationsCreated = 0;
    
    // Create votes for posts
    for (const post of posts.slice(0, 200)) { // Limit to avoid timeout
      const numVoters = randomInt(3, 15);
      const voters = users.sort(() => Math.random() - 0.5).slice(0, numVoters);
      
      for (const voter of voters) {
        if (voter._id !== post.authorId) {
          await ctx.db.insert("votes", {
            userId: voter._id,
            targetId: post._id,
            targetType: "post",
            voteType: Math.random() > 0.15 ? "upvote" : "downvote",
          });
          votesCreated++;
        }
      }
      
      // Add verifications
      if (Math.random() > 0.5) {
        const numVerifiers = randomInt(1, 5);
        const verifiers = users.sort(() => Math.random() - 0.5).slice(0, numVerifiers);
        
        for (const verifier of verifiers) {
          if (verifier._id !== post.authorId) {
            await ctx.db.insert("verifications", {
              postId: post._id,
              userId: verifier._id,
            });
            verificationsCreated++;
          }
        }
      }
    }
    
    console.log(`Created ${votesCreated} votes and ${verificationsCreated} verifications`);
    return { success: true, votes: votesCreated, verifications: verificationsCreated };
  },
});

// ============================================
// SEED B2B DATA (Corporate & Urban Safety Index)
// ============================================

export const seedB2BData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating B2B intelligence data...");
    
    // Corporate Safety Index
    const corporateIds: Id<"corporateSafetyIndex">[] = [];
    
    for (const company of COMPANIES.slice(0, 40)) {
      const overallScore = randomInt(45, 95);
      
      const corpId = await ctx.db.insert("corporateSafetyIndex", {
        companyName: company,
        industry: randomElement(INDUSTRIES),
        overallScore,
        harassmentScore: randomInt(40, 95),
        inclusionScore: randomInt(50, 98),
        workLifeBalanceScore: randomInt(45, 90),
        careerGrowthScore: randomInt(50, 95),
        compensationScore: randomInt(55, 92),
        totalReviews: randomInt(50, 500),
        averageRating: parseFloat((randomInt(30, 50) / 10).toFixed(1)),
        monthlyTrend: {
          overallChange: parseFloat((Math.random() * 10 - 3).toFixed(1)),
          reviewCountChange: randomInt(-5, 20),
          lastUpdated: Date.now(),
        },
        riskFactors: overallScore < 60 ? ["high turnover", "limited advancement", "pay gaps"] : [],
        positiveFactors: overallScore > 75 ? ["flexible hours", "supportive culture", "women in leadership"] : ["standard benefits"],
        dataQuality: {
          completeness: randomInt(70, 100),
          recency: randomInt(1, 30),
          trustScoreAvg: randomInt(300, 700),
        },
        lastAggregated: Date.now(),
      });
      
      corporateIds.push(corpId);
    }
    
    // Urban Safety Index - Create grid data for major cities
    const urbanIds: Id<"urbanSafetyIndex">[] = [];
    
    for (const city of CITIES.slice(0, 30)) {
      // Create multiple grid cells per city
      for (let g = 0; g < randomInt(3, 8); g++) {
        const gridLat = parseFloat((city.lat + (Math.random() - 0.5) * 0.1).toFixed(2));
        const gridLng = parseFloat((city.lng + (Math.random() - 0.5) * 0.1).toFixed(2));
        const overallScore = randomInt(50, 95);
        
        const urbanId = await ctx.db.insert("urbanSafetyIndex", {
          gridLat,
          gridLng,
          city: city.name,
          neighborhood: `${city.name} District ${g + 1}`,
          country: city.country,
          overallScore,
          dayScore: randomInt(65, 98),
          nightScore: randomInt(35, 85),
          safetyByHour: Array.from({ length: 24 }, (_, h) => 
            h >= 6 && h <= 20 ? randomInt(70, 95) : randomInt(40, 75)
          ),
          totalRoutes: randomInt(20, 200),
          averageRating: parseFloat((randomInt(35, 50) / 10).toFixed(1)),
          riskFactors: overallScore < 70 ? ["poor lighting", "isolated areas"] : [],
          safetyFeatures: overallScore > 75 ? ["well-lit", "busy area", "security cameras"] : ["main roads"],
          routeTypes: {
            walking: randomInt(30, 100),
            running: randomInt(10, 50),
            cycling: randomInt(5, 30),
            commuting: randomInt(20, 80),
          },
          dataQuality: {
            completeness: randomInt(60, 100),
            recency: randomInt(1, 14),
            trustScoreAvg: randomInt(350, 650),
          },
          lastAggregated: Date.now(),
        });
        
        urbanIds.push(urbanId);
      }
    }
    
    console.log(`Created ${corporateIds.length} corporate indexes and ${urbanIds.length} urban indexes`);
    return { success: true, corporate: corporateIds.length, urban: urbanIds.length };
  },
});

// ============================================
// SEED GUARDIAN CONNECTIONS
// ============================================

export const seedGuardians = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating guardian connections...");
    
    const users = await ctx.db.query("users").collect();
    if (users.length < 10) throw new Error("Need at least 10 users");
    
    let connectionsCreated = 0;
    
    // Create guardian connections for ~60% of users
    for (const user of users.slice(0, Math.floor(users.length * 0.6))) {
      const numGuardians = randomInt(1, 4);
      const potentialGuardians = users.filter(u => u._id !== user._id);
      const guardians = potentialGuardians.sort(() => Math.random() - 0.5).slice(0, numGuardians);
      
      for (const guardian of guardians) {
        await ctx.db.insert("auroraGuardians", {
          userId: user._id,
          guardianId: guardian._id,
          status: "accepted",
          requestedAt: Date.now() - randomInt(7, 90) * 24 * 60 * 60 * 1000,
          acceptedAt: Date.now() - randomInt(1, 7) * 24 * 60 * 60 * 1000,
          canSeeLocation: Math.random() > 0.3,
          canReceiveAlerts: true,
          canReceiveCheckins: Math.random() > 0.5,
        });
        connectionsCreated++;
      }
    }
    
    console.log(`Created ${connectionsCreated} guardian connections`);
    return { success: true, count: connectionsCreated };
  },
});

// ============================================
// SEED EMERGENCY CONTACTS
// ============================================

export const seedEmergencyContacts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Creating emergency contacts...");
    
    const users = await ctx.db.query("users").collect();
    let contactsCreated = 0;
    
    const relationships = ["Mother", "Sister", "Best Friend", "Partner", "Aunt", "Colleague", "Neighbor"];
    
    for (const user of users.slice(0, Math.floor(users.length * 0.7))) {
      const numContacts = randomInt(1, 3);
      
      for (let c = 0; c < numContacts; c++) {
        await ctx.db.insert("emergencyContacts", {
          userId: user._id,
          name: `${randomElement(FEMALE_NAMES)} ${randomElement(LAST_NAMES)}`,
          phoneNumber: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
          relationship: randomElement(relationships),
          priority: c + 1,
        });
        contactsCreated++;
      }
    }
    
    console.log(`Created ${contactsCreated} emergency contacts`);
    return { success: true, count: contactsCreated };
  },
});

// ============================================
// MASTER SEED FUNCTION
// ============================================

export const runFullSeed = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("=".repeat(50));
    console.log("AURORA APP - FULL SEED STARTING");
    console.log("=".repeat(50));
    
    // This function orchestrates the seeding process
    // Due to Convex mutation limits, we'll return instructions
    // for running individual seed functions
    
    return {
      success: true,
      message: "Run the following mutations in order from Convex Dashboard:",
      steps: [
        "1. seed:cleanAllData - Clean existing data",
        "2. seed:seedUsers { count: 150 } - Create 150 diverse users",
        "3. seed:seedPosts { count: 600 } - Create 600 standard posts",
        "4. seed:seedPolls { count: 50 } - Create 50 polls",
        "5. seed:seedRoutes { count: 200 } - Create 200 routes with GPS data",
        "6. seed:seedOpportunities { count: 100 } - Create 100 opportunities",
        "7. seed:seedCircles - Create support circles",
        "8. seed:seedSafetyResources - Create safety resources",
        "9. seed:seedWorkplaceReports { count: 80 } - Create workplace reports",
        "10. seed:seedComments { count: 500 } - Create comments",
        "11. seed:seedVotesAndVerifications - Create votes and verifications",
        "12. seed:seedB2BData - Create B2B intelligence data",
        "13. seed:seedGuardians - Create guardian connections",
        "14. seed:seedEmergencyContacts - Create emergency contacts",
      ],
      totalExpected: {
        users: 150,
        posts: "~700 (600 standard + 50 polls + route posts)",
        routes: 200,
        opportunities: 100,
        circles: 10,
        workplaceReports: 80,
        comments: 500,
        b2bRecords: "~200",
      },
    };
  },
});

// ============================================
// QUICK SEED (Smaller dataset for testing)
// ============================================

export const quickSeed = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Running quick seed...");
    
    // Create 20 users
    const userIds: Id<"users">[] = [];
    for (let i = 0; i < 20; i++) {
      const firstName = randomElement(FEMALE_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const city = randomElement(CITIES);
      
      const userId = await ctx.db.insert("users", {
        workosId: generateWorkosId(),
        email: generateEmail(firstName, lastName),
        name: `${firstName} ${lastName}`,
        credits: randomInt(25, 200),
        trustScore: randomInt(100, 500),
        industry: randomElement(INDUSTRIES),
        location: `${city.name}, ${city.country}`,
        onboardingCompleted: true,
        bio: `Professional in ${randomElement(INDUSTRIES)}. Based in ${city.name}.`,
        avatarConfig: {
          seed: `${firstName}${i}`,
          backgroundColor: randomElement(BG_COLORS),
          hairStyle: randomElement(HAIR_STYLES),
          hairColor: randomElement(HAIR_COLORS),
          skinColor: randomElement(SKIN_COLORS),
          eyesStyle: randomElement(EYES_STYLES),
          mouthStyle: randomElement(MOUTH_STYLES),
          earrings: randomElement(EARRINGS),
          freckles: Math.random() > 0.7,
        },
      });
      userIds.push(userId);
    }
    
    // Create 50 posts
    for (let i = 0; i < 50; i++) {
      const user = randomElement(userIds);
      const city = randomElement(CITIES);
      const dimension = randomElement(["professional", "social", "daily", "travel", "financial"] as const);
      const templates = POST_TEMPLATES[dimension];
      const template = randomElement(templates);
      
      await ctx.db.insert("posts", {
        authorId: user,
        lifeDimension: dimension,
        title: fillTemplate(template.title, city),
        description: fillTemplate(template.desc, city),
        rating: randomInt(3, 5),
        location: {
          name: `${city.name}, ${city.country}`,
          coordinates: [city.lng, city.lat],
        },
        verificationCount: randomInt(0, 10),
        isVerified: Math.random() > 0.7,
        isAnonymous: Math.random() > 0.85,
        upvotes: randomInt(5, 50),
        downvotes: randomInt(0, 5),
        commentCount: randomInt(0, 15),
        moderationStatus: "approved",
      });
    }
    
    console.log("Quick seed complete: 20 users, 50 posts");
    return { success: true, users: 20, posts: 50 };
  },
});


// ============================================
// COUNT DATA
// ============================================

export const countAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    const routes = await ctx.db.query("routes").collect();
    const opportunities = await ctx.db.query("opportunities").collect();
    const circles = await ctx.db.query("circles").collect();
    const comments = await ctx.db.query("comments").collect();
    const votes = await ctx.db.query("votes").collect();
    const verifications = await ctx.db.query("verifications").collect();
    const workplaceReports = await ctx.db.query("workplaceReports").collect();
    const safetyResources = await ctx.db.query("safetyResources").collect();
    const guardians = await ctx.db.query("auroraGuardians").collect();
    const emergencyContacts = await ctx.db.query("emergencyContacts").collect();
    const corporateIndex = await ctx.db.query("corporateSafetyIndex").collect();
    const urbanIndex = await ctx.db.query("urbanSafetyIndex").collect();
    
    const postsWithLocation = posts.filter(p => p.location).length;
    const routesPublic = routes.filter(r => r.sharingLevel === "public").length;
    const polls = posts.filter(p => p.postType === "poll").length;
    
    return {
      users: users.length,
      posts: posts.length,
      polls,
      postsWithLocation,
      routes: routes.length,
      routesPublic,
      opportunities: opportunities.length,
      circles: circles.length,
      comments: comments.length,
      votes: votes.length,
      verifications: verifications.length,
      workplaceReports: workplaceReports.length,
      safetyResources: safetyResources.length,
      guardians: guardians.length,
      emergencyContacts: emergencyContacts.length,
      b2b: {
        corporateIndex: corporateIndex.length,
        urbanIndex: urbanIndex.length,
      },
      total: users.length + posts.length + routes.length + opportunities.length + 
             circles.length + comments.length + votes.length + verifications.length +
             workplaceReports.length + safetyResources.length + guardians.length + 
             emergencyContacts.length + corporateIndex.length + urbanIndex.length,
    };
  },
});
