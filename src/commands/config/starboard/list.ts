import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"

const command: Command = {
  id: "starboard_list",
  command: "list",
  brief: "List all active starboard configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    let description = ""
    const res = await config.listAllRepostReactionConfigs(msg.guild.id)

    if (res?.data?.length > 0) {
      const { data } = res
      description = data
        .map(
          (conf: RepostReactionRequest) =>
            `\n+ Receive **${conf.quantity}** ${conf.emoji} will be reposted to <#${conf.repost_channel_id}>`
        )
        .join("")
    } else {
      description = "Failed to get reaction role configurations"
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description,
            title: "Starboard Configuration",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb list`,
          examples: `${PREFIX}sb list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
