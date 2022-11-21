import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function deleteWhitelist(roleId: string, message: Message) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message })
  }
  const res = await config.removeExcludedRole(roleId, message.guildId)
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }
}

const command: Command = {
  id: "prune_remove",
  command: "remove",
  brief: "Remove a role from the safelist",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isRole, value: id } = parseDiscordToken(args[2])
    if (!isRole) {
      throw new InternalError({
        message: msg,
        description: "The argument is not a role",
      })
    }

    await deleteWhitelist(id, msg)

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
        description: `Remove a role from the safelist`,
        document: `${PRUNE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
  minArguments: 3,
}

export default command
