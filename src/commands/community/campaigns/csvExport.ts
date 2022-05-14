import { logger } from "logger"
import { Command } from "types/common"
import { API_BASE_URL, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "whitelist_report",
  command: "report",
  brief: "Generate a link to download list whitelist winners of a specific campaign (.csv file)",
  category: "Community",
  run: async msg => {
    try {
      const args = getCommandArguments(msg)
      if (args.length < 3) {
        return
      }
      const campaignId = parseInt(args[2])
      if (!campaignId) {
        return
      }
      const downloadLink = `${API_BASE_URL}/whitelist-campaigns/users/csv?campaign_id=${campaignId}`
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description: `**Whitelist Winners Sheet is now available!**\n\nYou can get it [__**HERE**__](${downloadLink}) (.CSV File)`,
              thumbnail: msg.guild.iconURL()
            })
          ]
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
          usage: `${PREFIX}wl report <campaign_id>`,
          examples: `${PREFIX}wl report 8`,
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
