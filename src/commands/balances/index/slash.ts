import { machineConfig as earnMachineConfig } from "commands/earn/index"
import { EarnView, run as renderEarnHome } from "commands/earn/index/processor"
import { machineConfig as investMachineConfig } from "commands/invest/info/slash"
import { machineConfig as depositMachineConfig } from "commands/deposit/index/slash"
import { renderInvestHome } from "commands/invest/info/processor"
import { copyWallet } from "commands/wallet/copy/processor"
import { followWallet } from "commands/wallet/follow/processor"
import { trackWallet } from "commands/wallet/track/processor"
import { untrackWallet } from "commands/wallet/untrack/processor"
import { CommandInteraction, Message } from "discord.js"
import { logger } from "logger"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

import {
  BalanceType,
  BalanceView,
  getBalanceTokens,
  renderBalances,
  renderInitialNftView,
  renderSelectedNft,
  unlinkWallet,
} from "./processor"

export const machineConfig: (
  context: any,
  discordId?: string,
) => MachineConfig = (context, discordId) => ({
  id: "balance",
  initial: "balance",
  context: {
    page: 0,
    button: {
      walletFollow: (i, _ev, ctx) =>
        followWallet(i, i.user, ctx.address, ctx.alias),
      walletTrack: (i, _ev, ctx) =>
        trackWallet(i, i.user, ctx.address, ctx.alias),
      walletCopy: (i, _ev, ctx) =>
        copyWallet(i, i.user, ctx.address, ctx.alias),
      walletUntrack: (i, _ev, ctx) => untrackWallet(i, i.user, ctx.address),
      balance: async (i, ev, ctx) => {
        let userID = discordId ?? i.user.id
        if (ctx.type === BalanceType.Onchain) {
          userID = i.user.id
        }

        return await renderBalances(userID, {
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
        })
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
        let userID = discordId ?? i.user.id

        if (type.startsWith("mochi")) fetcherType = BalanceType.Offchain
        if (type.startsWith("onchain")) {
          fetcherType = BalanceType.Onchain
          userID = i.user.id
        }
        if (type.startsWith("cex")) fetcherType = BalanceType.Cex

        return await renderBalances(userID, {
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
    modal: {
      DEPOSIT: true,
    },
  },
  states: {
    walletFollow: {
      on: {
        BACK: "balance",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        VIEW_WALLETS: "wallets",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletTrack: {
      on: {
        BACK: "balance",
        FOLLOW_WALLET: "walletFollow",
        COPY_WALLET: "walletCopy",
        VIEW_WALLETS: "wallets",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletCopy: {
      on: {
        BACK: "balance",
        TRACK_WALLET: "walletTrack",
        FOLLOW_WALLET: "walletFollow",
        VIEW_WALLETS: "wallets",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletUntrack: {
      on: {
        VIEW_WALLETS: "wallets",
      },
    },
    balance: {
      on: {
        TOGGLE_SHOW_FULL_EARN: "balance",
        VIEW_EARN: "earn",
        UNLINK_WALLET: "walletUnlink",
        VIEW_PORTFOLIO: "balance",
        VIEW_NFT: "viewNft",
        FOLLOW_WALLET: "walletFollow",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
        DEPOSIT: "deposit",
        [RouterSpecialAction.NEXT_PAGE]: "balance",
        [RouterSpecialAction.PREV_PAGE]: "balance",
      },
    },
    deposit: {
      on: {
        BACK: "balance",
        DEPOSIT: "deposit",
      },
      ...depositMachineConfig("ETH", 1, {}),
    },
    wallets: {
      id: "wallets",
      on: {
        VIEW_WALLET: "balance",
      },
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
  const balanceType = i.options.getString("type", false) || "offchain"
  let type
  if (balanceType === "cex") {
    type = BalanceType.Cex
  } else if (balanceType === "all") {
    type = BalanceType.All
  } else {
    type = BalanceType.Offchain // Default to Offchain if "all" or any other value
  }
  // Timeout-guard: /bal was hanging forever (a deferred interaction stuck on "thinking")
  // when a downstream the render awaits (RPC, Kafka, an upstream API) was slow/down. Bound
  // the whole render so it can never hang: on timeout it throws, which wrapError turns into a
  // clean error reply instead of an infinite "thinking". The phase logs pin which step stalls.
  const RENDER_TIMEOUT_MS = 15000
  const startedAt = performance.now()
  logger.info(`[/bal] render start user=${i.user.id} type=${type}`)
  const { context, msgOpts } = (await Promise.race([
    renderBalances(i.user.id, {
      interaction: i,
      type: type,
      address: "",
      view,
    }),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `[/bal] renderBalances timed out after ${RENDER_TIMEOUT_MS}ms`,
            ),
          ),
        RENDER_TIMEOUT_MS,
      ),
    ),
  ])) as Awaited<ReturnType<typeof renderBalances>>
  logger.info(
    `[/bal] render done in ${Math.round(
      performance.now() - startedAt,
    )}ms, calling editReply`,
  )

  // A minimal PATCH to the same @original route succeeds, so a stuck /bal
  // reply means Discord rejected THIS payload (embeds/components) and the
  // rejection was being swallowed silently. Log the full rejection (a 50035
  // Invalid Form Body names the offending field) plus a payload summary.
  const EDIT_REPLY_TIMEOUT_MS = 10000
  let reply: Message
  try {
    reply = (await Promise.race([
      i.editReply(msgOpts),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`[/bal] editReply timed out`)),
          EDIT_REPLY_TIMEOUT_MS,
        ),
      ),
    ])) as Message
  } catch (e: any) {
    const embed = msgOpts.embeds?.[0] as any
    logger.error(
      `[/bal] editReply failed: name=${e?.name} code=${e?.code} httpStatus=${e?.httpStatus} msg=${e?.message} | payload: desc_len=${
        embed?.description?.length ?? 0
      } fields=${embed?.fields?.length ?? 0} components=${JSON.stringify(
        (msgOpts.components ?? []).map((r: any) =>
          (r.components ?? []).map(
            (c: any) => `${c.customId}:${c.label}:${c.emoji?.id ?? c.emoji}`,
          ),
        ),
      )}`,
    )
    throw e
  }
  logger.info(`[/bal] editReply done`)

  route(reply, i, machineConfig(context, i.member?.user.id))
}
export default run
