import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"

export async function deleteWhitelist(roleId: string, message: Message) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message })
  }
  const res = await config.removeExcludedRole(roleId, message.guildId)
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: message,
      curl: res.curl,
      description: res.log,
    })
  }
}
