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
import { executeSwap, swapStep1, swapStep2 } from "./index/processor"
import swapSlash from "./index/slash"

export const machineConfig: (initial: string, context: any) => MachineConfig = (
  initial,
  context
) => ({
  id: "swap",
  initial,
  context: {
    ...context,
    button: {
      swapStep1: (i, _ev, ctx) => swapStep1(i, ctx),
      swapStep2: async (i, ev, ctx, isModal) => {
        if (isModal) {
          const modal = new Modal()
            .setTitle("Amount")
            .setCustomId("amount-form")
            .setComponents(
              new MessageActionRow<any>().addComponents(
                new TextInputComponent()
                  .setCustomId("amount")
                  .setLabel("Value")
                  .setStyle("SHORT")
                  .setRequired(true)
                  .setPlaceholder("10, 100, 50%, all, etc...")
              )
            )

          await i.showModal(modal)
          const submitted = await i
            .awaitModalSubmit({
              time: 300000,
              filter: (mi) => mi.user.id === i.user.id,
            })
            .catch(() => null)

          if (!submitted) {
            return swapStep2(i, ctx)
          }

          if (!submitted.deferred) {
            await submitted.deferUpdate().then(() => null)
          }

          const value = submitted.fields.getTextInputValue("amount")

          return swapStep2(i, { ...ctx, amountIn: value })
        }
        return swapStep2(i, {
          ...ctx,
          amountIn: `%${ev.split("_").at(-1)}`,
        })
      },
      swapOffchain: (i, _ev, ctx) => executeSwap(i, ctx),
    },
    select: {
      swapStep2: (i, _ev, ctx) => {
        const [id, type] = i.values.at(0)!.split("/")
        const isOnchain = type === "onchain"
        const balance = ctx.balances.find((b: any) => b.id === id)
        return swapStep2(i, {
          ...ctx,
          wallet: isOnchain ? "Onchain wallet" : "Mochi wallet",
          balance,
          from: isOnchain ? "XXX" : balance.token.symbol,
          isOnchain,
        })
      },
    },
    modal: {
      ENTER_AMOUNT: true,
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
        CONFIRM: "swapOffchain",
      },
    },
    noTradeRouteFound: { type: "final" },
    swapOffchain: {
      type: "final",
    },
    swapOnchain: {
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

    route(reply, i, machineConfig(initial, context))
  },
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
