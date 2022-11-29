import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { INVITE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleInviteLeaderboard } from "../invite/leaderboard"

const command: SlashCommand = {
  name: "leaderboard",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("leaderboard")
      .setDescription("Show top 10 inviters.")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await handleInviteLeaderboard(interaction,interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}invite leaderboard`,
        examples: `${SLASH_PREFIX}invite leaderboard\n${SLASH_PREFIX}invite lb`,
        document: `${INVITE_GITBOOK}&action=leaderboard`,
        footer: [`Type ${SLASH_PREFIX}help invite <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
