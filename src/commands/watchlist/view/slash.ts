import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import {
  composeWatchlist,
  WatchListTokenViewType,
  WatchListViewType,
} from "./processor"
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
        VIEW_NFT: "watchlistNft",
        VIEW_WALLETS: "wallets",
      },
    },
    watchlistNft: {
      on: {
        VIEW_WATCHLIST: "watchlist",
        VIEW_WALLETS: "wallets",
      },
    },
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
      .setDescription(
        "View your watchlist" + (alias === "wlc" ? " with charts" : "")
      )
  },
  run: async function (i: CommandInteraction) {
    const { msgOpts } = await composeWatchlist(
      i.user,
      0,
      WatchListViewType.Token,
      i.commandName === "wlc"
        ? WatchListTokenViewType.Chart
        : WatchListTokenViewType.Text
    )
    const reply = (await i.editReply(msgOpts)) as Message

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
