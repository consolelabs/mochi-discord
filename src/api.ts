import API from "@consolelabs/mochi-rest"
import {
  MOCHI_PAY_API_SERVER_HOST,
  API_SERVER_HOST,
  MOCHI_PROFILE_API_SERVER_HOST,
} from "env"

export default new API({
  payUrl: MOCHI_PAY_API_SERVER_HOST,
  baseUrl: API_SERVER_HOST,
  profileUrl: MOCHI_PROFILE_API_SERVER_HOST,
})
