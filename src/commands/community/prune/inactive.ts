import { ButtonInteraction, MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { GuildIdNotFoundError } from "errors"

export async function pruneInactiveExecute(i: ButtonInteraction) {
  if (
    i.customId !== "confirm_prune_inactive" ||
    i.user.id !== "567326528216760320" //hnh
  ) {
    return
  }
  if (!i.guild) throw new GuildIdNotFoundError({})

  const pruned = await i.guild.members.prune({
    days: 30,
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
  brief: "Remove 30-day inactive users",
  category: "Community",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const pruned = await msg.guild?.members.prune({ dry: true, days: 30 })
    if (!pruned || pruned == 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "No users to prune",
              description: `No one is inactive for 30 days, let's put down the prune stick`,
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
    const msgReply = await msg.reply({
      embeds: [embed],
      components: [actionRow],
    })
    const collector = msgReply.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    collector.on("collect", (i) => {
      pruneInactiveExecute(i)
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Remove all users that were inactive for 30 days",
          usage: `${PREFIX}prune inactive`,
          examples: `${PREFIX}prune inactive`,
          //document: gitbook,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
