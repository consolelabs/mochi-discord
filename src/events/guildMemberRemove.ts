import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { wrapError } from "utils/wrapError"

const event: DiscordEvent<"guildMemberRemove"> = {
  name: "guildMemberRemove",
  once: false,
  execute: async (member) => {
    wrapError(null, async () => {
      const data = {
        guild_id: member.guild.id,
        discord_id: member.id,
        username: member.displayName,
        avatar: member.displayAvatarURL(),
      }
      await webhook.pushDiscordWebhook("guildMemberRemove", data)
    })
  },
}

export default event
