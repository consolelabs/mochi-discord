import { MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji, msgColors } from "utils/common"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  CONFIRM_PRUNE_WITHOUT,
  getUsersWithoutRole,
  pruneRoleExecute,
} from "./processor"
import { getExitButton } from "ui/discord/button"

const command: Command = {
  id: "prune_without",
  command: "without",
  brief: "Choose a role to remove users without that one",
  category: "Community",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const roleArg = getCommandArguments(msg)[2]
    const { isRole, value: id } = parseDiscordToken(roleArg)
    if (!isRole) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Command error",
        description:
          "Invalid role. Be careful not to be mistaken role with username while using `@`.",
      })
    }

    const role = msg.guild.roles.cache.get(id)
    if (!role) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Command error",
        description:
          "Invalid role. Be careful not to be mistaken role with username while using `@`.",
      })
    }

    const willPrune = await getUsersWithoutRole(msg.guild, id)
    if (willPrune.size == 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "No users to prune",
              description: `Everyone has the role ${
                role.name
              }, let's put down the prune stick ${getEmoji("TOUCH")}`,
              color: msgColors.PINK,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(msg, {
      title: `${getEmoji("APPROVE_GREY")} Confirm Pruning`,
      description: `There are **${willPrune.size}** members without role ${role.name}, do you want to continue?`,
    })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: CONFIRM_PRUNE_WITHOUT,
        style: "SUCCESS",
        label: "Confirm",
      }),
      getExitButton(msg.author.id)
    )
    const msgReply = await msg.reply({
      embeds: [embed],
      components: [actionRow],
    })
    const collector = msgReply.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    collector.on("collect", (i) => {
      pruneRoleExecute(i, willPrune, role.name)
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          title: "Choose a role to remove users without that one",
          description:
            "Only users who have a role in the safelist won't be removed",
          usage: `${PREFIX}prune without <role>`,
          examples: `${PREFIX}prune without @roles`,
          document: `${PRUNE_GITBOOK}&action=without`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
  onlyAdministrator: true,
}

export default command
