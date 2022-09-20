import config from "adapters/config"
import { Guild, Message, User } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function handle(guild: Guild, user: User) {
  const res = await config.removeVoteChannel(guild.id)

  if (!res.ok) {
    throw new APIError({ curl: res.curl, description: res.log, user, guild })
  }
}

const command: Command = {
  id: "vote_remove",
  command: "remove",
  brief: "Remove the configured vote channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    await handle(msg.guild, msg.author)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Successfully removed!",
            description: `No voting channel configured for this guild.\nSet one with \`${PREFIX}vote set <channel>.\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}vote remove`,
        examples: `${PREFIX}vote remove`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
