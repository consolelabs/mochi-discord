import { MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { Command } from "types/common"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { InternalError, GuildIdNotFoundError } from "errors"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { CONFIRM_PRUNE_INACTIVE, pruneInactiveExecute } from "./processor"
import { getExitButton } from "ui/discord/button"

const command: Command = {
  id: "prune_inactive",
  command: "inactive",
  brief: "Remove users with specific inactive days",
  category: "Community",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    if (args.length < 3 || parseInt(args[2]) < 5) {
      throw new InternalError({
        msgOrInteraction: msg,
        description: "Inactive days should be a number from 5 and higher",
      })
    }
    const days = parseInt(args[2], 10)
    const pruned = await msg.guild?.members.prune({ dry: true, days: days })
    if (!pruned || pruned === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              author: ["No users to prune", getEmojiURL(emojis.REVOKE)],
              description: `No one is inactive for ${days} days, let's put down the prune stick! ${getEmoji(
                "TOUCH"
              )}`,
              color: "#FCD3C1",
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(msg, {
      title: `${getEmoji("APPROVE_GREY")} Confirm Pruning`,
      description: `You will remove **${pruned}** inactive members, do you want to continue?`,
    })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: CONFIRM_PRUNE_INACTIVE,
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
      pruneInactiveExecute(i, days)
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Users having roles won't be removed.",
          title: "Remove roleless users with specific inactive days",
          usage: `${PREFIX}prune inactive <days>`,
          examples: `${PREFIX}prune inactive 10`,
          document: `${PRUNE_GITBOOK}&action=inactive`,
        }),
      ],
    }
  },
  canRunWithoutAction: false,
  colorType: "Server",
  onlyAdministrator: true,
  minArguments: 3,
}

export default command
