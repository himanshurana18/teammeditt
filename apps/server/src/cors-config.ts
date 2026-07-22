// Extra origin(s) can be supplied via env var so this server can be reused
// for any deployment without editing source. Comma-separated for multiple.
const EXTRA_ORIGINS = (process.env.CLIENT_URL ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  "https://TeamEdit.dulapahv.dev",
  "https://TeamEdit.vercel.app",
  "https://dev-TeamEdit.dulapahv.dev",
  "http://localhost:3000",
  "https://teamedit.up.railway.app",
  ...EXTRA_ORIGINS,
] as const;

const isVercelDeployment = (origin: string): boolean => {
  const VERCEL_PATTERN =
    /^https:\/\/TeamEdit-client-[a-zA-Z0-9]+-[a-zA-Z0-9-]+\.vercel\.app$/;
  return VERCEL_PATTERN.test(origin);
};

const getAllowedOrigin = (origin: string | undefined): string => {
  if (process.env.NODE_ENV === "production" && !origin) {
    return ALLOWED_ORIGINS[0];
  }

  if (!origin) return "*";

  if (
    ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number]) ||
    isVercelDeployment(origin)
  ) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
};

const getCorsHeaders = (origin: string | undefined) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(origin),
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
});

export { ALLOWED_ORIGINS, getCorsHeaders, isVercelDeployment };
