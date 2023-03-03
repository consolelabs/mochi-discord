import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError } from "errors"
import { SlashCommand } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { list } from "../processor"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Get server's nftroles configuration")
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

    const res = await Config.getGuildNFTRoleConfigs(interaction.guildId)
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
            author: [title, getEmojiURL(emojis.NFTS)],
            description,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}nftrole list`,
        examples: `${PREFIX}nftrole list`,
        document: `${NFT_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
