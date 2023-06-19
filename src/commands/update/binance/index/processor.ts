import { sendBinanceManualMessage } from "commands/profile/index/processor"
import { CommandInteraction, GuildMember } from "discord.js"
import { InternalError } from "errors"

export async function render(
  interaction: CommandInteraction,
  member: GuildMember
) {
  if (!(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: interaction,
      description: "Couldn't get user data",
    })
  }

  return await sendBinanceManualMessage(true)
}
