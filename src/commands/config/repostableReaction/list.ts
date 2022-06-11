import { logger } from "logger"
import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"

const command: Command = {
  id: "repostreaction_list",
  command: "list",
  brief: "List all active repost reaction configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    try {
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
              title: "Repost Reaction",
            }),
          ],
        },
      }
    } catch (err) {
      logger.error(err as string)
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}rc list`,
          examples: `${PREFIX}rc list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
