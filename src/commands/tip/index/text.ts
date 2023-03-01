import { GuildIdNotFoundError } from "errors"
import { getCommandArguments } from "utils/commands"
import { handleTip } from "./processor"
import { Message } from "discord.js"
import { SPACE } from "utils/constants"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  // validate valid guild
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }
  return await handleTip(args, msg.author.id, args.join(SPACE), msg)
}
export default run
