/**
 * Scheduled function to aggregate intelligence data
 * Runs daily at 3 AM UTC to build Corporate and Urban Safety Indexes
 */

import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";

const crons = cronJobs();

// Run daily at 3 AM UTC - Corporate Safety Index
crons.daily(
  "aggregate corporate safety",
  { hourUTC: 3, minuteUTC: 0 },
  internal.intelligence.aggregateCorporateSafety
);

// Run daily at 3:30 AM UTC - Urban Safety Index
crons.daily(
  "aggregate urban safety",
  { hourUTC: 3, minuteUTC: 30 },
  internal.intelligence.aggregateUrbanSafety
);

export default crons;
