import { logger } from "logger"
import { CampaignWhitelistUser, Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { ColorResolvable, Message, MessageEmbed } from "discord.js"
import { msgColors } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { BotBaseError } from "errors"
import community from "adapters/community"

const command: Command = {
  id: "whitelist_add",
  command: "add",
  brief: "Add multiple users to a whitelist campaign",
  category: "Community",
  run: async (msg: Message) => {
    try {
      let description = ''
      const args = getCommandArguments(msg)
      if (args.length < 4) {
        return
      }

      if (!parseInt(args[2])) {
        return
      }

      const userDiscordIdList = args
        .slice(3)
        .map(s => {
          if (!s.startsWith("<@") || !s.endsWith(">")) {
            return null
          }
          return s.replace(/\D/g, "")
        })
        .filter(s => s)
        .map((s: string): CampaignWhitelistUser => ({ discord_id: s, whitelist_campaign_id: args[2] }))

      const res = await community.addCampaignWhitelistUser(userDiscordIdList)

      if (!res?.users?.length) {
        return
      }
      description = `Successfully added these users to whitelist for campaign ID ${args[2]} ✅`

      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description,
              title: "Whitelist Management"
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
          usage: `${PREFIX}wl add <campaign-id> <@user1, @user2, ..>`,
          examples: `${PREFIX}wl add <campaign-id> @mochi1 @mochi2`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
