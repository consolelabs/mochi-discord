import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"
import {
  BalanceType,
  BalanceView,
  getBalanceTokens,
  renderBalances,
  unlinkWallet,
  renderInitialNftView,
  renderSelectedNft,
} from "./processor"
import { renderInvestHome } from "commands/invest/index/processor"
import { EarnView, run as renderEarnHome } from "commands/earn/index/processor"
import { machineConfig as earnMachineConfig } from "commands/earn/index"
import { machineConfig as investMachineConfig } from "commands/invest/index"
import { followWallet } from "commands/wallet/follow/processor"
import { trackWallet } from "commands/wallet/track/processor"
import { copyWallet } from "commands/wallet/copy/processor"
import { untrackWallet } from "commands/wallet/untrack/processor"

export const machineConfig: (
  context: any,
  discordId?: string
) => MachineConfig = (context, discordId) => ({
  id: "balance",
  initial: "balance",
  context: {
    page: 0,
    button: {
      walletFollow: (i, _ev, ctx) =>
        followWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletTrack: (i, _ev, ctx) =>
        trackWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletCopy: (i, _ev, ctx) =>
        copyWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletUntrack: (i, _ev, ctx) => untrackWallet(i, i.user, ctx.address),
      balance: (i, ev, ctx) =>
        renderBalances(discordId ?? i.user.id, {
          ...ctx,
          showFullEarn:
            ev === "TOGGLE_SHOW_FULL_EARN"
              ? !ctx.showFullEarn
              : ctx.showFullEarn,
          interaction: i,
          address: ctx.address,
          type: ctx.type,
          page: ctx.page,
          balances: ctx.balances,
          txns: ctx.txns,
        }),
      invest: async (i) => {
        const tokens = await getBalanceTokens(i)
        return renderInvestHome(i, 0, tokens)
      },
      earn: (i) => {
        return renderEarnHome(i.user, EarnView.Airdrop)
      },
      walletUnlink: (i, _ev, ctx) => {
        return unlinkWallet(i, i.user, ctx.address)
      },
      viewNft: (i, _ev, ctx) =>
        renderInitialNftView({
          discordId: discordId ?? i.user.id,
          ...ctx,
          interaction: i,
          address: ctx.address,
          type: ctx.type,
        }),
    },
    select: {
      balance: async (i, _ev, ctx) => {
        const [, type, address = ""] = i.values[0].split("_")
        let fetcherType = ctx.type ?? BalanceType.Offchain
        if (type.startsWith("mochi")) fetcherType = BalanceType.Offchain
        if (type.startsWith("onchain")) fetcherType = BalanceType.Onchain
        if (type.startsWith("cex")) fetcherType = BalanceType.Cex

        return await renderBalances(discordId ?? i.user.id, {
          interaction: i,
          type: fetcherType,
          address,
        })
      },
      selectNft: (i, _ev, ctx) =>
        renderSelectedNft({
          address: ctx.address,
          type: ctx.type,
          collection: i.values[0],
          nfts: ctx.nfts || [],
        }),
    },
    ...context,
  },
  states: {
    walletFollow: {
      on: {
        BACK: "balance",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
      },
    },
    walletTrack: {
      on: {
        BACK: "balance",
        FOLLOW_WALLET: "walletFollow",
        COPY_WALLET: "walletCopy",
      },
    },
    walletCopy: {
      on: {
        BACK: "balance",
        TRACK_WALLET: "walletTrack",
        FOLLOW_WALLET: "walletFollow",
      },
    },
    balance: {
      on: {
        TOGGLE_SHOW_FULL_EARN: "balance",
        VIEW_INVEST: "invest",
        VIEW_EARN: "earn",
        UNLINK_WALLET: "walletUnlink",
        VIEW_PORTFOLIO: "balance",
        VIEW_NFT: "viewNft",
        FOLLOW_WALLET: "walletFollow",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        [RouterSpecialAction.NEXT_PAGE]: "balance",
        [RouterSpecialAction.PREV_PAGE]: "balance",
      },
    },
    invest: {
      on: {
        [RouterSpecialAction.BACK]: "balance",
      },
      ...investMachineConfig,
    },
    earn: {
      on: {
        [RouterSpecialAction.BACK]: "balance",
      },
      ...earnMachineConfig,
    },
    walletUnlink: {
      type: "final",
    },
    viewNft: {
      on: {
        BACK: "balance",
        VIEW_PORTFOLIO: "balance",
        SELECT_NFT: "selectNft",
      },
    },
    selectNft: {
      on: {
        BACK: "viewNft",
        VIEW_PORTFOLIO: "balance",
        SELECT_NFT: "selectNft",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const view = i.options.getBoolean("expand", false)
    ? BalanceView.Expand
    : BalanceView.Compact
  const { context, msgOpts } = await renderBalances(i.user.id, {
    interaction: i,
    type: BalanceType.Offchain,
    address: "",
    view,
  })

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context, i.member?.user.id))
}
export default run
