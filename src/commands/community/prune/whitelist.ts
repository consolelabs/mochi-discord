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
  if (roles.length === 0) {
    return composeEmbedMessage(null, {
      title: "Prune Safelisted Roles",
      description: `You haven't added any role to the safelist. Run \`$prune safelist @role\` to exclude a role when running \`$prune without\`.\n\n_Note: When pruning users in Server Settings, these roles are not protected!_ :cry:`,
    })
  }

  let roleStr = ""
  roles.forEach((role) => {
    roleStr += `<@&${role.id}> `
  })

  return composeEmbedMessage(null, {
    title: "Prune Safelisted Roles",
    description: `Roles are excluded when running \`${PREFIX}prune without\`: ${roleStr}\nRun \`${PREFIX}prune safelist @role\` to add role in safelist.\n\n_Note: When pruning users in Server Settings, these roles are not protected!_ :cry:`,
  })
}

const command: Command = {
  id: "prune_safelist",
  command: "safelist",
  brief: "Safelist a role from being pruned",
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
            description: `<@&${id}> successfully safelisted`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune safelist <role>\n${PREFIX}prune safelist`,
        examples: `${PREFIX}prune safelist\n${PREFIX}prune safelist @Mochi`,
        includeCommandsList: true,
        document: `${PRUNE_GITBOOK}&action=whitelist`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
