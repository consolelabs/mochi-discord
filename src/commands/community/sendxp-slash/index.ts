import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { handleSendXp } from "../sendxp"

const command: SlashCommand = {
  name: "sendxp",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("sendxp")
      .setDescription("Send XP to members")
      .addStringOption((option) =>
        option
          .setName("recipients")
          .setDescription("users or roles Example: @John")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of xp to send. Example: 10")
          .setRequired(true)
          .setMinValue(1)
      )
      .addBooleanOption((option) =>
        option
          .setName("each")
          .setDescription(
            "true if amount is for each recipients, false if amount is divided equally"
          )
          .setRequired(false)
      )
      .setDefaultPermission(false)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    const targets = interaction.options.getString("recipients")
    const amount = interaction.options.getNumber("amount")
    const each = interaction.options.getBoolean("each") ?? false
    if (!targets || !amount) {
      throw new InternalError({
        message: interaction,
        title: "Invalid arguments",
      })
    }

    return handleSendXp(interaction, targets, amount, each)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "Send XP to members",
        usage: `${SLASH_PREFIX}sendXP <recipient(s)> <amount> [each]`,
        description: `You can send to recipients by:\n${getEmoji(
          "POINTINGRIGHT"
        )} Username(s): \`@tom\`, \`@john\`\n${getEmoji(
          "POINTINGRIGHT"
        )} Role(s): \`@dev\`, \`@staff\``,
        examples: `${SLASH_PREFIX}sendXP @john 5\n${SLASH_PREFIX}sendXP @staff 5 XP`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
