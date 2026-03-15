/**
 * Task 14.1 & 14.2: Seed Data Scripts
 * 
 * Creates realistic multilingual content for Aurora App:
 * - Posts in 6 languages (EN, ES, FR, PT, DE, AR)
 * - Safety routes from major cities worldwide
 * - Diverse user profiles with international names
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// MULTILINGUAL POSTS SEED DATA
// ============================================

const SEED_POSTS = [
  // English Posts
  {
    title: "Late night commute safety tips from NYC",
    description: "After 3 years of taking the subway after midnight, here are my best tips: Always stand near the conductor car, keep your phone charged, share your location with a friend. The MTA has improved lighting in many stations. Stay safe, sisters! 💜",
    lifeDimension: "daily" as const,
    language: "en",
    location: { name: "New York, USA", coordinates: [-74.006, 40.7128] },
    tags: ["safety", "commute", "nyc", "subway"],
  },
  {
    title: "How I negotiated a 30% raise as a woman in tech",
    description: "I was terrified to ask for more money, but I did my research on Glassdoor, practiced with friends, and came prepared with my achievements. The key was framing it as market adjustment, not personal need. You deserve fair pay! 💪",
    lifeDimension: "professional" as const,
    language: "en",
    location: { name: "San Francisco, USA", coordinates: [-122.4194, 37.7749] },
    tags: ["career", "salary", "negotiation", "tech"],
  },
  {
    title: "Found an amazing women-only coworking space",
    description: "Just discovered The Wing alternative in my city - it's called HerSpace and it's incredible. Safe environment, networking events, childcare options. Perfect for freelancers and remote workers. Highly recommend checking if there's one near you!",
    lifeDimension: "professional" as const,
    language: "en",
    location: { name: "London, UK", coordinates: [-0.1278, 51.5074] },
    tags: ["coworking", "networking", "remote-work"],
  },
  
  // Spanish Posts
  {
    title: "Rutas seguras para correr en Ciudad de México",
    description: "Después de probar muchos lugares, mis favoritos son: Bosque de Chapultepec (temprano en la mañana), Parque México en la Condesa, y la pista del Estadio Olímpico. Siempre voy con mi grupo de running de mujeres. ¡Únanse! 🏃‍♀️",
    lifeDimension: "daily" as const,
    language: "es",
    location: { name: "Ciudad de México, México", coordinates: [-99.1332, 19.4326] },
    tags: ["running", "seguridad", "cdmx", "deporte"],
  },
  {
    title: "Experiencia con acoso laboral y cómo lo denuncié",
    description: "Quiero compartir mi experiencia porque sé que muchas pasan por lo mismo. Documenté todo, busqué apoyo legal gratuito, y finalmente la empresa tomó acción. No están solas, hay recursos disponibles. Compartiré los contactos en comentarios.",
    lifeDimension: "professional" as const,
    language: "es",
    location: { name: "Buenos Aires, Argentina", coordinates: [-58.3816, -34.6037] },
    tags: ["acoso", "trabajo", "derechos", "denuncia"],
  },
  {
    title: "Grupo de apoyo para madres emprendedoras",
    description: "Creamos un círculo de madres que estamos emprendiendo. Nos reunimos cada sábado para compartir experiencias, cuidar a los niños juntas mientras trabajamos, y apoyarnos mutuamente. Si están en Madrid, ¡únanse! 💜",
    lifeDimension: "social" as const,
    language: "es",
    location: { name: "Madrid, España", coordinates: [-3.7038, 40.4168] },
    tags: ["emprendimiento", "madres", "comunidad", "apoyo"],
  },

  // French Posts
  {
    title: "Conseils de sécurité pour le métro parisien la nuit",
    description: "Après 5 ans à Paris, voici mes conseils: évitez les wagons vides, restez près des sorties, utilisez l'app Citymapper pour les trajets les plus sûrs. La ligne 14 est la plus moderne et sécurisée. Prenez soin de vous! 💜",
    lifeDimension: "daily" as const,
    language: "fr",
    location: { name: "Paris, France", coordinates: [2.3522, 48.8566] },
    tags: ["sécurité", "métro", "paris", "transport"],
  },
  {
    title: "Comment j'ai créé mon entreprise à 25 ans",
    description: "Je partage mon parcours d'entrepreneure. Les défis: financement, crédibilité, équilibre vie pro/perso. Les victoires: liberté, impact, communauté. Si vous avez des questions sur la création d'entreprise en France, je suis là pour aider!",
    lifeDimension: "professional" as const,
    language: "fr",
    location: { name: "Lyon, France", coordinates: [4.8357, 45.764] },
    tags: ["entrepreneuriat", "startup", "femmes", "business"],
  },

  // Portuguese Posts
  {
    title: "Melhores bairros para mulheres em São Paulo",
    description: "Depois de morar em vários bairros, recomendo: Vila Madalena (vida noturna segura), Pinheiros (boa iluminação), Moema (tranquilo). Evitem andar sozinhas tarde em certas áreas. Compartilhem suas experiências! 🇧🇷",
    lifeDimension: "daily" as const,
    language: "pt",
    location: { name: "São Paulo, Brasil", coordinates: [-46.6333, -23.5505] },
    tags: ["segurança", "bairros", "sp", "moradia"],
  },
  {
    title: "Rede de mulheres na tecnologia - Brasil",
    description: "Criamos uma comunidade para mulheres em tech no Brasil. Mentoria, vagas de emprego, eventos online e presenciais. Já somos mais de 500 membras! Se você trabalha com tecnologia, junte-se a nós. Link nos comentários 💻",
    lifeDimension: "professional" as const,
    language: "pt",
    location: { name: "Rio de Janeiro, Brasil", coordinates: [-43.1729, -22.9068] },
    tags: ["tecnologia", "mulheres", "comunidade", "carreira"],
  },

  // German Posts
  {
    title: "Sichere Jogging-Routen in Berlin",
    description: "Meine Lieblingsstrecken: Tiergarten (morgens), Tempelhofer Feld (gut beleuchtet), Mauerpark (am Wochenende). Ich laufe immer mit meiner Laufgruppe - wir treffen uns jeden Mittwoch um 18 Uhr. Neue Mitglieder willkommen! 🏃‍♀️",
    lifeDimension: "daily" as const,
    language: "de",
    location: { name: "Berlin, Deutschland", coordinates: [13.405, 52.52] },
    tags: ["joggen", "sicherheit", "berlin", "sport"],
  },
  {
    title: "Gehaltsverhandlung als Frau - meine Erfahrung",
    description: "Nach 10 Jahren im Beruf habe ich endlich gelernt, meinen Wert zu kennen. Tipps: Recherchiert Gehälter, dokumentiert eure Erfolge, übt das Gespräch. Ihr verdient faire Bezahlung! Teilt eure Erfahrungen in den Kommentaren.",
    lifeDimension: "professional" as const,
    language: "de",
    location: { name: "München, Deutschland", coordinates: [11.582, 48.1351] },
    tags: ["gehalt", "karriere", "verhandlung", "frauen"],
  },

  // Arabic Posts
  {
    title: "نصائح للسلامة في القاهرة",
    description: "بعد سنوات من العيش في القاهرة، أشارك نصائحي: استخدمي تطبيقات النقل الموثوقة، شاركي موقعك مع صديقة، تجنبي المناطق المزدحمة وحدك ليلاً. السلامة أولاً يا بنات! 💜",
    lifeDimension: "daily" as const,
    language: "ar",
    location: { name: "القاهرة، مصر", coordinates: [31.2357, 30.0444] },
    tags: ["سلامة", "القاهرة", "نصائح", "مواصلات"],
  },
  {
    title: "تجربتي في ريادة الأعمال كامرأة عربية",
    description: "بدأت مشروعي الخاص قبل 3 سنوات. التحديات كانت كثيرة لكن الدعم من مجتمع النساء كان مذهلاً. إذا كنتِ تفكرين في بدء مشروعك، أنا هنا للمساعدة والإرشاد. معاً نستطيع! 💪",
    lifeDimension: "professional" as const,
    language: "ar",
    location: { name: "دبي، الإمارات", coordinates: [55.2708, 25.2048] },
    tags: ["ريادة", "أعمال", "نساء", "دعم"],
  },
];

// ============================================
// SAFETY ROUTES SEED DATA
// ============================================

// Helper to create route coordinates in correct format
const makeCoords = (points: [number, number][]) => 
  points.map(([lng, lat], i) => ({ lat, lng, timestamp: Date.now() + i * 1000 }));

const SEED_ROUTES = [
  // Paris Routes
  {
    title: "Safe Evening Walk - Marais to Bastille",
    routeType: "walking" as const,
    startLocation: { name: "Place des Vosges, Paris", lat: 48.8555, lng: 2.3654 },
    endLocation: { name: "Place de la Bastille, Paris", lat: 48.8533, lng: 2.3692 },
    distance: 1200,
    duration: 900, // 15 min in seconds
    rating: 4.8,
    tags: ["well-lit", "busy-area", "evening-safe"],
    journalEntry: "Beautiful walk through the historic Marais district. Well-lit streets, many cafes open late, always people around. Verified safe by 50+ Aurora App members.",
    coordinates: makeCoords([[2.3654, 48.8555], [2.3670, 48.8545], [2.3692, 48.8533]]),
  },
  {
    title: "Morning Jog - Bois de Boulogne Safe Loop",
    routeType: "running" as const,
    startLocation: { name: "Porte Dauphine, Paris", lat: 48.8714, lng: 2.2769 },
    endLocation: { name: "Porte Dauphine, Paris", lat: 48.8714, lng: 2.2769 },
    distance: 5000,
    duration: 1800, // 30 min
    rating: 4.5,
    tags: ["morning-only", "running-group", "nature"],
    journalEntry: "Safe morning running route. Best before 9am when many joggers are present. Avoid after dark. Women's running group meets here Saturdays 7am.",
    coordinates: makeCoords([[2.2769, 48.8714], [2.2650, 48.8680], [2.2600, 48.8720], [2.2769, 48.8714]]),
  },

  // Tokyo Routes
  {
    title: "Safe Night Walk - Shibuya to Harajuku",
    routeType: "walking" as const,
    startLocation: { name: "Shibuya Station, Tokyo", lat: 35.6580, lng: 139.7016 },
    endLocation: { name: "Harajuku Station, Tokyo", lat: 35.6702, lng: 139.7027 },
    distance: 1800,
    duration: 1320, // 22 min
    rating: 4.9,
    tags: ["24h-safe", "well-lit", "police-boxes"],
    journalEntry: "One of the safest night walks in Tokyo. Extremely well-lit, koban (police boxes) every few blocks, busy until late. Perfect for solo women travelers.",
    coordinates: makeCoords([[139.7016, 35.6580], [139.7020, 35.6640], [139.7027, 35.6702]]),
  },
  {
    title: "Peaceful Morning - Yoyogi Park Loop",
    routeType: "running" as const,
    startLocation: { name: "Yoyogi Park, Tokyo", lat: 35.6714, lng: 139.6949 },
    endLocation: { name: "Yoyogi Park, Tokyo", lat: 35.6714, lng: 139.6949 },
    distance: 3500,
    duration: 1500, // 25 min
    rating: 4.7,
    tags: ["morning", "nature", "family-friendly"],
    journalEntry: "Beautiful park loop, very safe at all hours. Popular with local women joggers. Clean facilities, water fountains available.",
    coordinates: makeCoords([[139.6949, 35.6714], [139.6900, 35.6750], [139.6980, 35.6780], [139.6949, 35.6714]]),
  },

  // São Paulo Routes
  {
    title: "Safe Walk - Paulista Avenue",
    routeType: "walking" as const,
    startLocation: { name: "MASP, São Paulo", lat: -23.5614, lng: -46.6558 },
    endLocation: { name: "Consolação Metro, São Paulo", lat: -23.5576, lng: -46.6603 },
    distance: 800,
    duration: 600, // 10 min
    rating: 4.3,
    tags: ["daytime", "busy", "cultural"],
    journalEntry: "Avenida Paulista is safest during day and early evening. Many security guards, cameras, and police presence. Sundays the avenue is closed to cars - perfect for walking!",
    coordinates: makeCoords([[-46.6558, -23.5614], [-46.6580, -23.5595], [-46.6603, -23.5576]]),
  },
  {
    title: "Ibirapuera Park Morning Run",
    routeType: "running" as const,
    startLocation: { name: "Ibirapuera Park Gate 3, SP", lat: -23.5874, lng: -46.6576 },
    endLocation: { name: "Ibirapuera Park Gate 3, SP", lat: -23.5874, lng: -46.6576 },
    distance: 4200,
    duration: 1680, // 28 min
    rating: 4.6,
    tags: ["morning", "guards", "popular"],
    journalEntry: "Best running spot in São Paulo. Security guards patrol, well-maintained paths, water fountains. Women's running group meets 6am weekdays.",
    coordinates: makeCoords([[-46.6576, -23.5874], [-46.6520, -23.5850], [-46.6480, -23.5900], [-46.6576, -23.5874]]),
  },

  // Cairo Routes
  {
    title: "Safe Walk - Zamalek Island",
    routeType: "walking" as const,
    startLocation: { name: "Gezira Club, Cairo", lat: 30.0561, lng: 31.2243 },
    endLocation: { name: "Cairo Opera House", lat: 30.0428, lng: 31.2244 },
    distance: 2000,
    duration: 1500, // 25 min
    rating: 4.4,
    tags: ["upscale", "embassies", "safe-area"],
    journalEntry: "Zamalek is one of Cairo's safest neighborhoods. Tree-lined streets, embassy area, many expats. Safe for evening walks. Recommended by local women.",
    coordinates: makeCoords([[31.2243, 30.0561], [31.2240, 30.0500], [31.2244, 30.0428]]),
  },

  // Berlin Routes
  {
    title: "Evening Walk - Prenzlauer Berg",
    routeType: "walking" as const,
    startLocation: { name: "Kollwitzplatz, Berlin", lat: 52.5347, lng: 13.4183 },
    endLocation: { name: "Mauerpark, Berlin", lat: 52.5432, lng: 13.4024 },
    distance: 1500,
    duration: 1080, // 18 min
    rating: 4.6,
    tags: ["family-area", "cafes", "evening-safe"],
    journalEntry: "Very safe family neighborhood. Many cafes, restaurants, always people around. Popular with young families and women. Safe until late.",
    coordinates: makeCoords([[13.4183, 52.5347], [13.4100, 52.5390], [13.4024, 52.5432]]),
  },
  {
    title: "Tiergarten Morning Jog",
    routeType: "running" as const,
    startLocation: { name: "Brandenburg Gate, Berlin", lat: 52.5163, lng: 13.3777 },
    endLocation: { name: "Victory Column, Berlin", lat: 52.5145, lng: 13.3501 },
    distance: 2800,
    duration: 1200, // 20 min
    rating: 4.5,
    tags: ["morning", "nature", "central"],
    journalEntry: "Beautiful run through Berlin's central park. Best in morning when many joggers are out. Well-maintained paths, emergency phones along route.",
    coordinates: makeCoords([[13.3777, 52.5163], [13.3650, 52.5150], [13.3501, 52.5145]]),
  },

  // Mexico City Routes
  {
    title: "Safe Walk - Condesa Neighborhood",
    routeType: "walking" as const,
    startLocation: { name: "Parque México, CDMX", lat: 19.4117, lng: -99.1707 },
    endLocation: { name: "Parque España, CDMX", lat: 19.4178, lng: -99.1736 },
    distance: 1000,
    duration: 720, // 12 min
    rating: 4.5,
    tags: ["trendy", "cafes", "dog-friendly"],
    journalEntry: "La Condesa is one of CDMX's safest neighborhoods. Beautiful art deco buildings, many cafes, always people walking dogs. Safe day and evening.",
    coordinates: makeCoords([[-99.1707, 19.4117], [-99.1720, 19.4150], [-99.1736, 19.4178]]),
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

/**
 * Seed posts in multiple languages
 * Run with: npx convex run seedData:seedPosts
 */
