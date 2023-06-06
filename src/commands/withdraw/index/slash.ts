import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  Modal,
  TextInputComponent,
} from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL, TokenEmojiKey } from "utils/common"
import { MachineConfig, route } from "utils/router"
import {
  confirmWithdraw,
  executeWithdraw,
  preWithdraw,
  withdraw,
  withdrawWithParams,
} from "./processor"

const machineConfig: MachineConfig = {
  id: "withdraw",
  initial: "withdraw",
  context: {
    button: {
      confirmWithdraw: async (i, type, value) => {
        const modal = new Modal()
          .setCustomId(`${type}-form`)
          .setTitle(value)
          .setComponents(
            new MessageActionRow<any>().setComponents([
              new TextInputComponent()
                .setCustomId(type)
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

        const submittedVal = submitted.fields.getTextInputValue(type)
        return confirmWithdraw(i, submittedVal)
      },
      withdraw: async (i, first, second) => {
        if (first.startsWith("custom")) {
          const [, key] = first.split("_")
          const modal = new Modal()
            .setCustomId(`${first}-form`)
            .setTitle(second)
            .setComponents(
              new MessageActionRow<any>().setComponents([
                new TextInputComponent()
                  .setCustomId(first)
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

          const submittedVal = submitted.fields.getTextInputValue(first)
          return withdraw(i, { [key]: submittedVal })
        } else if (i.customId.startsWith("continue")) {
          return withdrawWithParams(i, first, second)
        } else {
          return withdraw(i, { [first]: second })
        }
      },
      submitWithdrawal: (i) => executeWithdraw(i),
    },
    select: {
      withdraw: async (i, type) =>
        await withdraw(i, { [type]: i.values[0], amount: undefined }),
    },
  },
  states: {
    confirmWithdraw: {
      on: {
        SUBMIT: "submitWithdrawal",
      },
    },
    withdraw: {
      on: {
        // straight flow
        MODAL_ENTER_ADDRESS: "confirmWithdraw",
        // interactive
        SELECT_TOKEN: "withdraw",
        INPUT_AMOUNT: "withdraw",
        MODAL_INPUT_AMOUNT: "withdraw",
        CONTINUE: "withdraw",
      },
    },
    submitWithdrawal: {},
  },
}

const run = async (interaction: CommandInteraction) => {
  const address = interaction.options.getString("address", false) ?? undefined
  const amount = interaction.options.getString("amount", false) ?? undefined
  const token = interaction.options
    .getString("token", false)
    ?.toUpperCase() as TokenEmojiKey

  const checkDM = composeEmbedMessage(null, {
    author: ["Withdraw tokens", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
    description: `${interaction.user}, a withdrawal message has been sent to you. Check your DM!`,
  })
  let msgOpts

  if (token && amount) {
    msgOpts = await withdrawWithParams(interaction, token.toUpperCase(), amount)
  } else {
    msgOpts = await preWithdraw(interaction, { token, amount, address })
  }

  const reply = await interaction.user.send(msgOpts)

  interaction.editReply({
    embeds: [checkDM],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          label: "See the DM",
          url: reply.url,
          style: "LINK",
        })
      ),
    ],
  })

  route(reply, interaction.user, machineConfig)
}
export default run
