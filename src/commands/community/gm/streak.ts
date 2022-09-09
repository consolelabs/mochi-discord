import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
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
    const res = await Profile.getUserGmStreak(msg.author.id, msg.guildId)
    let daysCheckedIcons = ""

    if (!res.ok) {
      switch (res.error) {
        case "user has no gm streak":
          return null
        default:
          throw new Error(res.error)
      }
    }

    for (let i = 0; i < res.data.streak_count; i++) {
      daysCheckedIcons += "<:approve:933341948402618378>"
    }
    return {
      messageOptions: {
        embeds: [
          new MessageEmbed()
            .setTitle(`GM/GN streak`)
            .setDescription(
              `GM streak: **${res.data.streak_count}**
                    ${daysCheckedIcons}
                    `
            )
            .setColor(msgColors.PRIMARY as ColorResolvable),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}gm streak`,
          examples: `${PREFIX}gm streak`,
          document: GM_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
