import { MachineConfig } from "utils/router"

export const machineConfig: MachineConfig["states"] = {
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
}
