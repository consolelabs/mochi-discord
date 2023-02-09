// export enum LogLevel {
//   Assertion = "ASSERTION",
//   Info = "INFO",
//   Warn = "WARN",
//   Error = "ERROR",
// }

export type LogLevel = {
  type: string
  color: string
}

export type LogMessage = {
  id: number
  msg: string
}

export const logLevels: { [levelName: string]: LogLevel } = {
  DEBUG: {
    type: "DEBUG",
    color: "#ff0000",
  },
  INFO: {
    type: "INFO",
    color: "#00ff00",
  },
  WARN: {
    type: "WARN",
    color: "#ffff00",
  },
  ERROR: {
    type: "ERROR",
    color: "#ff0000",
  },
}

export const errors: { [errorName: string]: LogMessage } = {
  // db
  DB_QUERY_ERROR: {
    id: 6001,
    msg: "Wrong query statement",
  },
  DB_RECORD_NOT_FOUND: {
    id: 6002,
    msg: "Record not found",
  },
  DB_LOST_CONNECTION: {
    id: 6003,
    msg: "Lost connection to database",
  },
  DB_MAX_CONNECTION: {
    id: 6004,
    msg: "Max connection to database",
  },
  // api
  API_CALL_INTERNAL_ERROR: {
    id: 5005,
    msg: "Unexpected error within server",
    // log_level: LogLevel.Error,
  },
  API_CALL_SERVICE_SUSPENDED: {
    id: 5003,
    msg: "Service not available",
    // log_level: LogLevel.Warn,
  },
  API_CALL_REQUEST_TIMEOUT: {
    id: 5004,
    msg: "Request to api endpoint wait too long",
    // log_level: LogLevel.Info,
  },
  API_CALL_INVALID_PARAMS: {
    id: 5001,
    msg: "Not enough params/wrong type of params",
    // log_level: LogLevel.Info,
  },
  API_CALL_RATELIMIT: {
    id: 5002,
    msg: "Exceed call number per minute",
    // log_level: LogLevel.Info,
  },

  //api key
  API_KEY_EXPIRE: {
    id: 4001,
    msg: "api key expired",
  },
  API_KEY_NOT_FOUND: {
    id: 4002,
    msg: "invalid api key",
  },
  API_KEY_NOT_ENOUGH_PRIVILEGE: {
    id: 4003,
    msg: "api key privilege not enough",
  },
  API_KEY_OUT_OF_QUOTA: {
    id: 4004,
    msg: "api key reach max quota",
  },

  // swap
  SWAP_INIT_FAILED: {
    id: 3001,
    msg: "Init swap failed",
  },
  SWAP_JUDGE_NOT_FOUND: {
    id: 3002,
    msg: "Cannot find a judge for swap",
  },
  SWAP_DEPOSIT_FAILED: {
    id: 3003,
    msg: "Cannot deposit item",
  },
  SWAP_VERIFY_FAILED: {
    id: 3004,
    msg: "Cannot verify the item integrity",
  },
  SWAP_REJECT_FAILED: {
    id: 3005,
    msg: "Validator cannot reject swap",
  },
  SWAP_CANCEL_FAILED: {
    id: 3006,
    msg: "User cannot cancel",
  },
  SWAP_LOCK_FAILED: {
    id: 3007,
    msg: "Lock failed",
  },
  SWAP_TRANSFER_FAILED: {
    id: 3008,
    msg: "Items were not transferred to user",
  },
}
