import { handleSendXp } from "./processor"
import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { getErrorEmbed } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"

const run = async (msg: Message) => {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  // remove 'xp' argument
  const args = getCommandArguments(msg).filter(
    (arg) => arg.toLowerCase() !== "xp",
  )
  const each = args[args.length - 1].toLowerCase() === "each" ? true : false
  const amount = Number(each ? args[args.length - 2] : args[args.length - 1])
  if (Number.isNaN(amount)) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Fail to send XP!",
            description: "XP amount must be a number",
          }),
        ],
      },
    }
  }

  return handleSendXp(
    msg,
    args.slice(1, each ? -2 : -1).join(" "),
    amount,
    each,
  )
}

export default run
