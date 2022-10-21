import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { pruneInactiveExecute } from "../prune/inactive"

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
  const pruned = await interaction.guild.members.prune({ dry: true, days: 30 })
  if (!pruned || pruned === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No users to prune",
            description: `No one is inactive for 30 days, let's put down the prune stick`,
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
      customId: `confirm_prune_inactive`,
      style: "PRIMARY",
      label: "Confirm",
    }),
    new MessageButton({
      customId: `cancel_prune_inactive`,
      style: "SECONDARY",
      label: "Cancel",
    })
  )
  await interaction.reply({
    embeds: [embed],
    components: [actionRow],
    ephemeral: true,
  })
  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: MessageComponentTypes.BUTTON,
    idle: 60000,
  })
  collector?.on("collect", (i) => {
    pruneInactiveExecute(i)
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
