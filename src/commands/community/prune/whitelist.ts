import config from "adapters/config"
import { Guild, Message, Role, User } from "discord.js"
import {
  APIError,
  BotBaseError,
  CommandError,
  GuildIdNotFoundError,
} from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function createWhitelist(roleId: string, guild: Guild, user: User) {
  const res = await config.createExcludedRole(roleId, guild.id)
  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, guild, user })
  }
}

export async function getExcludedRoles(guild: Guild): Promise<Role[]> {
  let roleIds: string[] = []
  const excludedRoles: Role[] = []
  const res = await config.getExcludedRole({ guild_id: guild.id })
  if (!res.ok) {
    throw new BotBaseError()
  }
  if (res.data) {
    roleIds = res.data.roles ?? []
  }

  roleIds.forEach(async (id) => {
    const role = await guild.roles.fetch(id)
    if (role) {
      excludedRoles.push(role)
    }
  })

  return excludedRoles
}

export async function whitelistRolesEmbed(roles: Role[]) {
  let roleStr = ""
  roles.forEach((role) => {
    roleStr += role.name + ", "
  })
  return composeEmbedMessage(null, {
    title: "Prune Whitelisted Roles",
    description: `Roles that are excluded when performing \`$prune\`: ${roleStr}`,
  })
}

const command: Command = {
  id: "prune_whitelist",
  command: "whitelist",
  brief: "Whitelist a role from being pruned",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    //$prune whitelist
    if (args.length == 2) {
      const roles = await getExcludedRoles(msg.guild)
      const embed = await whitelistRolesEmbed(roles)
      return {
        messageOptions: {
          embeds: [embed],
        },
      }
    }

    const { isRole, value: id } = parseDiscordToken(args[2])
    if (!isRole) {
      throw new CommandError({
        message: msg,
        description: "The argument is not a role",
      })
    }

    await createWhitelist(id, msg.guild, msg.author)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully set!",
            description: `<@&${id}> successfully whitelisted`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune whitelist <role>\n${PREFIX}prune whitelist`,
        examples: `${PREFIX}prune whitelist\n${PREFIX}prune whitelist @Mochi`,
        includeCommandsList: true,
        document: `${PRUNE_GITBOOK}&action=whitelist`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
