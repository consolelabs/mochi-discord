import { CommandInteraction, Message } from "discord.js"
import { callAPI, toEmbed } from "../processor"
import { reply } from "utils/discord"

export async function executeNftAddCommand(
  args: string[],
  msgOrInteraction: Message | CommandInteraction,
) {
  const author =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.author.id
      : msgOrInteraction.user.id
  const msg = msgOrInteraction instanceof Message ? msgOrInteraction : undefined
  const { storeCollectionRes, supportedChainsRes } = await callAPI(
    args[2],
    args[3],
    author,
    msgOrInteraction.guildId ?? "",
    msgOrInteraction,
    args[4] === "priority",
  )

  const response = await toEmbed(storeCollectionRes, supportedChainsRes, msg)
  await reply(msgOrInteraction, response)
}
