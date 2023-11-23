import { handlePrefixedCommand } from "commands"
import tagme from "handlers/tagme"
import { textCommandAsyncStore } from "utils/async-storages"
import { PREFIX } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "./index"
import { logger } from "logger"
import { Sentry } from "sentry"
import { version } from "../../../package.json"

const events: DiscordEvent<"messageCreate"> = {
  name: "messageCreate",
  once: false,
  execute: async (message) => {
    textCommandAsyncStore.run(
      {
        msgOrInteraction: message,
        data: JSON.stringify({
          sub_event_type: "messageCreate",
          guild_id: message.guildId || "DM",
          channel_id: message.channelId,
          discord_id: message.author.id,
          command: message.content,
          msg_id: message.id,
        }),
      },
      () => {
        wrapError(message, async () => {
          // deny handling if author is bot or message is empty (new user join server)
          if (
            message.author.bot ||
            (!message.content && !message.stickers.size)
          )
            return
          if (message.content.startsWith(PREFIX)) {
            await handlePrefixedCommand(message)
            return
          }

          // not showing error to user
          try {
            await tagme.handle(message)
          } catch (e: any) {
            logger.error(e)
            Sentry.captureException(e, {
              contexts: {
                user: {
                  id: message.author.id,
                  username: message.author.username,
                },
                app: {
                  app_version: `v${version}`,
                },
              },
            })
          }
        })
      },
    )
  },
}

export default events
