import { BalanceType } from "commands/balances/index/processor"
import { machineConfig as balanceMachineConfig } from "commands/balances/index/slash"
import { render as renderTrackingWallets } from "commands/wallet/list/processor"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import {
  composeWatchlist,
  WatchListTokenViewType,
  WatchListViewType,
} from "./processor"

export const machineConfig: (ctx?: any) => MachineConfig = (context = {}) => ({
  id: "watchlist",
  initial: "watchlist",
  context: {
    button: {
      watchlist: (i, _ev, ctx) => composeWatchlist(i.user, ctx.page),
      watchlistNft: (i) => composeWatchlist(i.user, 0, WatchListViewType.Nft),
      wallets: (i) => renderTrackingWallets(i.user),
    },
    ...context,
  },
  states: {
    watchlist: {
      on: {
        VIEW_NFT: "watchlistNft",
        VIEW_WALLETS: "wallets",
        [RouterSpecialAction.NEXT_PAGE]: "watchlist",
        [RouterSpecialAction.PREV_PAGE]: "watchlist",
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
          ...balanceMachineConfig({ type: BalanceType.Onchain }),
        },
      },
    },
  },
})

const command: SlashCommand = {
  name: "wlv",
  category: "Defi",
  prepare: (alias = "view") => {
    return new SlashCommandSubcommandBuilder()
      .setName(alias)
      .setDescription(
        "View your watchlist" + (alias === "wlc" ? " with charts" : ""),
      )
  },
  run: async function (i: CommandInteraction) {
    const { context, msgOpts } = await composeWatchlist(
      i.user,
      0,
      WatchListViewType.Token,
      i.commandName === "wlc"
        ? WatchListTokenViewType.Chart
        : WatchListTokenViewType.Text,
    )
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
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
