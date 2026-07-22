import * as Sentry from "@sentry/nextjs";

import { IS_DEV_ENV } from "@/lib/constants";

const isCi = process.env.CI === "true";

if (!isCi) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !IS_DEV_ENV && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,
  });
}
