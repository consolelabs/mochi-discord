import {
  CommandInteraction,
  Message,
  MessageActionRow,
  Modal,
  TextInputComponent,
} from "discord.js"
import { TokenEmojiKey } from "utils/common"
import { MachineConfig, route } from "utils/router"
import {
  executeWithdraw,
  withdrawStep1,
  withdrawStep2,
  withdrawStep3,
} from "./processor"

const machineConfig: (
  initialOverride?: string,
  overrideCtx?: any
) => MachineConfig = (initial = "withdrawStep1", overrideCtx) => ({
  id: "withdraw",
  initial,
  context: {
    ...overrideCtx,
    button: {
      withdrawStep2: async (i, ev, ctx) => {
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
              ])
            )

          await i.showModal(modal)
          const submitted = await i.awaitModalSubmit({
            time: 60000,
            filter: (mi) => mi.user.id === i.user.id,
          })

          if (!submitted.deferred) {
            await submitted.deferUpdate().catch(() => null)
          }

          const amount = submitted.fields.getTextInputValue("custom_amount")
          return withdrawStep2(i, { ...ctx, amount })
        }
        return withdrawStep2(i, { ...ctx, amount: `%${ev.split("_").at(-1)}` })
      },
      withdrawStep3: async (i, ev, ctx) => {
        let address = ctx.address
        if (ev === "ENTER_ADDRESS") {
          const modal = new Modal()
            .setCustomId("address-form")
            .setTitle("Destination Address")
            .setComponents(
              new MessageActionRow<any>().setComponents([
                new TextInputComponent()
                  .setCustomId("custom_address")
                  .setLabel("Value")
                  .setStyle("SHORT")
                  .setRequired(true),
              ])
            )

          await i.showModal(modal)
          const submitted = await i.awaitModalSubmit({
            time: 60000,
            filter: (mi) => mi.user.id === i.user.id,
          })

          if (!submitted.deferred) {
            await submitted.deferUpdate().catch(() => null)
          }

          address = submitted.fields.getTextInputValue("custom_address")
        }
        return withdrawStep3(i, { ...ctx, address })
      },
      submit: (i, _ev, ctx) => executeWithdraw(i, ctx),
      cancel: () => Promise.resolve({ msgOpts: null }),
    },
    select: {
      withdrawStep3: (i, _ev, ctx) =>
        withdrawStep3(i, { ...ctx, address: i.values[0] }),
      withdrawStep2: (i, _ev, ctx) =>
        withdrawStep2(i, { ...ctx, token: i.values[0] as TokenEmojiKey }),
    },
    modal: {
      ENTER_AMOUNT: true,
      ENTER_ADDRESS: true,
    },
  },
  states: {
    withdrawStep1: {
      on: {
        SELECT_TOKEN: "withdrawStep2",
        CANCEL: "cancel",
      },
    },
    withdrawStep2: {
      on: {
        SELECT_AMOUNT_10: "withdrawStep2",
        SELECT_AMOUNT_25: "withdrawStep2",
        SELECT_AMOUNT_50: "withdrawStep2",
        SELECT_AMOUNT_100: "withdrawStep2",
        ENTER_AMOUNT: "withdrawStep2",
        CONTINUE: "withdrawStep3",
        CANCEL: "cancel",
      },
    },
    withdrawStep3: {
      on: {
        SELECT_ADDRESS: "withdrawStep3",
        ENTER_ADDRESS: "withdrawStep3",
        SUBMIT: "submit",
        CANCEL: "cancel",
      },
    },
    submit: {
      type: "final",
    },
    cancel: {
      type: "final",
    },
  },
})

const run = async (interaction: CommandInteraction) => {
  // const address = interaction.options.getString("address", false) ?? undefined
  const amount = interaction.options.getString("amount", false) ?? undefined
  const token = interaction.options
    .getString("token", false)
    ?.toUpperCase() as TokenEmojiKey

  let msgOpts
  let overrideInitialState
  let context

  if (token && amount) {
    ;({
      overrideInitialState = "withdrawStep3",
      msgOpts,
      context,
    } = await withdrawStep3(interaction, {
      token: token.toUpperCase() as TokenEmojiKey,
      amount,
    }))
  } else {
    ;({ overrideInitialState, context, msgOpts } = await withdrawStep1(
      interaction,
      token
    ))
  }

  const reply = (await interaction.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  route(reply, interaction.user, machineConfig(overrideInitialState, context))
}
export default run
