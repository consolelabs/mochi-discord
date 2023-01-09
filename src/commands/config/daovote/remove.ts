import config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: Command = {
  id: "daovote_remove",
  command: "remove",
  brief: "Remove DAO vote channel",
  category: "Config",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const { ok, log, curl } = await config.deleteProposalChannelConfig({
      id: msg.guildId || "",
    })
    if (!ok) {
      throw new APIError({ message: msg, description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Successfully remove the channel",
            description: `${getEmoji(
              "pointingright"
            )} You can create a new DAO voting channel by \`$daovote set <#channel> <chain/network> <token_contract>\``,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}daovote remove`,
          examples: `${PREFIX}daovote remove`,
        }),
      ],
    }
  },
  colorType: "Defi",
  minArguments: 2,
}

export default command
