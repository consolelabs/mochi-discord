import { ButtonInteraction, MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { Command } from "types/common"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getExitButton } from "utils/discordEmbed"
import { CommandError, GuildIdNotFoundError } from "errors"
import { getCommandArguments } from "utils/commands"

export const CONFIRM_PRUNE_INACTIVE = "confirm_prune_inactive"

export async function pruneInactiveExecute(i: ButtonInteraction, days: number) {
  if (
    i.customId !== CONFIRM_PRUNE_INACTIVE ||
    (i.user.id !== "567326528216760320" && //hnh
      i.user.id !== "463379262620041226") //hollow
  ) {
    return
  }
  if (!i.guild) throw new GuildIdNotFoundError({})

  const pruned = await i.guild.members.prune({
    days: days,
    reason: `Inactive User`,
  })

  await i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: "Prune successful",
        description: `You have pruned ${pruned} members`,
      }),
    ],
  })
}

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
      throw new CommandError({
        message: msg,
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
              title: "No users to prune",
              description: `No one is inactive for ${days} days, let's put down the prune stick`,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(msg, {
      title: "Confirm Pruning",
      description: `You will prune **${pruned}** inactive members, do you want to continue?`,
    })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: CONFIRM_PRUNE_INACTIVE,
        style: "PRIMARY",
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
