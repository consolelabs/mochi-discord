import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

function composeListConfig(data: any) {
  if (!data || data?.length === 0) {
    return {
      title: "No starboard blacklists found",
      description: `You haven't configured any starboard blacklist channels.\n\n${defaultEmojis.POINT_RIGHT} To set a new one, run \`\`\`$sb blacklist set <channel>\`\`\``,
    }
  }
  return {
    title: "Starboard Blacklist Channel Configuration",
    description: data
      ?.map((item: any, idx: number) => `**${idx + 1}.** <#${item.channel_id}>`)
      .join("\n"),
  }
}

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
