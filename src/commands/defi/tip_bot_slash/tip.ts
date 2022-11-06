import { SlashCommand } from "types/common"
import { SLASH_PREFIX, TIP_GITBOOK, DEFI_DEFAULT_FOOTER } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { handleTip } from "../tip"

const command: SlashCommand = {
  name: "tip",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("tip")
      .setDescription("Send coins to a user or a group of users")
      .addStringOption((option) =>
        option
          .setName("users")
          .setDescription("users or role you want to tip. Example: @John")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount of coins you want to send. Example: 5")
          .setMinValue(0)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: FTM")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("each")
          .setDescription(
            "true if amount is for each recipients, false if amount is divided equally"
          )
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const users = interaction.options.getString("users")?.trimEnd()
    const amount = interaction.options.getNumber("amount")
    const token = interaction.options.getString("token")
    const isEach = interaction.options.getBoolean("each") ?? false

    if (!users || !amount || !token) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Missing arguments",
            }),
          ],
        },
      }
    }
    const args = users.split(" ")
    const fullCmd = `/tip ${users} ${amount} ${token}`
    args.push(amount.toString(), token)
    if (isEach) args.push("each")
    args.unshift("tip")
    return {
      messageOptions: {
        ...(await handleTip(args, interaction.user.id, fullCmd, interaction)),
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TIP,
        usage: `- To tip a user or role:\n${SLASH_PREFIX}tip <@user> <amount> <token>\n${SLASH_PREFIX}tip <@role> <amount> <token>\n- To tip multiple users or roles\n${SLASH_PREFIX}tip <@user(s)> <amount> <token> [each]\n${SLASH_PREFIX}tip <@role(s)> <amount> <token> [each]`,
        description: "Send coins offchain to a user or a group of users",
        examples: `${SLASH_PREFIX}tip @John 10 ftm\n${SLASH_PREFIX}tip @John all ftm\n${SLASH_PREFIX}tip @John @Hank 10 ftm\n${SLASH_PREFIX}tip @John @Hank 10 ftm each\n${SLASH_PREFIX}tip @RandomRole 10 ftm\n${SLASH_PREFIX}tip @role1 @role2 10 ftm\n${SLASH_PREFIX}tip @role1 @role2 1 ftm each`,
        document: TIP_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
