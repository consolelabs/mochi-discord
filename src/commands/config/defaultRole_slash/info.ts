import config from "adapters/config"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { emojis, getEmojiURL } from "utils/common"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show current default role for newcomers")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    let description =
      "No default role found, to set one, run `/defaultrole set @<role>`"
    const res = await config.getCurrentDefaultRole(interaction.guildId)
    if (res.ok) {
      if (res.data.role_id) {
        description = `When people first join your server, their base role will be <@&${res.data.role_id}>`
      }
    } else {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: res.error })],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: ["Default role", getEmojiURL(emojis.NEKO1)],
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}defaultrole info`,
        examples: `${SLASH_PREFIX}defaultrole info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
