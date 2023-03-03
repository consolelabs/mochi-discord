import { handleSendXp } from "./processor"
import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"

const run = async (interaction: CommandInteraction) => {
  const targets = interaction.options.getString("recipients")
  const amount = interaction.options.getNumber("amount")
  const each = interaction.options.getBoolean("each") ?? false
  if (!targets || !amount) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Invalid arguments",
    })
  }

  return handleSendXp(interaction, targets, amount, each)
}

export default run
