import API from "@consolelabs/mochi-rest"
import { PROD } from "env"

export default new API({
  preview: !PROD,
})
