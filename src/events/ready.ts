import { DiscordEvent } from "."
import Discord from "discord.js"
import { PREFIX } from "utils/constants"
import { logger } from "../logger"
import ChannelLogger from "utils/ChannelLogger"
import { invites } from "utils/invites"
import { setTimeout as wait } from "timers/promises"
import TwitterStream from "utils/TwitterStream"
import defi from "adapters/defi"
import { wrapError } from "utils/wrapError"
import InteractionManager from "utils/InteractionManager"

export let IS_READY = false

const event: DiscordEvent<"ready"> = {
  name: "ready",
  once: false,
  execute: async (client) => {
    wrapError(null, async () => {
      if (!client.user) return
      logger.info(`Bot [${client.user.username}] is ready`)
      ChannelLogger.ready(client)
      InteractionManager.client = client
      // get gas price and show in presence message every 15s
      const chains = ["eth", "ftm", "bsc", "matic"]
      const presence = async () => {
        const chain = chains.shift()
        if (chain) chains.push(chain)
        const res = await defi.getGasPrice(chain ?? "eth")
        if (res.ok) {
          const data = res.result
          const normalGasPrice = (+data.ProposeGasPrice).toFixed()
          const fastGasPrice = (+data.FastGasPrice).toFixed()
          client.user?.setPresence({
            status: "online",
            activities: [
              {
                name: `${(
                  chain ?? "eth"
                ).toUpperCase()}・⚡️${fastGasPrice}・🚶${normalGasPrice}・${PREFIX}help`,
                type: "PLAYING",
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

      // set the client so the bot can send message
      TwitterStream.client = client
      IS_READY = true
    })
  },
}

export default event

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
