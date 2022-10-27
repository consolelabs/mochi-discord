import {
  composeEmbedMessage,
  getErrorEmbed,
  getExitButton,
} from "utils/discordEmbed"
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageComponentTypes } from "discord.js/typings/enums"
import {
  CONFIRM_PRUNE_WITHOUT,
  getUsersWithoutRole,
  pruneRoleExecute,
} from "../prune/without"
import { CommandError } from "errors"

export async function pruneWithoutRole(interaction: CommandInteraction) {
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
  const role = interaction.options.getRole("role")
  if (!role) {
    throw new CommandError({ description: "Please enter a valid role" })
  }

  const willPrune = await getUsersWithoutRole(interaction.guild, role?.id)
  if (willPrune.size == 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No users to prune",
            description: `Everyone has the role ${role}, let's put down the prune stick`,
          }),
        ],
      },
    }
  }

  const embed = composeEmbedMessage(null, {
    title: "Confirm Pruning",
    description: `You will prune **${willPrune.size}** members without role ${role}, do you want to continue?`,
  })
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: CONFIRM_PRUNE_WITHOUT,
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
    pruneRoleExecute(i, willPrune, role.name)
  })
}

export const without = new SlashCommandSubcommandBuilder()
  .setName("without")
  .setDescription("Choose a role to remove users who don't have that one")
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription(
        "Users without this role will be pruned. Example: @default"
      )
      .setRequired(true)
  )
