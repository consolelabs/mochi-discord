import API from "@consolelabs/mochi-rest"
import { DEV, PREVIEW } from "env"

export default new API({
  preview: DEV || PREVIEW,
})
