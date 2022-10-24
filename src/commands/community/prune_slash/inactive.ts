import {
  composeEmbedMessage,
  getErrorEmbed,
  getExitButton,
} from "utils/discordEmbed"
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { CONFIRM_PRUNE_INACTIVE, pruneInactiveExecute } from "../prune/inactive"

export async function pruneInactive(interaction: CommandInteraction) {
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
            title: "No users to prune",
            description: `No one is inactive for ${days} days, let's put down the prune stick`,
          }),
        ],
      },
    }
  }

  const embed = composeEmbedMessage(null, {
    title: "Confirm Pruning",
    description: `You will prune **${pruned}** inactive members, do you want to continue?`,
  })
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: CONFIRM_PRUNE_INACTIVE,
      style: "PRIMARY",
      label: "Confirm",
    }),
    getExitButton(interaction.user.id)
  )
  await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  })
  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: MessageComponentTypes.BUTTON,
    idle: 60000,
  })
  collector?.on("collect", (i) => {
    pruneInactiveExecute(i, days)
  })
}

export const inactive = new SlashCommandSubcommandBuilder()
  .setName("inactive")
  .setDescription("Prune all inactive users")
  .addIntegerOption((option) =>
    option
      .setName("day")
      .setDescription("specific inactive days, must be higher than 5")
      .setMinValue(5)
      .setRequired(true)
  )
