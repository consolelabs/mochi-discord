import { CommandInteraction, GuildMember, Message } from "discord.js"
import { InternalError } from "errors"
import { render, collectSelection } from "./processor"

const run = async (interaction: CommandInteraction) => {
  const member = interaction.options.getMember("user")
  if (member !== null && !(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: interaction,
      description: "Couldn't get user data",
    })
  }
  const replyPayload = await render(interaction, member)

  const reply = (await interaction.editReply(replyPayload)) as Message

  collectSelection(reply, interaction.user, replyPayload.components)
}
export default run
