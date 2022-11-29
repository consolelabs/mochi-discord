import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError, InternalError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { INVITE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleInviteAggr } from "../invite/aggregation"

const command: SlashCommand = {
  name: "aggregation",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("aggregation")
      .setDescription("Show user's aggregated invites.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription(
            "choose guild member. Example: @John"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const inviter = interaction.options.getUser("user")
    if (!inviter){
        throw new InternalError({
            message: interaction,
            description: "The argument was not a valid user",
        })
    }

    return await handleInviteAggr(interaction, interaction.guildId, inviter.id)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}invite aggregation <@user>`,
        examples: `${SLASH_PREFIX}invite aggregation @ohagi\n${SLASH_PREFIX}invite aggr @ohagi`,
        document: `${INVITE_GITBOOK}&action=aggregation`,
        footer: [`Type ${SLASH_PREFIX}help invite <action> for a specific action!`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
