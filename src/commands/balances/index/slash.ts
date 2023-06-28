import { CommandInteraction, GuildMember, Message } from "discord.js"
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

export const machineConfig: (
  context: any,
  member?: GuildMember
) => MachineConfig = (context, member) => ({
  id: "balance",
  initial: "balance",
  context: {
    button: {
      balance: (i, ev, ctx) =>
        renderBalances(member?.user.id ?? i.user.id, {
          ...ctx,
          showFullEarn:
            ev === "TOGGLE_SHOW_FULL_EARN"
              ? !ctx.showFullEarn
              : ctx.showFullEarn,
          interaction: i,
          address: ctx.address,
          type: ctx.type,
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
          discordId: member?.user.id ?? i.user.id,
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

        return await renderBalances(member?.user.id ?? i.user.id, {
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
          profileId: ctx.profileId,
        }),
    },
    ...context,
  },
  states: {
    balance: {
      on: {
        TOGGLE_SHOW_FULL_EARN: "balance",
        VIEW_INVEST: "invest",
        VIEW_EARN: "earn",
        UNLINK_WALLET: "walletUnlink",
        VIEW_PORTFOLIO: "balance",
        VIEW_NFT: "viewNft",
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

  route(reply, i, machineConfig(context, i.member as GuildMember))
}
export default run
