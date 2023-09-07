import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig } from "commands/wallet/common/tracking"
import { render as renderTrackingWallets } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Show all your interested wallets assets and activities.")
  },
  run: async function (i: CommandInteraction) {
    const { msgOpts } = await renderTrackingWallets(i.user)

    const reply = await i.editReply(msgOpts)

    route(
      reply as Message,
      i,
      machineConfig("wallets", { isFromWalletList: true }),
    )
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
