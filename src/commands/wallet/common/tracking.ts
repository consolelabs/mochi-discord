import { machineConfig as balanceMachineConfig } from "commands/balances/index/slash"
import { render as renderTrackingWallets } from "commands/wallet/list/processor"
import { MachineConfig } from "utils/router"

import { copyWallet } from "../copy/processor"
import { followWallet } from "../follow/processor"
import { trackWallet } from "../track/processor"
import { untrackWallet } from "../untrack/processor"

export const machineConfig: (id: string, context?: any) => MachineConfig = (
  id,
  context,
) => ({
  id,
  initial: id,
  context: {
    button: {
      walletFollow: (i, _ev, ctx) =>
        followWallet(i, i.user, ctx.address, ctx.alias),
      walletTrack: (i, _ev, ctx) =>
        trackWallet(i, i.user, ctx.address, ctx.alias),
      walletCopy: (i, _ev, ctx) =>
        copyWallet(i, i.user, ctx.address, ctx.alias),
      walletUntrack: (i, _ev, ctx) => untrackWallet(i, i.user, ctx.address),
      wallets: (i) => renderTrackingWallets(i.user),
    },
    ...context,
  },
  states: {
    walletFollow: {
      on: {
        VIEW_WALLETS: "wallets",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletTrack: {
      on: {
        VIEW_WALLETS: "wallets",
        FOLLOW_WALLET: "walletFollow",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletCopy: {
      on: {
        VIEW_WALLETS: "wallets",
        TRACK_WALLET: "walletTrack",
        FOLLOW_WALLET: "walletFollow",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletUntrack: {
      on: {
        VIEW_WALLETS: "wallets",
      },
    },
    wallet: {
      on: {
        BACK: [
          { target: "wallets", cond: (context) => !!context.isFromWalletList },
        ],
        FOLLOW_WALLET: "walletFollow",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
      },
      ...balanceMachineConfig({}),
    },
    wallets: {
      id: "wallets",
      on: {
        VIEW_WALLET: "wallet",
      },
    },
  },
})
