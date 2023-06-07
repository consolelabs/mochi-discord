import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { trackWallet } from "./processor"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route } from "utils/router"

export const machineConfig: MachineConfig = {
  id: "wallet-track",
  initial: "track",
  states: {
    track: {
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
  name: "track",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("track")
      .setDescription("Track any wallet")
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the address to track")
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

    const trackWalletResult = await trackWallet(
      i,
      i.user,
      address,
      chain,
      alias
    )
    const reply = await i.editReply(trackWalletResult)

    route(reply as Message, i.user, machineConfig)
  },
  help: (interaction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          thumbnail: thumbnails.TOKENS,
          title: "Show list of your favorite tokens",
          description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
          usage: `${SLASH_PREFIX}watchlist view`,
          examples: `${SLASH_PREFIX}watchlist view`,
        }),
      ],
    }),
  colorType: "Defi",
}

export default command
