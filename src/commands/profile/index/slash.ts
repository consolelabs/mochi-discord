import { CommandInteraction } from "discord.js"
import { render } from "./processor"

const run = async (interaction: CommandInteraction) => {
  const user = interaction.options.getString("user")
  return await render(interaction, user)
}
export default run
