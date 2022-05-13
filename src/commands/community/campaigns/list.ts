import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import community from "adapters/community"

const command: Command = {
  id: "whitelist_list",
  command: "list",
  brief: "Whitelist Management",
  category: "Community",
  run: async (msg: Message) => {
    try {
      let description = ''
      const res = await community.getAllRunningWhitelistCampaigns(msg.guild.id)

      if (!res.length) {
        return
      }
      description = "**List all running whitelist campaigns:**\n\n" + res.map((c: any) => `+ [id: ${c.role_id}] **${c.name}**`).join("\n") + "\n"

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
          description: "List all active whitelist campaigns",
          usage: `${PREFIX}wl list`,
          examples: `${PREFIX}wl list`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
