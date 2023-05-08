import webhook from "adapters/webhook"
import { logger } from "logger"
import { eventAsyncStore } from "utils/async-storages"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "."

const event: DiscordEvent<"guildDelete"> = {
  name: "guildDelete",
  once: false,
  execute: async (guild) => {
    logger.info(`Left guild: ${guild.name} (id: ${guild.id}).`)

    const metadata = {
      sub_event_type: "guildDelete",
      guild_id: guild.id,
    }

    eventAsyncStore.run(
      {
        data: JSON.stringify(metadata),
      },
      async () => {
        await wrapError(metadata, async () => {
          const data = {
            guild_id: guild.id,
            guild_name: guild.name,
            icon_url: guild.iconURL({ format: "png" }),
          }
          await webhook.pushDiscordWebhook("guildDelete", data)
        })
      }
    )
  },
}

export default event
