import pino from "pino"

import { PROD } from "./env"

const options = PROD
  ? {}
  : {
      prettyPrint: {
        colorize: true,
        levelFirst: true,
      },
    }
export const logger = pino(options, process.stdout)
