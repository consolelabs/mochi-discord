import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { handle } from "./processor"

const run = async (msg: Message) => {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  return handle(msg)
}

export default run
