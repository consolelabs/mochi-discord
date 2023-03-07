import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { handle } from "./processor"

const run = async (interaction: CommandInteraction) => {
  if (!interaction.guildId) {
    throw new GuildIdNotFoundError({})
  }
  return handle(interaction)
}

export default run
