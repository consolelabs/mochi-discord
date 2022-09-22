import {
  ButtonInteraction,
  Collection,
  Guild,
  GuildMember,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function pruneRoleExecute(
  i: ButtonInteraction,
  pruneList: Collection<string, GuildMember>
) {
  if (
    i.customId !== "confirm_prune_inactive" ||
    i.user.id !== "567326528216760320" //hnh
  ) {
    return
  }
  const invite = i.guild?.invites.cache.first()
  pruneList.forEach(async (mem) => {
    await mem.kick("Missing role")
    await mem.send({
      content: `Sorry to say this but you haven't had a role yet, so we have to remove you from ${i.guild?.name}\nYou are welcome to join again: ${invite?.url}`,
    })
  })
  await i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: "Prune successful",
        description: `You have pruned ${pruneList.size} members`,
      }),
    ],
  })
}

export async function getUsersWithoutRole(guild: Guild, roleId: string) {
  const members = await guild.members.fetch()
  const membersWithoutRole = members.filter((mem) => {
    return !mem.roles.cache.has(roleId)
  })
  return membersWithoutRole
}

const command: Command = {
  id: "prune_without",
  command: "without",
  brief: "Remove users without a specific role",
  category: "Community",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const role = getCommandArguments(msg)[2]
    const { isRole, id } = parseDiscordToken(role)
    if (!isRole) {
      throw new CommandError({
        message: msg,
        description: "Please enter a valid role",
      })
    }
    const willPrune = await getUsersWithoutRole(msg.guild, id)
    if (willPrune.size == 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "No users to prune",
              description: `Everyone has the role ${role}, let's put down the prune stick`,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(msg, {
      title: "Confirm Pruning",
      description: `You will prune **${willPrune.size}** members without role ${role}, do you want to continue?`,
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
      pruneRoleExecute(i, willPrune)
    })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Remove all users without a specific role",
          usage: `${PREFIX}prune without <role>`,
          examples: `${PREFIX}prune without @roles`,
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
