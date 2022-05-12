import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { ColorResolvable, Message, MessageEmbed } from "discord.js"
import { msgColors } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { BotBaseError } from "errors"
import community from "adapters/community"

const command: Command = {
  id: "whitelist_create",
  command: "create",
  brief: "Whitelist Management",
  category: "Community",
  run: async (msg: Message) => {
    try {
      let description = ''
      const args = getCommandArguments(msg)
      if (args.length < 3) {
        return
      }
      const campaignName = args.slice(2).join(" ")
      const res = await community.createWhitelistCampaign(campaignName, msg.guild.id)

      if (!res.name) {
        return
      }
      description = `Campaign **${res.name}** is successfully created ✅`

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
          description: "Create a whitelist campaign",
          usage: `${PREFIX}wl create <campaign-name>`,
          examples: `${PREFIX}wl create rabby-whitelist`
        })
      ]
    }
  },
  canRunWithoutAction: true
}

export default command
