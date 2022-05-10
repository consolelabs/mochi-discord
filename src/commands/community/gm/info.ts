import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "adapters/config"

const command: Command = {
  id: "gm_info",
  command: "info",
  brief: "GM/GN Configuration",
  category: "Community",
  run: async msg => {
    try {
      const json = await config.getCurrentGmConfig(msg.guildId)
      if (json.message === 'OK') {
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                description: `Current Gm/Gn channel is set to <#${json.data.channel_id}>`,
                title: "GM/GN Configuration"
              })
            ]
          }
        }
      }
    } catch (err: any) {
      logger.error(err)
    }
  },
  getHelpMessage: async msg => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Show current gm/gn configuration",
          usage: `${PREFIX}gm info`,
          examples: `${PREFIX}gm info`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
