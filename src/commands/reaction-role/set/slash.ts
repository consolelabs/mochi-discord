import { handleRoleSet } from "./processor"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set a new reaction role configuration")
      .addStringOption((option) =>
        option
          .setName("message_link")
          .setDescription(
            "link of message which you want to configure for role"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("emoji")
          .setDescription("emoji which you want to configure for role")
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const messageLink = interaction.options.getString("message_link", true)
    const emojiArg = interaction.options.getString("emoji", true)
    const role = interaction.options.getRole("role", true)
    const args = ["", "", messageLink, emojiArg, `<@&${role.id}>`]

    return {
      messageOptions: {
        ...(await handleRoleSet(args, interaction)),
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description:
          "Don't know where to get the message link?\n👉 _Click “More” on your messages then choose “Copy Message Link”._\n👉 _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._",
        usage: `${PREFIX}rr set <message_link> <emoji> <role>`,
        examples: `${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
