/**
 * Aurora App - Scheduled Rate Limit Cleanup
 *
 * Periodically cleans up expired rate limit entries to keep
 * the database lean and performant.
 *
 * Runs every hour to remove rate limit entries whose window has expired.
 */

import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";

const crons = cronJobs();

// Clean up expired rate limits every hour
crons.hourly(
  "cleanup-expired-rate-limits",
  { minuteUTC: 30 }, // Run at 30 minutes past each hour
  internal.rateLimit.cleanupExpiredRateLimits
);

export default crons;
