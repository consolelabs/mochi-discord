import { CommandInteraction, GuildMember, Message } from "discord.js"
import { MachineConfig, route } from "utils/router"
import { render } from "./processor"
import {
  submitBinanceKeys,
  showModalBinanceKeys,
} from "commands/profile/index/processor"

const machineConfig: MachineConfig = {
  id: "update binance",
  initial: "updateBinance",
  context: {
    modal: {
      ENTER_KEY: true,
    },
    button: {
      updateBinance: async (i) =>
        submitBinanceKeys(i, await showModalBinanceKeys(i, true)),
    },
  },
  states: {
    updateBinance: {
      on: {
        ENTER_KEY: "updateBinance",
      },
    },
  },
}

const run = async (interaction: CommandInteraction) => {
  const member = interaction.member as GuildMember
  const { msgOpts } = await render(interaction, member)
  const reply = (await interaction.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  route(reply, interaction, machineConfig)
}

export default run
