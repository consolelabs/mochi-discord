import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  Modal,
  TextInputComponent,
} from "discord.js"
import { equalIgnoreCase } from "utils/common"
import { MachineConfig, route } from "utils/router"
import * as processor from "./processor"

export const machineConfig: (
  token: string,
  amount: number,
  context: any
) => MachineConfig = (token, amount, context) => ({
  id: "deposit",
  initial: "depositList",
  context: {
    button: {
      depositList: async (i, _ev, _ctx, isModal) => {
        if (!isModal) return await processor.deposit(i, token)

        // if isModal then this is coming from /balance flow
        const modal = new Modal()
          .setTitle("What token do you want to deposit?")
          .setCustomId("deposit-token")
          .setComponents(
            new MessageActionRow<any>().addComponents(
              new TextInputComponent()
                .setCustomId("token")
                .setLabel("Token")
                .setStyle("SHORT")
                .setRequired(true)
                .setPlaceholder("ETH, BNB, USDC, etc...")
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
          return
        }

        if (!submitted.deferred) {
          await submitted.deferUpdate().catch(() => null)
        }

        const value = submitted.fields.getTextInputValue("token")

        return processor.deposit(i, value)
      },
    },
    select: {
      depositDetail: async (i, _ev, ctx) => {
        return {
          msgOpts: await processor.depositDetail(
            i,
            amount,
            ctx.addresses.find((a: any) =>
              equalIgnoreCase(a.address, i.values.at(0))
            )
          ),
        }
      },
    },
    ...context,
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

export const run = async (
  i: CommandInteraction | ButtonInteraction,
  tokenSymbol: string,
  amount: number
) => {
  const { msgOpts, context } = await processor.deposit(i, tokenSymbol)
  const reply = (await i.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  route(reply, i, machineConfig(tokenSymbol, amount, context))
}

export default run
