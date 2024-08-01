import config from "adapters/config"
import {
  depositDetail,
  renderListDepositAddress,
} from "commands/deposit/index/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  Modal,
  TextInputComponent,
} from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { chainTypes } from "utils/chain"
import { equalIgnoreCase, getEmoji, TokenEmojiKey } from "utils/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import {
  depositStep1,
  depositStep2,
  executeTradingVaultDeposit,
  handleVaultRounds,
  runGetVaultDetail,
  vaultClaim,
  vaultReport,
} from "./processor"
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
        const { report, vaultId } = ctx
        return vaultReport(i, report, vaultId)
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
      vaultClaim: (i, _ev, ctx) => {
        const { vaultId, profileId, vaultName } = ctx
        return vaultClaim({
          vaultName,
          interaction: i,
          vaultId,
          profileId,
        })
      },
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
      TRADING_VAULT_DEPOSIT: true,
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
    vaultClaim: {},
    vaultInfo: {
      on: {
        BACK: [
          { target: "vaultList", cond: (context) => !!context.fromVaultList },
        ],
        ROUNDS: "vaultRounds",
        REPORT: "vaultReport",
        CLAIM: "vaultClaim",
        TRADING_VAULT_DEPOSIT: {
          target: "vaultInfo",
          actions: {
            type: "tradingVaultDeposit",
          },
        },
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
    const focusedValue = i.options.getFocused()
    const userProfile = await profile.getByDiscord(i.user.id)
    const [spotVaults, tradingVaults, publicVaults] = await Promise.all([
      i.guildId ? config.vaultList(i.guildId, true) : [],
      i.guildId ? mochiPay.listEarningVaults(userProfile.id, i.guildId) : [],
      await mochiPay.listGlobalEarningVault(userProfile.id),
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
      ...publicVaults
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
                explorer: "",
              },
              {
                symbol: "SOL",
                address: context.deposit.sol,
                decimal: 18,
                chainId: 1,
                chainType: chainTypes.SOL,
                isNative: true,
                explorer: "https://solscan.io",
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
                    const values = i.values.map((v) => v.split(".")[1])

                    return {
                      msgOpts: await depositDetail(
                        i,
                        1,
                        ctx.addresses.find((a: any) =>
                          equalIgnoreCase(a.address, values.at(0)),
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
          tradingVaultDeposit: async (_, event) => {
            const i = event.interaction as ButtonInteraction
            const { msgOpts, context: ctx } = await depositStep1(i, context)
            const reply = (await i.editReply(msgOpts)) as Message

            route(reply, i, {
              id: "tradingvaultdeposit",
              initial: "depositStep1",
              context: {
                modal: {
                  ENTER_AMOUNT: true,
                },
                ephemeral: {
                  ENTER_AMOUNT: true,
                },
                select: {
                  depositStep2: (i, _ev, ctx) =>
                    depositStep2(i, {
                      ...(ctx as any),
                      amount: ctx.depositAmount,
                      tokenSymbol: i.values[0] as TokenEmojiKey,
                    }),
                },
                button: {
                  depositStep1: (i, _ev, ctx) => depositStep1(i, ctx),
                  depositStep2: async (i, ev, ctx) => {
                    if (ev === "ENTER_AMOUNT") {
                      const modal = new Modal()
                        .setCustomId("amount-form")
                        .setTitle("Amount")
                        .setComponents(
                          new MessageActionRow<any>().setComponents([
                            new TextInputComponent()
                              .setCustomId("custom_amount")
                              .setLabel("Value")
                              .setStyle("SHORT")
                              .setRequired(true),
                          ]),
                        )

                      await i.showModal(modal)
                      const submitted = await i
                        .awaitModalSubmit({
                          time: 300000,
                          filter: (mi) => mi.user.id === i.user.id,
                        })
                        .catch(() => null)

                      if (!submitted)
                        return {
                          msgOpts: {
                            ...(i.message as Message),
                            attachments: undefined,
                          },
                        }

                      if (!submitted.deferred) {
                        await submitted.deferUpdate().catch(() => null)
                      }

                      const amount =
                        submitted.fields.getTextInputValue("custom_amount")
                      return depositStep2(i, { ...(ctx as any), amount })
                    }
                    return depositStep2(i, {
                      ...(ctx as any),
                      amount: `%${ev.split("_").at(-1)}`,
                    })
                  },
                  submit: (i, _ev, ctx) => executeTradingVaultDeposit(i, ctx),
                },
                ...ctx,
              },
              states: {
                depositStep1: {
                  on: {
                    SELECT_TOKEN: "depositStep2",
                  },
                },
                depositStep2: {
                  on: {
                    SELECT_AMOUNT_10: "depositStep2",
                    SELECT_AMOUNT_25: "depositStep2",
                    SELECT_AMOUNT_50: "depositStep2",
                    SELECT_AMOUNT_100: "depositStep2",
                    ENTER_AMOUNT: "depositStep2",
                    SUBMIT: "submit",
                  },
                },
                submit: {
                  type: "final",
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
