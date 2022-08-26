import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { ColorResolvable, MessageEmbed } from "discord.js"
import { msgColors } from "utils/common"
import Profile from "../../../adapters/profile"

const command: Command = {
  id: "gm_streak",
  command: "streak",
  brief: "Show user's gm/gn streak",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const json = await Profile.getUserGmStreak(msg.author.id, msg.guildId)
    let daysCheckedIcons = ""

    switch (json.error) {
      case "user has no gm streak":
        break
      case undefined:
        for (let i = 0; i < json.data.streak_count; i++) {
          daysCheckedIcons += "<:approve:933341948402618378>"
        }
        return {
          messageOptions: {
            embeds: [
              new MessageEmbed()
                .setTitle(`GM/GN streak`)
                .setDescription(
                  `GM streak: **${json.data.streak_count}**
                    ${daysCheckedIcons}
                    `
                )
                .setColor(msgColors.PRIMARY as ColorResolvable),
            ],
          },
        }
      default:
        throw new Error(json.error)
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}gm streak`,
          examples: `${PREFIX}gm streak`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
