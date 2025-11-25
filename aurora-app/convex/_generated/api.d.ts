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
import type * as aiSharing from "../aiSharing.js";
import type * as analytics from "../analytics.js";
import type * as comments from "../comments.js";
import type * as creator from "../creator.js";
import type * as credits from "../credits.js";
import type * as directMessages from "../directMessages.js";
import type * as emergency from "../emergency.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as health from "../health.js";
import type * as intelligence from "../intelligence.js";
import type * as livestreams from "../livestreams.js";
import type * as moderation from "../moderation.js";
import type * as monetization from "../monetization.js";
import type * as notifications from "../notifications.js";
import type * as opportunities from "../opportunities.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as privacy from "../privacy.js";
import type * as reels from "../reels.js";
import type * as routes from "../routes.js";
import type * as scheduled_aggregateIntelligence from "../scheduled/aggregateIntelligence.js";
import type * as seedData from "../seedData.js";
import type * as seedDataEnhanced from "../seedDataEnhanced.js";
import type * as users from "../users.js";

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
  aiSharing: typeof aiSharing;
  analytics: typeof analytics;
  comments: typeof comments;
  creator: typeof creator;
  credits: typeof credits;
  directMessages: typeof directMessages;
  emergency: typeof emergency;
  feed: typeof feed;
  files: typeof files;
  health: typeof health;
  intelligence: typeof intelligence;
  livestreams: typeof livestreams;
  moderation: typeof moderation;
  monetization: typeof monetization;
  notifications: typeof notifications;
  opportunities: typeof opportunities;
  polls: typeof polls;
  posts: typeof posts;
  privacy: typeof privacy;
  reels: typeof reels;
  routes: typeof routes;
  "scheduled/aggregateIntelligence": typeof scheduled_aggregateIntelligence;
  seedData: typeof seedData;
  seedDataEnhanced: typeof seedDataEnhanced;
  users: typeof users;
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
