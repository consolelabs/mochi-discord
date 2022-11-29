import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { INVITE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleInviteInfo } from "../invite/info"

const command: SlashCommand = {
  name: "info",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Show current Invite Tracker's log channel.")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await handleInviteInfo(interaction,interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}invite info`,
        examples: `${SLASH_PREFIX}invite info`,
        document: `${INVITE_GITBOOK}&action=info`,
        footer: [`Type ${SLASH_PREFIX}help invite <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
