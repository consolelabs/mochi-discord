import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PAY_LINK_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { run } from "./processor"
import { TokenEmojiKey } from "utils/common"

const slashCmd: SlashCommand = {
  name: "link",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("link")
      .setDescription("Pay others through a link")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount to pay")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("Token to pay with")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Message to include with the payment")
          .setRequired(false)
      )
  },
  run: (interaction) => {
    const amount = interaction.options.getNumber("amount", true)
    const token = interaction.options.getString("token", true)
    const message = interaction.options.getString("message") ?? undefined
    return run({
      msgOrInteraction: interaction,
      amount,
      token: token.toUpperCase() as TokenEmojiKey,
      note: message,
    })
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "Payment",
        usage: `${SLASH_PREFIX}pay link <amount> <token> [message]`,
        examples: `${SLASH_PREFIX}pay link 0.1 ftm "I want to thank you for a great collaboration"`,
        document: PAY_LINK_GITBOOK,
      }),
    ],
  }),
  colorType: "Wallet",
}

export default slashCmd
