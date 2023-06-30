import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import config from "adapters/config"
import {
  getRoleConfigDescription,
  renderTokenRole,
  View,
} from "commands/roles/index/processor"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { SLASH_PREFIX as PREFIX, TOKEN_ROLE_GITBOOK } from "utils/constants"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all the token role setup")
  },
  run: async (i: CommandInteraction) => {
    if (!i.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const res = await config.getConfigTokenRoleList(i.guildId)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Token role", getEmojiURL(emojis.ANIMATED_COIN_2)],
            description: [
              getRoleConfigDescription(View.TokenRole),
              renderTokenRole(res.data),
            ].join("\n"),
            thumbnail: i.guild?.iconURL(),
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}role token list`,
        examples: `${PREFIX}role token list`,
        document: `${TOKEN_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
