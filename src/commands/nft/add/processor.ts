import { Message } from "discord.js"
import { callAPI, toEmbed } from "../processor"

export async function executeNftAddCommand(args: string[], msg: Message) {
  const { storeCollectionRes, supportedChainsRes } = await callAPI(
    args[2],
    args[3],
    msg.author.id,
    msg.guildId ?? "",
    msg,
    args[4] === "priority"
  )

  return toEmbed(storeCollectionRes, supportedChainsRes, msg)
}
