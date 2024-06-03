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

import { handleVaultRounds, runGetVaultDetail, vaultReport } from "./processor"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"
import { runVaultList } from "commands/vault/list/processor"

export const machineConfig: (
  id: string,
  name: string,
  context?: any,
) => MachineConfig = (id, vaultName, context) => ({
  id: "vault-info",
  initial: id,
  context: {
    button: {
      vaultReport: (i, _ev, ctx) => {
        return vaultReport(i, ctx.report)
      },
      vaultInfo: (i, _ev, ctx) => {
        const { vaultId, vaultType } = ctx
        return runGetVaultDetail({
          selectedVault: vaultName || vaultId,
          interaction: i,
          vaultType,
        })
      },
      vaultRounds: (i, _ev, ctx) => {
        const vaultId = vaultName || ctx.vaultId
        return handleVaultRounds(vaultId, i)
      },
      vaultList: (i) => runVaultList(i),
    },
    select: {
      vaultInfo: async (i, _ev, ctx) => {
        if (i.customId === "select_round") {
          const roundId = i.values[0]
          const { vaultId, vaultType } = ctx
          return runGetVaultDetail({
            selectedVault: vaultId,
            interaction: i,
            vaultType,
            roundId,
          })
        }
        const [vaultType, selectedVault] = i.values[0].startsWith("trading_")
          ? i.values[0].split("_", 2)
          : ["spot", i.values[0].split(" - ")[0]]
        return runGetVaultDetail({ selectedVault, interaction: i, vaultType })
      },
    },
    ephemeral: {
      DEPOSIT: true,
    },
    ...context,
  },
  states: {
    vaultList: {
      id: "vaultList",
      on: {
        VIEW_VAULT: "vaultInfo",
      },
    },
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
        BACK: [
          { target: "vaultList", cond: (context) => !!context.fromVaultList },
        ],
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
    // const data = await config.vaultList(i.guildId, true)
    const userProfile = await profile.getByDiscord(i.user.id)
    const [spotVaults, tradingVaults] = await Promise.all([
      config.vaultList(i.guildId, true),
      mochiPay.listEarningVaults(userProfile.id),
    ])

    const options = [
      ...spotVaults
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((d: any) => ({ name: d.name, value: `spot_${d.name}` })),
      ...tradingVaults
        .filter((v: any) =>
          v.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((v: any) => ({ name: v.name, value: `trading_${v.id}` })),
    ]

    await i.respond(options)
  },
  run: async function (interaction: CommandInteraction) {
    const param = interaction.options.getString("name", true)
    const [vaultType, selectedVault] = param.split("_")
    const { context, msgOpts } = await runGetVaultDetail({
      selectedVault,
      interaction,
      vaultType,
    })

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(
      reply,
      interaction,
      machineConfig("vaultInfo", selectedVault, context),
      {
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

            const reply = (await event.interaction.editReply(
              msgOpts,
            )) as Message

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
      },
    )
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
