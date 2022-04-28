import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Profile from "../../../adapters/profile"

const command: Command = {
  id: "gm-streak",
  command: "streak",
  brief: "Show user's gm/gn streak",
  category: "Community",
  run: async msg => {
    try {
      const json = await Profile.getUserGmStreak(msg.author.id, msg.guildId)

      switch (json.error) {
        case "user has no gm streak":
          break
        case undefined:
          return {
            messageOptions: {
              content: `gm <@${msg.author.id}>, you've said gm-gn ${
                json.data.streak_count
              } day${
                json.data.streak_count > 1 ? "s" : ""
              } in a row :fire: and ${json.data.total_count} day${
                json.data.total_count > 1 ? "s" : ""
              } in total.`
            }
          }
          break
        default:
          throw new Error(json.error)
      }
    } catch (err: any) {
      logger.error(err)
    }
  },
  getHelpMessage: async msg => {
    const embed = composeEmbedMessage(msg, {
      description: "Show user's gm/gn streak",
      usage: `${PREFIX}gm streak`,
      examples: `${PREFIX}gm streak`
    })
    return {
      embeds: [embed]
    }
  },
  canRunWithoutAction: true
}

export default command
