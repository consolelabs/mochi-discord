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

export default {
  name: "ready",
  once: false,
  execute: async (listener: Discord.Client) => {
    try {
      logger.info(`Bot [${listener.user.username}] is ready`)
      ChannelLogger.ready(listener)
      CommandChoiceManager.client = listener
      // get balance and show in presence message every 10m
      const presence = async () => {
        listener.user.setPresence({
          status: "online",
          activities: [
            {
              name: `${PREFIX}help`,
              type: "WATCHING",
            },
          ],
        })
      }
      runAndSetInterval(presence, 600000)

      for (const cache of client.guilds.cache) {
        const guild = cache[1]
        const firstInvites = await guild.invites.fetch()
        invites.set(
          guild.id,
          new Discord.Collection(
            firstInvites.map((invite) => [invite.code, invite.uses])
          )
        )
      }

      await wait(1000)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"ready">

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
