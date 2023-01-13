import { CommandInteraction } from "discord.js"
import { handleProfile } from "./processor"

const run = async (interaction: CommandInteraction) => {
  const user = interaction.options.getString("user")
  const args = ["profile"]
  if (user) args.push(user)
  return await handleProfile(interaction, args)
}
export default run
