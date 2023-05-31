import { CommandInteraction, GuildMember } from "discord.js"
import { InternalError } from "errors"
import { render } from "./processor"

const run = async (interaction: CommandInteraction) => {
  const member = interaction.options.getMember("user")
  if (member !== null && !(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: interaction,
      description: "Couldn't get user data",
    })
  }
  await render(interaction, member)
}
export default run
