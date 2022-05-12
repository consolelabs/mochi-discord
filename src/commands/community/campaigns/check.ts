import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import community from "adapters/community"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "whitelist_check",
  command: "check",
  brief: "Whitelist Management",
  category: "Community",
  run: async (msg: Message) => {
    try {
      let description = ''
      const args = getCommandArguments(msg)
      if (args.length < 4) {
        return
      }
      if (parseInt(args[2])) {
        return
      }
      if (!args[3].startsWith("<@") || !args[2].endsWith(">")) {
        return
      }

      const campaignId = args[2]
      const userDiscordId = args[3].replace(/\D/g, "")

      const res = await community.getWhitelistWinnerInfo(userDiscordId, campaignId)

      if (!res?.discord_id) {
        description = `User <@${userDiscordId}> has not been whitelisted yet❌` 
      }
      description = `User <@${userDiscordId}> is currently whitelisted ✅`

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
          description: "Show whitelist status of a specific user",
          usage: `${PREFIX}wl check <campaign_id> @<username>`,
          examples: `${PREFIX}wl check 8 @mochi01`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
