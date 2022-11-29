import {
  getErrorEmbed,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { Command } from "types/common"
import { parseDiscordToken } from "utils/commands"
import { getEmoji, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import { GuildIdNotFoundError } from "errors/GuildIdNotFoundError"
import { RequestCreateTipConfigNotify } from "types/api"
import { APIError } from "errors/APIError"

const command: Command = {
  id: "transaction_track",
  command: "track",
  brief: "Set up tracker for transaction activities",
  category: "Defi",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const { isChannel, value: channelId } = parseDiscordToken(args[3])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description:
                "Invalid channel. Type #, then choose the valid one!",
            }),
          ],
        },
      }
    }

    const req: RequestCreateTipConfigNotify = {
      guild_id: msg.guildId,
      channel_id: channelId,
      token: args[2],
    }
    const { ok, error, curl, log } = await Defi.createConfigNofityTransaction(
      req
    )

    if (!ok) {
      throw new APIError({ message: msg, curl, description: log, error })
    }

    const token = args[2] == "all" ? "all tokens" : args[2]
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Succesfully tracked",
            description: `All the transactions of ${token} will be recorded in the channel <#${channelId}>. ${getEmoji(
              "tip"
            )}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Set up tracker for transaction activities",
        usage: `${PREFIX}transaction track <token> <#channel> `,
        examples: `${PREFIX}tx track ftm #general\n${PREFIX}transaction track all #general`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

export default command
