import { CommandInteraction, GuildMember, Message } from "discord.js"
import { InternalError } from "errors"
import { MachineConfig, route } from "utils/router"
import { render } from "./processor"
import { machineConfig as watchListMachineConfig } from "commands/watchlist/view/slash"
import { machineConfig as qrCodeMachineConfig } from "commands/qr/index/slash"
import { machineConfig as earnMachineConfig } from "commands/earn/index"

export const machineConfig: (...args: any[]) => MachineConfig = (member) => ({
  id: "profile",
  initial: "profile",
  context: {
    button: {
      profile: (i) => render(i, member),
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
      },
    },
    qrCodes: {
      on: {
        BACK: "profile",
      },
      ...qrCodeMachineConfig,
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
      ...watchListMachineConfig,
    },
    wallet: {
      on: {
        BACK: "profile",
      },
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
  let member = interaction.options.getMember("user")
  if (member !== null && !(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: interaction,
      description: "Couldn't get user data",
    })
  }
  member = member ?? (interaction.member as GuildMember)
  const msgOpts = await render(interaction, member)
  const reply = (await interaction.editReply(msgOpts)) as Message

  route(reply, interaction.user, machineConfig(member))
}
export default run
