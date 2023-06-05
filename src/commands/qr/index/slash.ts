import { CommandInteraction, GuildMember, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { render } from "./processor"

export const machineConfig: MachineConfig = {
  id: "qrCodes",
  initial: "qrCodes",
  states: {
    qrCodes: {
      on: {
        VIEW_QR: "qr",
        // transition to self (for implementing pagination)
        PAGE: "qrCodes",
      },
    },
    qr: {
      on: {
        BACK: "qrCodes",
      },
    },
  },
}

const run = async (interaction: CommandInteraction) => {
  const replyPayload = await render(
    interaction,
    interaction.member as GuildMember
  )

  const reply = (await interaction.editReply(replyPayload)) as Message

  route(reply, interaction.user, machineConfig)
}
export default run
