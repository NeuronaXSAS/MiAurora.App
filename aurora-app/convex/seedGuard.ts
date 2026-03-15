export type AuroraEnvironment = "local" | "staging" | "production";

function normalizeStage(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function inferAuroraEnvironment(): AuroraEnvironment {
  const explicitStage = normalizeStage(
    process.env.AURORA_ENV ?? process.env.APP_ENV,
  );

  if (explicitStage === "production" || explicitStage === "prod") {
    return "production";
  }

  if (
    explicitStage === "staging" ||
    explicitStage === "preview" ||
    explicitStage === "stage"
  ) {
    return "staging";
  }

  const vercelStage = normalizeStage(process.env.VERCEL_ENV);
  if (vercelStage === "production") {
    return "production";
  }
  if (vercelStage === "preview") {
    return "staging";
  }

  const nodeEnv = normalizeStage(process.env.NODE_ENV);
  if (nodeEnv === "production") {
    const deployment = normalizeStage(process.env.CONVEX_DEPLOYMENT);
    const convexUrl = normalizeStage(process.env.NEXT_PUBLIC_CONVEX_URL);
    if (
      deployment.includes("prod") ||
      convexUrl.includes("prod") ||
      convexUrl.includes("cloud")
    ) {
      return "production";
    }
    return "staging";
  }

  return "local";
}

export function assertNonProductionSeeding(operation: string): void {
  if (inferAuroraEnvironment() === "production") {
    throw new Error(
      `${operation} is blocked in production. Use the admin audit/reset flow instead.`,
    );
  }
}

export function blockDeprecatedSeedPath(operation: string): never {
  throw new Error(
    `${operation} is deprecated. Use demoSeed:seedInvestorDemo for non-production fixtures or cleanup:* for the canonical audit/reset flow.`,
  );
}
