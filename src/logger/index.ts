import { PREVIEW, PROD, TEST } from "env"
import pino, { LoggerOptions } from "pino"

const options: LoggerOptions =
  PROD || PREVIEW
    ? {
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
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
          },
        },
      }
export const logger = pino(options, process.stdout)
