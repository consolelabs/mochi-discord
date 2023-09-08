import { CommandInteraction, GuildMember, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { render, viewQR } from "./processor"

export const machineConfig: (ctx?: any) => MachineConfig = (context = {}) => ({
  id: "qrCodes",
  initial: "qrCodes",
  context: {
    button: {
      qrCodes: (i, _ev, ctx) => render(i, i.member as GuildMember, ctx.page),
    },
    select: {
      qr: (i) => viewQR(i),
    },
    ...context,
  },
  states: {
    qrCodes: {
      on: {
        VIEW_QR: "qr",
        // transition to self (for implementing pagination)
        PREV_PAGE: "qrCodes",
        NEXT_PAGE: "qrCodes",
      },
    },
    qr: {
      on: {
        BACK: "qrCodes",
      },
    },
  },
})

const run = async (interaction: CommandInteraction) => {
  const { context, msgOpts } = await render(
    interaction,
    interaction.member as GuildMember,
  )

  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction, machineConfig(context))
}
export default run
