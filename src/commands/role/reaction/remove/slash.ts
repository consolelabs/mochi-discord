import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { handleRoleRemove } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a reaction role configuration")
      .addStringOption((option) =>
        option
          .setName("message_link")
          .setDescription(
            "link of message which you want to configure for role",
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("emoji")
          .setDescription("emoji which you want to configure for role")
          .setRequired(false),
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(false),
      )
  },
  run: async (interaction: CommandInteraction) => {
    const messageLink = interaction.options.getString("message_link", true)
    const role = interaction.options.getRole("role", false)
    const emoji = interaction.options.getString("emoji", false)
    const args = ["", "", messageLink, emoji ?? "", role?.id ?? ""]

    return {
      messageOptions: {
        ...(await handleRoleRemove(args, interaction)),
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `To remove a specific configuration in a message\n${PREFIX}role reaction remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}role reaction remove <message_link>`,
        examples: `${PREFIX}role reaction remove https://discord.com/channels/...4875 ✅ @Visitor\n${PREFIX}role reaction remove https://discord.com/channels/...4875`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
