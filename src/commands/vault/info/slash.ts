import config from "adapters/config"
import {
  depositDetail,
  renderListDepositAddress,
} from "commands/deposit/index/processor"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { chainTypes } from "utils/chain"
import { equalIgnoreCase } from "utils/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { runGetVaultDetail, vaultReport, vaultRounds } from "./processor"

const machineConfig: (n: string) => MachineConfig = (vaultName) => ({
  id: "vault-info",
  initial: "vaultInfo",
  context: {
    button: {
      vaultReport,
      vaultInfo: (i) => runGetVaultDetail(vaultName, i),
      vaultRounds,
    },
    select: {
      vaultInfo: (i) => runGetVaultDetail(vaultName, i),
    },
    ephemeral: {
      DEPOSIT: true,
    },
  },
  states: {
    vaultRounds: {
      on: {
        [RouterSpecialAction.BACK]: "vaultInfo",
        SELECT_ROUND: "vaultInfo",
      },
    },
    vaultReport: {
      on: {
        [RouterSpecialAction.BACK]: "vaultInfo",
      },
    },
    vaultInfo: {
      on: {
        ROUNDS: "vaultRounds",
        REPORT: "vaultReport",
        DEPOSIT: {
          target: "vaultInfo",
          actions: {
            type: "showVaultDeposit",
          },
        },
      },
    },
  },
})

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Vault info")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
          .setAutocomplete(true),
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    const data = await config.vaultList(i.guildId, true)

    const options = data
      .filter((d: any) =>
        d.name.toLowerCase().includes(focusedValue.toLowerCase()),
      )
      .map((d: any) => ({ name: d.name, value: d.name }))

    await i.respond(options)
  },
  run: async function (interaction: CommandInteraction) {
    const vaultName = interaction.options.getString("name", true)
    const { context, msgOpts } = await runGetVaultDetail(vaultName, interaction)

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, machineConfig(vaultName), {
      actions: {
        showVaultDeposit: async (_, event) => {
          if (
            !event.interaction ||
            !event.interaction.isButton() ||
            event.interaction.customId !== "deposit"
          )
            return

          const addresses = [
            {
              symbol: "ETH",
              address: context.deposit.evm,
              decimal: 18,
              chainId: 1,
              chainType: chainTypes.EVM,
              isNative: true,
            },
            {
              symbol: "SOL",
              address: context.deposit.sol,
              decimal: 18,
              chainId: 1,
              chainType: chainTypes.SOL,
              isNative: true,
            },
          ]
          const { context: ctx, msgOpts } = renderListDepositAddress({
            addresses,
          })

          const reply = (await event.interaction.editReply(msgOpts)) as Message

          route(reply, event.interaction, {
            id: "vault-deposit",
            initial: "depositList",
            context: {
              button: {
                depositList: () =>
                  Promise.resolve(renderListDepositAddress({ addresses })),
              },
              select: {
                depositDetail: async (i, _ev, ctx) => {
                  return {
                    msgOpts: await depositDetail(
                      i,
                      1,
                      ctx.addresses.find((a: any) =>
                        equalIgnoreCase(a.address, i.values.at(0)),
                      ),
                    ),
                  }
                },
              },
              ...ctx,
            },
            states: {
              depositList: {
                on: {
                  VIEW_DEPOSIT_ADDRESS: "depositDetail",
                },
              },
              depositDetail: {
                on: {
                  BACK: "depositList",
                },
              },
            },
          })
        },
      },
    })
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}vault info`,
          examples: `${SLASH_PREFIX}vault info`,
          document: `${GM_GITBOOK}&action=streak`,
        }),
      ],
    }),
  colorType: "Server",
}

export default command
