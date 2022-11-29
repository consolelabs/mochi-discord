import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError, InternalError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { INVITE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleInviteConfig } from "../invite/config"

const command: SlashCommand = {
  name: "config",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("config")
      .setDescription("Configure Invite Tracker log channel.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "the channel which you wanna set. Example: #general"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const channel = interaction.options.getChannel("channel")
    if(!channel){
        throw new InternalError({
            message: interaction,
            description: "Invalid channel. Please choose another one!",
        })
    }
    return await handleInviteConfig(interaction.guildId, channel.id)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}invite config <channel>`,
        examples: `${SLASH_PREFIX}invite config #general\n${SLASH_PREFIX}invite cfg #general`,
        document: `${INVITE_GITBOOK}&action=config`,
        footer: [`Type ${SLASH_PREFIX}help invite <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
