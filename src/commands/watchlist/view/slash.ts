import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeWatchlist, WatchListViewType } from "./processor"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route } from "utils/router"

export const machineConfig: MachineConfig = {
  id: "watchlist",
  initial: "watchlist",
  states: {
    watchlist: {
      on: {
        VIEW_TOKEN: "token",
        VIEW_NFT: "nft",
        VIEW_WALLETS: "wallets",
      },
    },
    token: {},
    nft: {},
    wallets: {
      id: "wallets",
      on: {
        BACK: "watchlist",
      },
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
  name: "wlv",
  category: "Defi",
  prepare: (alias = "view") => {
    return new SlashCommandSubcommandBuilder()
      .setName(alias)
      .setDescription("View your watchlist")
  },
  run: async function (i: CommandInteraction) {
    const messageOptions = await composeWatchlist(
      i.user,
      0,
      WatchListViewType.TOKEN
    )
    const reply = (await i.editReply(messageOptions)) as Message

    route(reply, i.user, machineConfig)
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
