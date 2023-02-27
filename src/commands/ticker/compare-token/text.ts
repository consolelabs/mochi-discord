import { composeTokenComparisonEmbed } from "./processor"
import { TextCommandResponse } from "types/common"
import { Message } from "discord.js"

async function run(
  msg: Message,
  base: string,
  target: string
): Promise<TextCommandResponse> {
  return await composeTokenComparisonEmbed(
    msg.guildId ?? "",
    msg.author.id,
    base,
    target
  )
}

export default run
