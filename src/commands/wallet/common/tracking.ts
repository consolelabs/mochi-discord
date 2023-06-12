import { MachineConfig } from "utils/router"
import { copyWallet } from "../copy/processor"
import { followWallet } from "../follow/processor"
import { untrackWallet } from "../remove/processor"
import { trackWallet } from "../track/processor"

export const machineConfig: (id: string, context?: any) => MachineConfig = (
  id,
  context
) => ({
  id,
  initial: id,
  context: {
    button: {
      walletFollow: (i, _ev, ctx) =>
        followWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletTrack: (i, _ev, ctx) =>
        trackWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletCopy: (i, _ev, ctx) =>
        copyWallet(i, i.user, ctx.address, ctx.chain, ctx.alias),
      walletUntrack: (i, _ev, ctx) => untrackWallet(i, i.user, ctx.address),
    },
    ...context,
  },
  states: {
    walletFollow: {
      on: {
        VIEW_WALLET: "wallets",
        TRACK_WALLET: "walletTrack",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletTrack: {
      on: {
        VIEW_WALLET: "wallets",
        FOLLOW_WALLET: "walletFollow",
        COPY_WALLET: "walletCopy",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletCopy: {
      on: {
        VIEW_WALLET: "wallets",
        TRACK_WALLET: "walletTrack",
        FOLLOW_WALLET: "walletFollow",
        UNTRACK_WALLET: "walletUntrack",
      },
    },
    walletUntrack: {
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
})
