import { handlePrefixedCommand } from "commands"
import tagme from "handlers/tagme"
import { textCommandAsyncStore } from "utils/async-storages"
import { PREFIX } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "./index"

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
          tagme.handle(message)
        })
      },
    )
  },
}

export default events
