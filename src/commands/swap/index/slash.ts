import { CommandInteraction } from "discord.js"
import { TokenEmojiKey } from "utils/common"
import { render } from "./processor"

export default async function run(
  i: CommandInteraction,
  data: any,
  from: TokenEmojiKey,
  to: TokenEmojiKey,
  chainName: string
) {
  return await render(i, data, from, to, chainName)
}
