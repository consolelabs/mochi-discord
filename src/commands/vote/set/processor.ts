import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"

export async function handle(channelId: string, message: Message) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message })
  }
  const res = await config.setVoteChannel(message.guildId, channelId)

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log })
  }
}
