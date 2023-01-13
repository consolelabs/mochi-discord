import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { InternalError } from "errors"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { PRUNE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "discord/embed/ui"
import {
  CONFIRM_PRUNE_WITHOUT,
  getUsersWithoutRole,
  pruneRoleExecute,
} from "./processor"
import { getExitButton } from "discord/button/ui"

const command: SlashCommand = {
  name: "without",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
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
    const role = interaction.options.getRole("role")
    if (!role) {
      throw new InternalError({
        message: interaction,
        description: "Please enter a valid role",
      })
    }

    const willPrune = await getUsersWithoutRole(interaction.guild, role?.id)
    if (willPrune.size == 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: "No users to prune",
              description: `Everyone has the role ${
                role.name
              }, let's put down the prune stick ${getEmoji("TOUCH")}`,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("APPROVE_GREY")} Confirm Pruning`,
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
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Choose a role to remove users without that one",
        description:
          "Only users who have a role in the safelist won't be removed",
        usage: `${SLASH_PREFIX}prune without <role>`,
        examples: `${SLASH_PREFIX}prune without @roles`,
        document: `${PRUNE_GITBOOK}&action=without`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
