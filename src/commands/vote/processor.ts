import config from "adapters/config"
import { Message } from "discord.js"
import { APIError } from "errors"

export async function handleInfo(guildId: string, message: Message) {
  const res = await config.getVoteChannel(guildId)
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }

  return res.data
}
