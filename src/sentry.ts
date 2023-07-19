import * as Sentry from "@sentry/node"
import { SENTRY_DSN } from "env"

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
})

export { Sentry }
