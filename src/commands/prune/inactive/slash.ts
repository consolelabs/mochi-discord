import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
  CommandInteraction,
  Constants,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { SlashCommand } from "types/common"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { PRUNE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "ui/discord/embed"
import { CONFIRM_PRUNE_INACTIVE, pruneInactiveExecute } from "./processor"
import { getExitButton } from "ui/discord/button"

const command: SlashCommand = {
  name: "inactive",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("inactive")
      .setDescription("Prune all inactive users")
      .addIntegerOption((option) =>
        option
          .setName("day")
          .setDescription(
            "specific inactive days, must be between 5 and 30. Example: 7"
          )
          .setMinValue(5)
          .setMaxValue(30)
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
    const days = interaction.options.getInteger("day")
    if (!days) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Inactive days should be a number from 5 and higher",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
    const pruned = await interaction.guild.members.prune({
      dry: true,
      days: days,
    })
    if (!pruned || pruned === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              author: ["No users to prune", getEmojiURL(emojis.REVOKE)],
              description: `No one is inactive for ${days} days, let's put down the prune stick! ${getEmoji(
                "TOUCH"
              )}`,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("APPROVE_GREY")} Confirm Pruning`,
      description: `You will remove **${pruned}** inactive members, do you want to continue?`,
    })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: CONFIRM_PRUNE_INACTIVE,
        style: "SUCCESS",
        label: "Confirm",
      }),
      getExitButton(interaction.user.id)
    )
    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    })
    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: Constants.MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    collector?.on("collect", (i) => {
      pruneInactiveExecute(i, days)
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Users having roles won't be removed.",
        title: "Remove roleless users with specific inactive days",
        usage: `${SLASH_PREFIX}prune inactive <days>`,
        examples: `${SLASH_PREFIX}prune inactive 10`,
        document: `${PRUNE_GITBOOK}&action=inactive`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
