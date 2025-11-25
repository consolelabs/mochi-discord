import { PREVIEW, PROD, TEST } from "env"
import pino, { LoggerOptions } from "pino"

const logLevel = (process.env.LOG_LEVEL || "info").toLowerCase()

const options: LoggerOptions =
  PROD || PREVIEW
    ? {
        level: logLevel,
        transport: {
          target: "pino/file",
          options: {
            destination: 1,
          },
        },
      }
    : TEST
    ? {
        enabled: false,
      }
    : {
        level: logLevel,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
          },
        },
      }
export const logger = pino(options, process.stdout)
