import { CommandInteraction, GuildMember, Message } from "discord.js"
import { InternalError } from "errors"
import { MachineConfig, route } from "utils/router"
import {
  render,
  sendBinanceManualMessage,
  showModalBinanceKeys,
  submitBinanceKeys,
  Target,
} from "./processor"
import { machineConfig as watchListMachineConfig } from "commands/watchlist/view/slash"
import { machineConfig as qrCodeMachineConfig } from "commands/qr/index/slash"
import { machineConfig as earnMachineConfig } from "commands/earn/index"
import { machineConfig as balanceMachineConfig } from "commands/balances/index/slash"
import { handleWalletAddition } from "commands/wallet/add/processor"
import { runGetVaultDetail } from "commands/vault/info/processor"

const machineConfig: (target: Target) => MachineConfig = (target) => ({
  id: "profile",
  initial: "profile",
  context: {
    button: {
      profile: async (i) => ({ msgOpts: await render(i, target) }),
      addWallet: (i) => handleWalletAddition(i),
    },
    select: {
      vault: async (i) => await runGetVaultDetail(i.values[0].split("_")[1], i),
    },
    // indicates this action to result in ephemeral response
    ephemeral: {
      CONNECT_BINANCE: true,
    },
  },
  states: {
    profile: {
      on: {
        VIEW_WATCHLIST: "watchlist",
        VIEW_WALLET_VAULT: [
          {
            target: "vault",
            cond: "isVault",
          },
          {
            target: "wallet",
            cond: "isWallet",
          },
        ],
        VIEW_QUESTS: "earn",
        VIEW_ADD_WALLET: "addWallet",
        VIEW_QR_CODES: "qrCodes",
        CONNECT_BINANCE: {
          target: "profile",
          actions: {
            type: "showBinanceManualMessage",
          },
        },
      },
    },
    qrCodes: {
      on: {
        BACK: "profile",
      },
      ...qrCodeMachineConfig(),
    },
    addWallet: {
      on: {
        BACK: "profile",
      },
    },
    watchlist: {
      on: {
        BACK: "profile",
      },
      ...watchListMachineConfig(),
    },
    wallet: {
      on: {
        BACK: "profile",
      },
      ...balanceMachineConfig({}, target.id),
    },
    vault: {
      on: {
        BACK: "profile",
      },
    },
    earn: {
      on: {
        BACK: "profile",
      },
      ...earnMachineConfig,
    },
  },
})

const run = async (interaction: CommandInteraction) => {
  let member = interaction.options.getMember("user") as GuildMember
  if (member !== null && member.user.bot) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Error",
      description: "Cannot view profile of bots",
    })
  }
  const target: Target = {
    username: "",
    name: "",
    avatar: "",
    id: "",
  }
  if (interaction.channel?.type === "DM") {
    target.id = interaction.user.id
    target.avatar = interaction.user.displayAvatarURL()
    target.name = interaction.user.username
    target.username = interaction.user.username
  } else {
    member = member ?? (interaction.member as GuildMember)

    target.id = member.user.id
    target.avatar = member.displayAvatarURL()
    target.username = member.user.username
    target.name = member.nickname || member.displayName || target.username
    target.roles = member.roles
  }
  const msgOpts = await render(interaction, target)
  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction, machineConfig(target), {
    actions: {
      showBinanceManualMessage: async (_, event) => {
        if (
          !event.interaction ||
          !event.interaction.isButton() ||
          event.interaction.customId !== "connect_binance"
        )
          return

        const result = sendBinanceManualMessage()

        const reply = (await event.interaction.editReply(
          result.msgOpts
        )) as Message

        route(reply, event.interaction, {
          id: "binance",
          initial: "binance",
          context: {
            ephemeral: {
              ENTER_KEY: true,
            },
            modal: {
              ENTER_KEY: true,
            },
            button: {
              binance: async (i) =>
                submitBinanceKeys(i, await showModalBinanceKeys(i)),
            },
          },
          states: {
            binance: {
              on: {
                ENTER_KEY: "binance",
              },
            },
          },
        })
      },
    },
    guards: {
      isWallet: (_ctx, ev) => {
        return ev.interaction?.values[0].startsWith("wallet")
      },
      isVault: (_ctx, ev) => {
        return ev.interaction?.values[0].startsWith("vault")
      },
    },
  })
}
export default run
