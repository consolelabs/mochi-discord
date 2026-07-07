import { DiscordEvent } from "."
import Discord from "discord.js"
import { PREFIX } from "utils/constants"
import { invites } from "utils/invites"
import { setTimeout as wait } from "timers/promises"
import { wrapError } from "utils/wrap-error"
import InteractionManager from "handlers/discord/select-menu"
import { logger } from "logger"

export let IS_READY = false

const event: DiscordEvent<"ready"> = {
  name: "ready",
  once: false,
  execute: async (client) => {
    client
    return await wrapError("ready", async () => {
      if (!client.user) return
      logger.info(`Bot [${client.user.username}] is ready`)
      InteractionManager.client = client
      for (const cache of client.guilds.cache) {
        const guild = cache[1]
        if (guild.members.me?.permissions.has("ADMINISTRATOR")) {
          const firstInvites = await guild.invites.fetch()
          invites.set(
            guild.id,
            new Discord.Collection(
              firstInvites.map((invite) => [invite.code, invite.uses ?? 0]),
            ),
          )
        }
      }

      await wait(1000)

      // set the client so the bot can send message
      IS_READY = true
    })
  },
}

export default event

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
