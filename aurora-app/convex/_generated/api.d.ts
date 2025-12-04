/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accompaniment from "../accompaniment.js";
import type * as actions_agora from "../actions/agora.js";
import type * as actions_analyzeReel from "../actions/analyzeReel.js";
import type * as actions_twilio from "../actions/twilio.js";
import type * as ai from "../ai.js";
import type * as aiAnalytics from "../aiAnalytics.js";
import type * as aiSharing from "../aiSharing.js";
import type * as analytics from "../analytics.js";
import type * as badges from "../badges.js";
import type * as circles from "../circles.js";
import type * as comments from "../comments.js";
import type * as creator from "../creator.js";
import type * as credits from "../credits.js";
import type * as cycleTracker from "../cycleTracker.js";
import type * as directMessages from "../directMessages.js";
import type * as emergency from "../emergency.js";
import type * as events from "../events.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as gifts from "../gifts.js";
import type * as guardians from "../guardians.js";
import type * as health from "../health.js";
import type * as intelligence from "../intelligence.js";
import type * as livestreams from "../livestreams.js";
import type * as locationSharing from "../locationSharing.js";
import type * as moderation from "../moderation.js";
import type * as monetization from "../monetization.js";
import type * as notifications from "../notifications.js";
import type * as opportunities from "../opportunities.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as premium from "../premium.js";
import type * as premiumConfig from "../premiumConfig.js";
import type * as privacy from "../privacy.js";
import type * as reels from "../reels.js";
import type * as resources from "../resources.js";
import type * as rooms from "../rooms.js";
import type * as routes from "../routes.js";
import type * as safetyAccess from "../safetyAccess.js";
import type * as safetyCheckins from "../safetyCheckins.js";
import type * as savedPosts from "../savedPosts.js";
import type * as scheduled_aggregateIntelligence from "../scheduled/aggregateIntelligence.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as seedDataEnhanced from "../seedDataEnhanced.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as workplaceReports from "../workplaceReports.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accompaniment: typeof accompaniment;
  "actions/agora": typeof actions_agora;
  "actions/analyzeReel": typeof actions_analyzeReel;
  "actions/twilio": typeof actions_twilio;
  ai: typeof ai;
  aiAnalytics: typeof aiAnalytics;
  aiSharing: typeof aiSharing;
  analytics: typeof analytics;
  badges: typeof badges;
  circles: typeof circles;
  comments: typeof comments;
  creator: typeof creator;
  credits: typeof credits;
  cycleTracker: typeof cycleTracker;
  directMessages: typeof directMessages;
  emergency: typeof emergency;
  events: typeof events;
  feed: typeof feed;
  files: typeof files;
  gifts: typeof gifts;
  guardians: typeof guardians;
  health: typeof health;
  intelligence: typeof intelligence;
  livestreams: typeof livestreams;
  locationSharing: typeof locationSharing;
  moderation: typeof moderation;
  monetization: typeof monetization;
  notifications: typeof notifications;
  opportunities: typeof opportunities;
  polls: typeof polls;
  posts: typeof posts;
  premium: typeof premium;
  premiumConfig: typeof premiumConfig;
  privacy: typeof privacy;
  reels: typeof reels;
  resources: typeof resources;
  rooms: typeof rooms;
  routes: typeof routes;
  safetyAccess: typeof safetyAccess;
  safetyCheckins: typeof safetyCheckins;
  savedPosts: typeof savedPosts;
  "scheduled/aggregateIntelligence": typeof scheduled_aggregateIntelligence;
  search: typeof search;
  seed: typeof seed;
  seedData: typeof seedData;
  seedDataEnhanced: typeof seedDataEnhanced;
  subscriptions: typeof subscriptions;
  users: typeof users;
  workplaceReports: typeof workplaceReports;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
