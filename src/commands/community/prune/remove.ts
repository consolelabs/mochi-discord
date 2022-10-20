import config from "adapters/config"
import { Guild, Message, User } from "discord.js"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function deleteWhitelist(roleId: string, guild: Guild, user: User) {
  const res = await config.removeExcludedRole(roleId, guild.id)
  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, guild, user })
  }
}

const command: Command = {
  id: "prune_remove",
  command: "remove",
  brief: "Remove a whitelisted role",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isRole, value: id } = parseDiscordToken(args[2])
    if (!isRole) {
      throw new CommandError({
        message: msg,
        description: "The argument is not a role",
      })
    }

    await deleteWhitelist(id, msg.guild, msg.author)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully removed!",
            description: `<@&${id}> is no longer whitelisted.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune remove <role>`,
        examples: `${PREFIX}prune remove @Mochi`,
        includeCommandsList: true,
        document: `${PRUNE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
  minArguments: 3,
}

export default command
