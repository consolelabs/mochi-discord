import { CommandInteraction, GuildMember, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { render } from "./processor"
import {
  submitBinanceKeys,
  showModalBinanceKeys,
} from "../../../profile/index/processor"

export const machineConfig: (...args: any[]) => MachineConfig = () => ({
  id: "binance",
  initial: "binance",
  context: {
    modal: {
      SUBMIT_BINANCE: true,
      ENTER_KEY: true,
    },
  },
  states: {
    binance: {
      on: {
        SUBMIT_BINANCE: {
          type: "binance",
          actions: {
            type: "submitBinanceKeys",
          },
        },
      },
    },
  },
})

const run = async (interaction: CommandInteraction) => {
  const member = interaction.member as GuildMember
  const msgOpts = await render(interaction, member)
  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction, machineConfig(member), {
    actions: {
      submitBinanceKeys: async (_, event) => {
        if (!event.interaction || !event.interaction.isButton()) return

        const result = await submitBinanceKeys(
          event.interaction,
          await showModalBinanceKeys(event.interaction)
        )

        const reply = (await event.interaction.editReply(
          result.msgOpts
        )) as Message

        route(reply, event.interaction, {
          id: "resubmit",
          initial: "resubmit",
          context: {
            ephemeral: {
              ENTER_KEY: true,
            },
            modal: {
              ENTER_KEY: true,
            },
            button: {
              resubmit: async (i) =>
                submitBinanceKeys(i, await showModalBinanceKeys(i)),
            },
          },
          states: {
            resubmit: {
              on: {
                ENTER_KEY: "resubmit",
              },
            },
          },
        })
      },
    },
  })
}

export default run
