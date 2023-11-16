import API from "@consolelabs/mochi-rest"
import {
  MOCHI_PAY_API_SERVER_HOST,
  API_SERVER_HOST,
  MOCHI_PROFILE_API_SERVER_HOST,
  MOCHI_BOT_SECRET,
} from "env"
import { logger } from "logger"

const api = new API({
  payUrl: `${MOCHI_PAY_API_SERVER_HOST}/api/v1`,
  baseUrl: `${API_SERVER_HOST}/api/v1`,
  profileUrl: `${MOCHI_PROFILE_API_SERVER_HOST}/api/v1`,
  catcher: (e) => {
    logger.error(e)
  },
})
api.token(`Bearer ${MOCHI_BOT_SECRET}`)

export default api
