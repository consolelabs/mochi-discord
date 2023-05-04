import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { wrapError } from "utils/wrap-error"

const event: DiscordEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  once: false,
  execute: async (member) => {
    return await wrapError(
      {
        sub_event_type: "guildMemberRemove",
        guild_id: member.guild.id,
        user_id: member.user.id,
      },
      async () => {
        const data = {
          guild_id: member.guild.id,
          discord_id: member.id,
          username: member.displayName,
          avatar: member.displayAvatarURL(),
        }
        await webhook.pushDiscordWebhook("guildMemberRemove", data)
      }
    )
  },
}

export default event
