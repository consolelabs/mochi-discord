import pino from "pino"

import { PROD, TEST } from "./env"

const options = PROD
  ? {}
  : TEST
  ? { enabled: false }
  : {
      prettyPrint: {
        colorize: true,
        levelFirst: true,
      },
    }
export const logger = pino(options, process.stdout)
