import { SlashCommandBuilder } from "@discordjs/builders"
import {
  Message,
  MessageActionRow,
  Modal,
  TextInputComponent,
} from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { MachineConfig, route } from "utils/router"
import {
  chains,
  swapStep1,
  swapStep2,
  swapStep3,
  swapStep4,
} from "./index/processor"
import swapSlash from "./index/slash"

export const machineConfig: (initial: string, context: any) => MachineConfig = (
  initial,
  context
) => ({
  id: "swap",
  initial,
  context: {
    ...context,
    modal: {
      ENTER_TOKEN: true,
    },
    button: {
      swapStep1: async (i, ev, ctx) => {
        if (ev === "CONTINUE" || ev === "GO_BACK") return swapStep1(i, ctx)
        const modal = new Modal()
          .setCustomId("enter_token")
          .setTitle("Token out")
          .setComponents(
            new MessageActionRow<any>().setComponents(
              new TextInputComponent()
                .setLabel("Symbol")
                .setCustomId("symbol")
                .setRequired(true)
                .setStyle("SHORT")
                .setPlaceholder("USDT, ETH, BTC, etc...")
            )
          )

        await i.showModal(modal)
        const submitted = await i.awaitModalSubmit({
          time: 60000,
          filter: (mi) => mi.user.id === i.user.id,
        })

        if (!submitted.deferred) {
          await submitted.deferUpdate().catch(() => null)
        }

        const value = submitted.fields.getTextInputValue("symbol")

        return swapStep1(i, { ...ctx, to: value.toUpperCase() })
      },
      swapStep2: async (i, ev, ctx) => {
        if (ev === "CONTINUE" || ev === "GO_BACK") return swapStep2(i, ctx)
        if (ev.startsWith("SELECT_AMOUNT")) {
          return swapStep2(i, {
            ...ctx,
            amountIn: `%${i.customId.split("_").at(-1)}`,
          })
        }
        const modal = new Modal()
          .setCustomId("enter_amount")
          .setTitle("Amount")
          .setComponents(
            new MessageActionRow<any>().setComponents(
              new TextInputComponent()
                .setLabel("Value")
                .setCustomId("amount")
                .setRequired(true)
                .setStyle("SHORT")
                .setPlaceholder("1000")
            )
          )

        await i.showModal(modal)
        const submitted = await i.awaitModalSubmit({
          time: 60000,
          filter: (mi) => mi.user.id === i.user.id,
        })

        if (!submitted.deferred) {
          await submitted.deferUpdate().catch(() => null)
        }

        const amountIn = submitted.fields.getTextInputValue("amount")

        return swapStep2(i, { ...ctx, amountIn })
      },
      swapStep3: (i, _ev, ctx) => swapStep3(i, ctx),
    },
    select: {
      swapStep2: (i, _ev, ctx) => {
        const balance = ctx.balances.find((b: any) => b.id === i.values[0])
        return swapStep2(i, {
          ...ctx,
          from: balance.token.symbol,
          balance,
        })
      },
      swapStep4: (i, ev, ctx) => {
        if (ev === "SELECT_CHAIN") {
          return swapStep4(i, { ...ctx, chainName: i.values[0] })
        }
        const isOffchain = i.values[0] === "offchain"
        return swapStep4(i, {
          ...ctx,
          wallet: isOffchain ? "Mochi wallet" : "Onchain wallet",
        })
      },
    },
  },
  states: {
    // select "from"
    swapStep1: {
      on: {
        SELECT_TOKEN: "swapStep2",
      },
    },
    // select/enter amount
    swapStep2: {
      on: {
        SELECT_AMOUNT_10: "swapStep2",
        SELECT_AMOUNT_25: "swapStep2",
        SELECT_AMOUNT_50: "swapStep2",
        SELECT_AMOUNT_100: "swapStep2",
        ENTER_AMOUNT: "swapStep2",
        CONTINUE: "swapStep3",
        // no token found, provide a way to go back to step 1
        GO_BACK: "swapStep1",
      },
    },
    // select chain
    swapStep3: {
      on: {
        SELECT_CHAIN: "swapStep4",
        GO_BACK: "swapStep2",
      },
    },
    // select offchain/onchain
    swapStep4: {
      on: {
        SELECT_WALLET: "swapStep4",
        SUBMIT: "offchain",
        OPEN_WEB: "onchain",
      },
    },
    offchain: {
      on: {
        SWAP: "offchainSubmit",
      },
    },
    offchainSubmit: {
      type: "final",
    },
    onchain: {
      type: "final",
    },
  },
})

const slashCmd: SlashCommand = {
  name: "swap",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("swap")
      .setDescription("Preview swap route of you tokens")
      .addStringOption((option) =>
        option
          .setName("to")
          .setDescription("the token you want to sell")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("from")
          .setDescription("the token you want to buy")
          .setRequired(false)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("the amount of token you want to sell")
          .setMinValue(0)
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("chain_name")
          .setDescription("the chain name")
          .setRequired(false)
          .setChoices([
            ...Object.values(chains).map<[string, string]>((c) => [
              c.toLowerCase(),
              c,
            ]),
          ])
      )

    return data
  },
  run: async (i) => {
    const { msgOpts, ...rest } = await swapSlash(i)

    const initial = (rest as any).initial ?? "swapStep1"
    const context = (rest as any).context ?? {}

    const reply = (await i.followUp({
      ...msgOpts,
      ephemeral: true,
      fetchReply: true,
    })) as Message

    route(reply, i.user, machineConfig(initial, context))
  },
  // run: async function (i) {
  //   const from = i.options.getString("from", true)
  //   const to = i.options.getString("to", true)
  //   const amount = i.options.getNumber("amount", true)
  //
  //   const chain_name = i.options.getString("chain_name", true)
  //   const { ok, data } = await defi.getSwapRoute({
  //     from,
  //     to,
  //     amount: String(amount),
  //     chain_name,
  //   })
  //
  //   if (!ok) {
  //     throw new InternalError({
  //       msgOrInteraction: i,
  //       description:
  //         "No route data found, we're working on adding them in the future, stay tuned.",
  //       emojiUrl: getEmojiURL(emojis.SWAP_ROUTE),
  //       color: msgColors.GRAY,
  //     })
  //   }
  //
  //   await swapSlash(
  //     i,
  //     data?.data,
  //     from.toUpperCase() as TokenEmojiKey,
  //     to.toUpperCase() as TokenEmojiKey,
  //     chain_name
  //   )
  // },
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
