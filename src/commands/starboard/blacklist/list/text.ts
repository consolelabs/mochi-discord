import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeListConfig } from "./processor"

const command: Command = {
  id: "starboard_blacklist_list",
  command: "list",
  brief: "List all channels are in blacklist that cannot bookmark",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const { ok, data, log, curl } =
      await config.getBlacklistChannelRepostConfig(msg.guild.id)
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }

    const { title, description } = composeListConfig(data)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title,
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb blacklist list`,
          examples: `${PREFIX}sb blacklist list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
