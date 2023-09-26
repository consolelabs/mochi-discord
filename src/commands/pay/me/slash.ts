import { TokenEmojiKey } from "utils/common"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  PAY_ME_GITBOOK,
  SLASH_PREFIX as PREFIX,
  SPACES_REGEX,
} from "utils/constants"
import { parsePaymeArgs, run } from "./processor"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const slashCmd: SlashCommand = {
  name: "me",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("me")
      .setDescription("Request others to make a payment")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount of token")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("Token to pay")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("Target to pay")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("note")
          .setDescription("Note for the payment")
          .setRequired(false),
      )
  },
  run: async (interaction: CommandInteraction) => {
    const validatedPayload = await parsePaymeArgs(interaction)

    await run({
      msgOrInteraction: interaction,
      targets: validatedPayload.targets,
      token: validatedPayload.token.toUpperCase() as TokenEmojiKey,
      amount: validatedPayload.amount,
      note: validatedPayload.note,
      moniker: validatedPayload.moniker,
      original_amount: validatedPayload.originalAmount,
    })
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "Payment",
        usage: `${PREFIX}pay me <amount> <token> [message]\n${PREFIX}pay me [username] <amount> <token> [message]`,
        examples: `${PREFIX}pay me 0.1 ftm "I want to thank you for a great collaboration"`,
        document: PAY_ME_GITBOOK,
      }),
    ],
  }),
  colorType: "Wallet",
}

export default slashCmd
