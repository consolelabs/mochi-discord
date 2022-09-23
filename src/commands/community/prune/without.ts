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
import { getExcludedRoles } from "./whitelist"

export async function pruneRoleExecute(
  i: ButtonInteraction,
  pruneList: Collection<string, GuildMember>,
  roleName: string
) {
  if (
    i.customId !== "confirm_prune_inactive" ||
    i.user.id !== "567326528216760320" //hnh
  ) {
    return
  }
  if (!i.guild) throw new GuildIdNotFoundError({})

  let count = 0
  const whitelistRole = await getExcludedRoles(i.guild)
  const whitelistIds: string[] = whitelistRole.map((r) => r.id)
  const invite = i.guild.invites.cache.first()

  pruneList.forEach(async (mem) => {
    if (
      mem.roles.cache.hasAny(...whitelistIds) ||
      mem.permissions.has("ADMINISTRATOR")
    )
      return
    await mem.send({
      content: `Sorry to say this but you haven't had a role yet, so we have to remove you from ${i.guild?.name}\nYou are welcome to join again: ${invite?.url}`,
    })
    await mem.kick(`Missing role ${roleName}`)
    count++
  })

  i.reply({
    ephemeral: true,
    embeds: [
      composeEmbedMessage(null, {
        title: "Prune successful",
        description: `You have pruned ${count} members`,
      }),
    ],
  })
}

export async function getUsersWithoutRole(guild: Guild, roleId: string) {
  const members = await guild.members.fetch()
  const membersWithoutRole = members.filter((mem) => {
    return !mem.roles.cache.has(roleId) && !mem.user.bot
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

    const roleArg = getCommandArguments(msg)[2]
    const { isRole, id } = parseDiscordToken(roleArg)
    if (!isRole) {
      throw new CommandError({
        message: msg,
        description: "Please enter a valid role",
      })
    }

    const role = msg.guild.roles.cache.get(id)
    if (!role) {
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
              description: `Everyone has the role ${role.name}, let's put down the prune stick`,
            }),
          ],
        },
      }
    }

    const embed = composeEmbedMessage(msg, {
      title: "Confirm Pruning",
      description: `There are **${willPrune.size}** members without role ${role.name}, do you want to continue?`,
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
      pruneRoleExecute(i, willPrune, role.name)
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
  minArguments: 3,
  onlyAdministrator: true,
}

export default command
