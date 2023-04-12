import { CommandInteraction } from "discord.js"
import { TokenEmojiKey } from "utils/common"
import * as processor from "./processor"

const run = async (interaction: CommandInteraction) => {
  const amount = interaction.options.getString("amount", true)
  const token = interaction.options
    .getString("token", true)
    .toUpperCase() as TokenEmojiKey
  return await processor.withdraw(interaction, amount, token)
}
export default run
