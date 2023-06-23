import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig } from "commands/wallet/common/tracking"
import { untrackWallet } from "./processor"

const command: SlashCommand = {
  name: "untrack",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("untrack")
      .setDescription("Remove wallet from tracking list.")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("Address or alias of the wallet")
          .setRequired(true)
      )
  },
  run: async function (i: CommandInteraction) {
    const address = i.options.getString("address", true)

    const { msgOpts } = await untrackWallet(i, i.user, address)
    const reply = await i.editReply(msgOpts)

    route(reply as Message, i, machineConfig("walletUntrack"))
  },
  help: () =>
    Promise.resolve({
      embeds: [
        // TODO: add help message
      ],
    }),
  colorType: "Defi",
}

export default command