export const seedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Get a sample user to be the author (or create a seed user)
    let seedUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "seed@aurora-app.com"))
      .first();

    if (!seedUser) {
      // Create seed user
      const seedUserId = await ctx.db.insert("users", {
        workosId: "seed-aurora-community",
        name: "Aurora Community",
        email: "seed@aurora-app.com",
        profileImage: "/Au_Logo_1.png",
        bio: "Official Aurora App community account",
        location: "Global",
        interests: ["safety", "career", "community"],
        onboardingCompleted: true,
        credits: 1000,
        trustScore: 500,
        isPremium: false,
      });
      seedUser = await ctx.db.get(seedUserId);
    }

    if (!seedUser) throw new Error("Failed to create seed user");

    let created = 0;
    for (const post of SEED_POSTS) {
      // Check if similar post exists
      const existing = await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("title"), post.title))
        .first();

      if (!existing) {
        await ctx.db.insert("posts", {
          authorId: seedUser._id,
          title: post.title,
          description: post.description,
          lifeDimension: post.lifeDimension,
          location: post.location,
          rating: 5,
          isVerified: true,
          isAnonymous: false,
          verificationCount: Math.floor(Math.random() * 20) + 5,
          upvotes: Math.floor(Math.random() * 50) + 10,
          commentCount: Math.floor(Math.random() * 15) + 2,
          postType: "standard",
        });
        created++;
      }
    }

    return { success: true, created, total: SEED_POSTS.length };
  },
});

