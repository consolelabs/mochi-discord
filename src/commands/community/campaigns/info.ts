import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import community from "adapters/community"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "whitelist_info",
  command: "info",
  brief: "Whitelist Management",
  category: "Community",
  run: async (msg: Message) => {
    try {
      let description = ''
      const args = getCommandArguments(msg)
      if (args.length < 3) {
        return
      }
      const campaignId = parseInt(args[2])
      const res = await community.getWhitelistCampaignInfo(msg.guild.id, campaignId)

      if (!res.name) {
        return
      }
      description = `Show detail information of campaign **${res.name}**:\n\n` + `[ID] ${res.role_id}\n` + `[Name] ${res.name}\n`

      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description,
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
          description: "Show detail information of a whitelist campaign",
          usage: `${PREFIX}wl info <campaign_id>`,
          examples: `${PREFIX}wl info 8`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
