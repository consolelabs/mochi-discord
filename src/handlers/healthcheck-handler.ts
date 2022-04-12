import { Middleware } from "koa"
import { PROD } from "../env"

const handler: Middleware = (ctx) => {
  const status = {
    isProd: PROD,
  }
  ctx.body = JSON.stringify(status)
  ctx.headers["content-type"] = "application/json"
  ctx.status = 200
}

export default handler