/**
 * Seed safety routes from major cities
 * Run with: npx convex run seedData:seedRoutes
 */
export const seedRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    // Get seed user
    let seedUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "seed@aurora-app.com"))
      .first();

    if (!seedUser) {
      const seedUserId = await ctx.db.insert("users", {
        workosId: "seed-aurora-community",
        name: "Aurora Community",
        email: "seed@aurora-app.com",
        profileImage: "/Au_Logo_1.png",
        bio: "Official Aurora App community account",
        location: "Global",
        interests: ["safety", "routes", "community"],
        onboardingCompleted: true,
        credits: 1000,
        trustScore: 500,
        isPremium: false,
      });
      seedUser = await ctx.db.get(seedUserId);
    }

    if (!seedUser) throw new Error("Failed to create seed user");

    let created = 0;
    for (const route of SEED_ROUTES) {
      // Check if similar route exists
      const existing = await ctx.db
        .query("routes")
        .filter((q) => q.eq(q.field("title"), route.title))
        .first();

      if (!existing) {
        await ctx.db.insert("routes", {
          creatorId: seedUser._id,
          title: route.title,
          routeType: route.routeType,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          coordinates: route.coordinates,
          distance: route.distance,
          duration: route.duration,
          elevationGain: 0,
          rating: route.rating,
          tags: route.tags,
          journalEntry: route.journalEntry,
          sharingLevel: "public",
          isPrivate: false,
          isAnonymous: false,
          completionCount: Math.floor(Math.random() * 30) + 5,
          totalRating: route.rating * (Math.floor(Math.random() * 10) + 5),
          verificationCount: Math.floor(Math.random() * 15) + 3,
          creditsEarned: 15,
        });
        created++;
      }
    }

    return { success: true, created, total: SEED_ROUTES.length };
  },
});

