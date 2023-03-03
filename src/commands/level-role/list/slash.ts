import config from "adapters/config"
import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { emojis, getEmojiURL } from "utils/common"
import { APIError } from "errors"
import { list } from "./processor"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Get server's levelroles configuration")
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
    const res = await config.getGuildLevelRoleConfigs(interaction.guildId)

    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: interaction,
        curl: res.curl,
        description: res.log,
      })
    }

    const { title, description } = list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: [title, getEmojiURL(emojis.BADGE2)],
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Get server's levelroles configuration",
        usage: `${SLASH_PREFIX}levelrole set <role> <level>`,
        examples: `${SLASH_PREFIX}levelrole set @Mochi 1`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
