import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { INVITE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleInviteLink } from "../invite/link"

const command: SlashCommand = {
  name: "link",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("link")
      .setDescription("Return the first invite link you created in the server.")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await handleInviteLink(interaction, interaction.guildId, interaction.user)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}invite link`,
        examples: `${SLASH_PREFIX}invite link\n${SLASH_PREFIX}inv link`,
        document: `${INVITE_GITBOOK}&action=link`,
        footer: [`Type \`${SLASH_PREFIX}help invite <action>\` for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
