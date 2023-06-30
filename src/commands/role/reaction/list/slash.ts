import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
  getRoleConfigDescription,
  renderReactionRole,
  View,
} from "commands/roles/index/processor"
import config from "adapters/config"
import { GuildIdNotFoundError } from "errors"
import { emojis, getEmojiURL } from "utils/common"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all active reaction roles")
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}role reaction list`,
        examples: `${SLASH_PREFIX}role reaction list`,
      }),
    ],
  }),
  colorType: "Server",
  run: async (i: CommandInteraction) => {
    if (!i.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const res = await config.listAllReactionRoles(i.guildId)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Reaction role", getEmojiURL(emojis.ANIMATED_DIAMOND)],
            description: [
              getRoleConfigDescription(View.ReactionRole),
              renderReactionRole(res.data?.configs, i.guildId),
            ].join("\n"),
            thumbnail: i.guild?.iconURL(),
          }),
        ],
      },
    }
  },
}

export default command
