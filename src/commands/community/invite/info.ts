import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { logger } from "logger"

const command: Command = {
  id: "invite_info",
  command: "info",
  brief: "Show current Invite Tracker's log channel.",
  category: "Community",
  onlyAdministrator: true,
  run: async function config(msg: Message) {
    try {
      const json = await community.getCurrentInviteTrackerConfig(msg.guildId)
      if (json.message === 'OK') {
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                description: `Current Invite Tracker log channel is set to <#${json.data.user_id}>`,
                title: "Invite Tracker Configuration"
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
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite info`,
      examples: `${PREFIX}invite info`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`]
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
}

export default command
