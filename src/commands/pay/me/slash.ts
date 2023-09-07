import { TokenEmojiKey } from "utils/common"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PAY_ME_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import { preprocessTarget, run } from "./processor"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

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
          .setName("platform")
          .setDescription("Platform to pay")
          .setRequired(false)
          .addChoices([
            ["discord", "discord"],
            ["telegram", "telegram"],
            ["mail", "mail"],
          ]),
      )
      .addStringOption((option) =>
        option
          .setName("note")
          .setDescription("Note for the payment")
          .setRequired(false),
      )
  },
  run: async (interaction) => {
    const amount = interaction.options.getNumber("amount", true)
    const token = interaction.options.getString("token", true)
    const target = interaction.options.getString("target") ?? undefined
    const hasTarget = !!target
    const platform = interaction.options.getString("platform") ?? undefined
    const note = interaction.options.getString("note") ?? undefined
    const processedTarget = preprocessTarget(interaction, target, platform)

    await run({
      msgOrInteraction: interaction,
      amount: amount,
      token: token.toUpperCase() as TokenEmojiKey,
      hasTarget,
      target: processedTarget,
      platform,
      note,
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
