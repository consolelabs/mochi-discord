import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { copyWallet } from "./processor"
import { MachineConfig, route } from "utils/router"

export const machineConfig: MachineConfig = {
  id: "wallet-copy",
  initial: "copy",
  states: {
    copy: {
      on: {
        VIEW_WALLET: "wallets",
      },
    },
    wallets: {
      id: "wallets",
      initial: "wallets",
      states: {
        wallets: {
          on: {
            VIEW_WALLET: "wallet",
          },
        },
        wallet: {
          on: {
            BACK: "wallets",
          },
        },
      },
    },
  },
}

const command: SlashCommand = {
  name: "copy",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("copy")
      .setDescription("copy any wallet")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the address to copy")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("the chain of that address")
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("something easier for you to remember")
          .setRequired(false)
      )
  },
  run: async function (i: CommandInteraction) {
    const address = i.options.getString("address", true)
    const chain = i.options.getString("chain", false) ?? "eth"
    const alias = i.options.getString("alias", false) ?? ""

    const copytradeWalletResult = await copyWallet(
      i,
      i.user,
      address,
      chain,
      alias
    )
    const reply = await i.editReply(copytradeWalletResult)

    route(reply as Message, i.user, machineConfig)
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
