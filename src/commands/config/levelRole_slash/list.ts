import config from "adapters/config"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { emojis, getEmojiURL } from "utils/common"
import { list } from "../levelRole/list"
import { APIError } from "errors"

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
        curl: res.curl,
        description: res.log,
      })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: ["Level role list", getEmojiURL(emojis.BADGE2)],
            description: list(res),
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
