import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { wrapError } from "utils/wrap-error"
import { eventAsyncStore } from "utils/async-storages"

const event: DiscordEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  once: false,
  execute: async (member) => {
    const metadata = {
      sub_event_type: "guildMemberRemove",
      guild_id: member.guild.id,
      discord_id: member.user.id,
    }
    eventAsyncStore.run(
      {
        data: JSON.stringify(metadata),
      },
      async () => {
        await wrapError(metadata, async () => {
          const data = {
            guild_id: member.guild.id,
            discord_id: member.id,
            username: member.displayName,
            avatar: member.displayAvatarURL(),
          }
          await webhook.pushDiscordWebhook("guildMemberRemove", data)
        })
      }
    )
  },
}

export default event
