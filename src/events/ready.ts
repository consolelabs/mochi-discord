import { Event } from "."
import Discord from "discord.js"
import { PREFIX } from "../env"
import { logger } from "../logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import client from "../index"
import { invites } from "./index"

const wait = require("timers/promises").setTimeout

export default {
  name: "ready",
  once: false,
  execute: async (listener: Discord.Client) => {
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

    client.guilds.cache.forEach(async (guild) => {
      const firstInvites = await guild.invites.fetch()
      invites.set(guild.id, new Discord.Collection(firstInvites.map((invite) => [invite.code, invite.uses])))
    })

    await wait(1000)
  },
} as Event<"ready">

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