// ============================================
// SAFETY MAP SEED POSTS (English, ~30 posts)
// Diverse ratings (1-5), various public places worldwide
// ============================================

const SEED_SAFETY_MAP_POSTS = [
  // === NORTH AMERICA ===
  {
    title: "Central Park at dusk — stay on main paths",
    description: "Central Park is beautiful but can feel isolated on smaller trails after sunset. Stick to the main loop and well-lit areas near the Bethesda Fountain. Plenty of joggers and dog walkers until about 8pm. Avoid the Ramble alone at night.",
    lifeDimension: "daily" as const,
    rating: 3,
    location: { name: "Central Park, New York, USA", coordinates: [-73.9654, 40.7829] },
  },
  {
    title: "Times Square — safe but overwhelming at night",
    description: "Extremely crowded and well-lit 24/7, which makes it physically safe. However, watch out for pickpockets and aggressive street vendors. The NYPD has a strong presence. Fine for solo women but stay alert to your belongings.",
    lifeDimension: "travel" as const,
    rating: 4,
    location: { name: "Times Square, New York, USA", coordinates: [-73.9855, 40.7580] },
  },
  {
    title: "Hollywood Blvd after dark — not as glamorous as it seems",
    description: "Walk of Fame area gets sketchy after 10pm. Lots of people trying to sell things or scam tourists. Side streets are poorly lit. Stick to the main boulevard and travel in groups. Uber/Lyft pickup is easy though.",
    lifeDimension: "travel" as const,
    rating: 2,
    location: { name: "Hollywood Blvd, Los Angeles, USA", coordinates: [-118.3287, 34.1016] },
  },
  {
    title: "The 606 Trail in Chicago — great daytime, avoid late hours",
    description: "Fantastic elevated trail for running and biking during the day. Well-maintained with good visibility. After dark, some sections near Western Ave can feel deserted. Best enjoyed before sunset. Water fountains and emergency phones available.",
    lifeDimension: "daily" as const,
    rating: 4,
    location: { name: "The 606 Trail, Chicago, USA", coordinates: [-87.6876, 41.9122] },
  },
  {
    title: "Downtown Portland transit — MAX light rail late night",
    description: "The MAX runs late but some stops downtown feel unsafe after midnight. Pioneer Courthouse Square station has good lighting but attracts loiterers. TriMet security patrols are infrequent. Use the bus instead if traveling alone late.",
    lifeDimension: "daily" as const,
    rating: 2,
    location: { name: "Pioneer Courthouse Square, Portland, USA", coordinates: [-122.6795, 45.5189] },
  },
  {
    title: "Toronto PATH underground — safe and warm year-round",
    description: "The PATH is a network of underground walkways connecting transit, malls, and offices. Well-lit, security cameras everywhere, lots of foot traffic during business hours. Quieter on weekends but still feels safe. Great option in winter.",
    lifeDimension: "daily" as const,
    rating: 5,
    location: { name: "PATH Underground, Toronto, Canada", coordinates: [-79.3832, 43.6510] },
  },

  // === EUROPE ===
  {
    title: "Le Marais neighborhood — one of the safest in Paris",
    description: "Wonderful for solo exploring day or night. Cobblestone streets lined with cafes, bakeries, and boutiques. Very LGBTQ+-friendly area. Well-patrolled and bustling even late. One of the few Paris neighborhoods where I feel totally at ease after dark.",
    lifeDimension: "travel" as const,
    rating: 5,
    location: { name: "Le Marais, Paris, France", coordinates: [2.3596, 48.8606] },
  },
  {
    title: "Gare du Nord area — be cautious around the station",
    description: "The station itself is fine but the surrounding blocks, especially on the north side, can feel unsafe. Aggressive panhandlers and pickpockets target solo travelers. Keep your bags close and walk with purpose. Fine during rush hour.",
    lifeDimension: "travel" as const,
    rating: 2,
    location: { name: "Gare du Nord, Paris, France", coordinates: [2.3553, 48.8809] },
  },
  {
    title: "Retiro Park in Madrid — lovely and safe",
    description: "Beautiful park with wide paths, fountains, and the Crystal Palace. Always busy with families, joggers, and tourists. Park police patrol regularly. Even the quieter southern sections feel safe during daylight. Closes at midnight.",
    lifeDimension: "daily" as const,
    rating: 5,
    location: { name: "Retiro Park, Madrid, Spain", coordinates: [-3.6823, 40.4153] },
  },
  {
    title: "Trastevere at night — charming but watch side streets",
    description: "Main streets of Trastevere are lively with restaurants and bars until 2am. The atmosphere is fantastic. However, the narrow side alleys can be very dark and quiet. A few reports of bag snatching on Vespas. Stay on the busy streets.",
    lifeDimension: "travel" as const,
    rating: 3,
    location: { name: "Trastevere, Rome, Italy", coordinates: [12.4700, 41.8893] },
  },
  {
    title: "Alexanderplatz at night — proceed with caution",
    description: "Major transit hub that gets rough after dark. Groups of intoxicated people, occasional confrontations. The area around the TV tower is better lit but the side streets toward Volkspark can be sketchy. Use the U-Bahn, do not linger.",
    lifeDimension: "daily" as const,
    rating: 2,
    location: { name: "Alexanderplatz, Berlin, Germany", coordinates: [13.4132, 52.5219] },
  },
  {
    title: "Vondelpark Amsterdam — safe jogging spot",
    description: "One of the best parks in Europe for a morning run. Wide paths, good lighting, always other runners and cyclists. The park is well-maintained and patrolled. Even early morning (6am) feels safe. Avoid sleeping in the park overnight obviously.",
    lifeDimension: "daily" as const,
    rating: 5,
    location: { name: "Vondelpark, Amsterdam, Netherlands", coordinates: [4.8698, 52.3579] },
  },
  {
    title: "Soho London — vibrant and safe for nightlife",
    description: "Great area for a night out with friends or even solo. Tons of bars, restaurants, and theatres. Well-lit, always crowded, strong police presence. The LGBTQ+ venues on Old Compton Street are especially welcoming. Black cabs readily available.",
    lifeDimension: "social" as const,
    rating: 5,
    location: { name: "Soho, London, UK", coordinates: [-0.1340, 51.5137] },
  },

  // === ASIA ===
  {
    title: "Shibuya Crossing area — incredibly safe even at 3am",
    description: "Tokyo in general is one of the safest cities in the world for women. Shibuya at night is bustling with people, convenience stores are open 24/7, and the police koban is right at the crossing. I have walked alone here at all hours without issue.",
    lifeDimension: "travel" as const,
    rating: 5,
    location: { name: "Shibuya Crossing, Tokyo, Japan", coordinates: [139.7016, 35.6595] },
  },
  {
    title: "Khao San Road Bangkok — fun but stay alert",
    description: "Famous backpacker street that is extremely lively at night. Cheap food, music, and people from everywhere. However, drink spiking has been reported. Never leave your drink unattended. Tuk-tuk scams are common. Stick with trusted people after midnight.",
    lifeDimension: "travel" as const,
    rating: 3,
    location: { name: "Khao San Road, Bangkok, Thailand", coordinates: [100.4979, 13.7589] },
  },
  {
    title: "Marina Bay area Singapore — pristine and extremely safe",
    description: "Singapore is one of the safest countries for women travelers. Marina Bay is immaculate, well-lit, and patrolled. Gardens by the Bay, the Merlion park, and the Esplanade are all great for evening walks. Public transit runs efficiently until midnight.",
    lifeDimension: "travel" as const,
    rating: 5,
    location: { name: "Marina Bay, Singapore", coordinates: [103.8586, 1.2847] },
  },
  {
    title: "Hauz Khas Village Delhi — trendy but mixed safety",
    description: "Popular area with cafes, galleries, and nightlife. During the day it is great for exploring the ruins and deer park. At night, the bars attract a rowdy crowd and the surrounding streets are very poorly lit. Always take a cab home, never walk.",
    lifeDimension: "social" as const,
    rating: 3,
    location: { name: "Hauz Khas Village, New Delhi, India", coordinates: [77.1945, 28.5494] },
  },
  {
    title: "Myeongdong shopping district Seoul — safe and fun",
    description: "Bustling shopping area that is well-lit and always packed with people. Street food vendors, K-beauty shops, and department stores. Very safe for solo women even at night. Metro station is nearby and efficient. Police booths on every corner.",
    lifeDimension: "travel" as const,
    rating: 5,
    location: { name: "Myeongdong, Seoul, South Korea", coordinates: [126.9857, 37.5636] },
  },

  // === SOUTH AMERICA ===
  {
    title: "Copacabana Beach boardwalk — safe during the day",
    description: "The boardwalk (calcadao) is fantastic during daylight with joggers, cyclists, and vendors. After dark, the beach itself becomes risky. Do not bring valuables to the sand. The street side with hotels and restaurants stays busy and safer. Use Uber at night.",
    lifeDimension: "travel" as const,
    rating: 3,
    location: { name: "Copacabana Beach, Rio de Janeiro, Brazil", coordinates: [-43.1789, -22.9711] },
  },
  {
    title: "La Boca neighborhood Buenos Aires — tourist area only",
    description: "The colorful Caminito street is safe during the day with tourist police everywhere. But do NOT wander beyond the designated tourist blocks. Surrounding streets can be very dangerous. Visit during the day, take a taxi in and out, do not walk.",
    lifeDimension: "travel" as const,
    rating: 2,
    location: { name: "La Boca, Buenos Aires, Argentina", coordinates: [-58.3634, -34.6345] },
  },
  {
    title: "Parque Kennedy Miraflores Lima — safe green space",
    description: "Beautiful park in the heart of Miraflores, Lima's safest neighborhood. Famous for its resident cats! Well-lit, surrounded by restaurants and shops. Safe for evening walks. Serenazgo (local security) patrols frequently. Free wifi too.",
    lifeDimension: "daily" as const,
    rating: 4,
    location: { name: "Parque Kennedy, Miraflores, Lima, Peru", coordinates: [-77.0299, -12.1197] },
  },

  // === AFRICA ===
  {
    title: "V&A Waterfront Cape Town — safe tourist hub",
    description: "The Waterfront is well-secured with private security, CCTV, and controlled access points. Shopping, restaurants, the aquarium — all great. Safe even after dark within the complex. However, walking to/from surrounding areas at night is not recommended. Use Uber.",
    lifeDimension: "travel" as const,
    rating: 4,
    location: { name: "V&A Waterfront, Cape Town, South Africa", coordinates: [18.4210, -33.9036] },
  },
  {
    title: "Medina of Marrakech — overwhelming but manageable",
    description: "The old medina is a maze of narrow alleys. During the day, it is bustling and generally safe, though expect verbal harassment from some vendors. At night, stick to main thoroughfares near Jemaa el-Fna. Hiring a local guide for the first visit is strongly recommended.",
    lifeDimension: "travel" as const,
    rating: 2,
    location: { name: "Medina, Marrakech, Morocco", coordinates: [-7.9891, 31.6295] },
  },
  {
    title: "Zanzibar Stone Town — charming but narrow streets",
    description: "Beautiful UNESCO heritage site with winding alleys. Safe during the day with many tourists and guides. At night, the lighting is minimal and navigation is confusing. Always have your accommodation arrange a guide or car for late evenings.",
    lifeDimension: "travel" as const,
    rating: 3,
    location: { name: "Stone Town, Zanzibar, Tanzania", coordinates: [39.1880, -6.1622] },
  },

  // === OCEANIA ===
  {
    title: "Bondi to Coogee coastal walk — stunning and safe",
    description: "One of Sydney's most popular walks. The coastal path is wide, well-maintained, and always busy with walkers and runners. Gorgeous ocean views the entire way. Safe at all hours though best enjoyed during daylight for the scenery. Public toilets and cafes along the route.",
    lifeDimension: "daily" as const,
    rating: 5,
    location: { name: "Bondi Beach, Sydney, Australia", coordinates: [151.2743, -33.8915] },
  },
  {
    title: "Melbourne CBD laneways — mostly safe and artsy",
    description: "Famous laneways like Hosier Lane and Degraves Street are fantastic for coffee and street art. Well-trafficked during the day. Some laneways get quiet after business hours but the main ones near Flinders St stay lively. Exercise normal caution at night.",
    lifeDimension: "travel" as const,
    rating: 4,
    location: { name: "Melbourne CBD, Australia", coordinates: [144.9631, -37.8136] },
  },

  // === MIDDLE EAST ===
  {
    title: "Dubai Marina walk — safe and well-patrolled",
    description: "The Marina promenade is beautifully maintained with restaurants, shops, and waterfront views. Security presence is visible, CCTV everywhere. Safe for women walking alone even late at night. The tram and metro are clean and well-connected. Dress code is relaxed here compared to other areas.",
    lifeDimension: "daily" as const,
    rating: 5,
    location: { name: "Dubai Marina, Dubai, UAE", coordinates: [55.1395, 25.0805] },
  },
  {
    title: "Old City Jerusalem — intense but navigable",
    description: "A deeply moving place to visit. The four quarters each have different vibes. Tourist areas are safe during the day with heavy security presence. The Muslim Quarter market can be overwhelming with aggressive sellers. Stick to main routes and go with a guide for your first visit.",
    lifeDimension: "travel" as const,
    rating: 3,
    location: { name: "Old City, Jerusalem, Israel", coordinates: [35.2321, 31.7767] },
  },
  {
    title: "Hamra Street Beirut — vibrant university district",
    description: "One of Beirut's most cosmopolitan streets. The AUB campus area feels safe and progressive. Lots of cafes, bookshops, and students. Night life is lively on surrounding streets. General safety has improved but keep aware of the broader political context. Taxis are cheap and plentiful.",
    lifeDimension: "social" as const,
    rating: 3,
    location: { name: "Hamra Street, Beirut, Lebanon", coordinates: [35.4835, 33.8969] },
  },
];

