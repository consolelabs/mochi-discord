import { Event } from "."
import Discord from "discord.js"
import { PREFIX } from "utils/constants"
import { logger } from "../logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import client from "../index"
import { invites } from "./index"
import { BotBaseError } from "errors"
import { setTimeout as wait } from "timers/promises"
import TwitterStream from "utils/TwitterStream"
import defi from "adapters/defi"

export default {
  name: "ready",
  once: false,
  execute: async (listener: Discord.Client) => {
    if (!listener.user) return
    try {
      logger.info(`Bot [${listener.user.username}] is ready`)
      ChannelLogger.ready(listener)
      CommandChoiceManager.client = listener
      // get gas price and show in presence message every 15s
      const chains = ["eth", "ftm", "bsc", "polygon"]
      const presence = async () => {
        const chain = chains.shift()
        if (chain) chains.push(chain)
        const res = await defi.getGasPrice(chain ?? "eth")
        if (res.ok) {
          const data = res.result
          const slowGasPrice = (+data.SafeGasPrice).toFixed()
          const normalGasPrice = (+data.ProposeGasPrice).toFixed()
          const fastGasPrice = (+data.FastGasPrice).toFixed()
          client.user?.setPresence({
            status: "online",
            activities: [
              {
                name: `${(
                  chain ?? "eth"
                ).toUpperCase()}|⚡️${fastGasPrice}|🚶${normalGasPrice}|🐢${slowGasPrice}|${PREFIX}help`,
                type: "WATCHING",
              },
            ],
          })
        }
      }

      runAndSetInterval(presence, 15000)

      for (const cache of client.guilds.cache) {
        const guild = cache[1]
        if (guild.me?.permissions.has("ADMINISTRATOR")) {
          const firstInvites = await guild.invites.fetch()
          invites.set(
            guild.id,
            new Discord.Collection(
              firstInvites.map((invite) => [invite.code, invite.uses ?? 0])
            )
          )
        }
      }

      await wait(1000)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"ready">')
    }

    // set the client so the bot can send message
    TwitterStream.client = listener
  },
} as Event<"ready">

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
