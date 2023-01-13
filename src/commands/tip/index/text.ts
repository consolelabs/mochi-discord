import { GuildIdNotFoundError } from "errors"
import { getCommandArguments } from "utils/commands"
import { handleTip } from "./processor"
import { Message } from "discord.js"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  // validate valid guild
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }
  return {
    messageOptions: {
      ...(await handleTip(
        args,
        msg.author.id,
        msg.content.replaceAll(/\s{2,}/gim, " "),
        msg
      )),
    },
  }
}
export default run