/**
 * Seed safety map posts (~30 English posts with diverse ratings and global locations)
 * Run with: npx convex run seedData:seedSafetyMapPosts
 */
export const seedSafetyMapPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create seed user
    let seedUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "seed@aurora-app.com"))
      .first();

    if (!seedUser) {
      const seedUserId = await ctx.db.insert("users", {
        workosId: "seed-aurora-community",
        name: "Aurora Community",
        email: "seed@aurora-app.com",
        profileImage: "/Au_Logo_1.png",
        bio: "Official Aurora App community account",
        location: "Global",
        interests: ["safety", "travel", "community"],
        onboardingCompleted: true,
        credits: 1000,
        trustScore: 500,
        isPremium: false,
      });
      seedUser = await ctx.db.get(seedUserId);
    }

    if (!seedUser) throw new Error("Failed to create seed user");

    let created = 0;
    for (const post of SEED_SAFETY_MAP_POSTS) {
      // Skip duplicates by title
      const existing = await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("title"), post.title))
        .first();

      if (!existing) {
        await ctx.db.insert("posts", {
          authorId: seedUser._id,
          title: post.title,
          description: post.description,
          lifeDimension: post.lifeDimension,
          location: post.location,
          rating: post.rating,
          isVerified: post.rating >= 4, // Higher-rated posts are "verified"
          isAnonymous: false,
          verificationCount: Math.floor(Math.random() * 25) + 3,
          upvotes: Math.floor(Math.random() * 60) + 5,
          commentCount: Math.floor(Math.random() * 12) + 1,
          postType: "standard",
        });
        created++;
      }
    }

    return { success: true, created, total: SEED_SAFETY_MAP_POSTS.length };
  },
});

/**
 * Seed all data at once
 * Run with: npx convex run seedData:seedAll
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // This will be called from the individual functions
    return { message: "Use seedPosts and seedRoutes separately" };
  },
});
