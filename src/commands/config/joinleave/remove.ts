import config from "adapters/config"
import { Message, User } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function handle(guildId: string, user: User) {
  const res = await config.removeJoinLeaveChannel(guildId)

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, user })
  }
}

const command: Command = {
  id: "joinleave_remove",
  command: "remove",
  brief: "Remove the configured joinleave channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    await handle(msg.guildId, msg.author)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully removed!",
            description: `No joinleave channel configured for this guild.\nSet one with \`${PREFIX}joinleave set <channel>.\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}joinleave remove`,
        examples: `${PREFIX}joinleave remove`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
