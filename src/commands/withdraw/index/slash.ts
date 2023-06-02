import { CommandInteraction } from "discord.js"
import { TokenEmojiKey } from "utils/common"
import { withdraw } from "./processor"

const run = async (interaction: CommandInteraction) => {
  const amount = interaction.options.getString("amount", true)
  const token = interaction.options
    .getString("token", true)
    .toUpperCase() as TokenEmojiKey
  return await withdraw(interaction, amount, token)
}
export default run
