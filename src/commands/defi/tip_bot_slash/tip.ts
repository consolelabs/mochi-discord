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
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("message when tip recipients")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const users = interaction.options.getString("users")?.trimEnd()
    const amount = interaction.options.getNumber("amount")
    const token = interaction.options.getString("token")
    const isEach = interaction.options.getBoolean("each") ?? false
    const message = interaction.options.getString("message")

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
    let args = users.split(" ")
    let fullCmd = `/tip ${users} ${amount} ${token}`
    args.push(amount.toString(), token)
    if (isEach) args.push("each")
    if (message) {
      fullCmd += ` "${message}"`
      args = args.concat(`"${message}"`.split(" "))
    }
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
        usage: `${SLASH_PREFIX}tip <recipient(s)> <amount> <token> [each]\n${SLASH_PREFIX}tip <recipient(s)> <amount> <token> [each] ["message"]`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value:
            "👉 Username(s): `@minh`, `@tom`\n👉 Role(s): `@Staff`, `@Dev`\n👉 #Text_channel: `#mochi`, `#channel`\n👉 In voice channel: mention “`in voice channel`” to tip members currently in\n👉 Online status: add the active status “`online`” before mentioning recipients",
        },
        {
          name: "Tip with token:",
          value:
            "👉 Tip by the cryptocurrencies, choose one in the `$token list`.\n👉 To tip by moniker, choose one in the `$moniker list`.",
        },
        {
          name: "**Examples**",
          value: `\`\`\`${SLASH_PREFIX}tip @John 10 ftm\n${SLASH_PREFIX}tip @John @Hank all ftm\n${SLASH_PREFIX}tip @RandomRole 10 ftm\n${SLASH_PREFIX}tip @role1 @role2 1 ftm each\n${SLASH_PREFIX}tip in voice channel 1 ftm each\n${SLASH_PREFIX}tip online #mochi 1 ftm\n${SLASH_PREFIX}tip @John 1 ftm "Thank you"\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
        }
      ),
    ],
  }),
  colorType: "Defi",
}

export default command
