import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "ui/discord/embed"
import { renderNftRole } from "commands/roles/index/processor"

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

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["NFT role"],
            description: renderNftRole(res.data),
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}role nft list`,
        examples: `${SLASH_PREFIX}role nft list`,
        document: `${NFT_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
