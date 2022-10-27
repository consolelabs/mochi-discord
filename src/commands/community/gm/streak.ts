import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { ColorResolvable, MessageEmbed } from "discord.js"
import { getEmoji, msgColors } from "utils/common"
import Profile from "../../../adapters/profile"
import { GuildIdNotFoundError } from "errors"

export async function handle(authorId: string, guildId: string) {
  const res = await Profile.getUserGmStreak(authorId, guildId)
  if (!res.ok) {
    switch (res.error) {
      case "user has no gm streak":
        return null
      default:
        throw new Error(res.error)
    }
  }

  const daysCheckedIcons = new Array(res.data.streak_count)
    .fill(getEmoji("approve"))
    .join("")
  return {
    messageOptions: {
      embeds: [
        new MessageEmbed()
          .setTitle(`GM/GN streak`)
          .setDescription(
            `GM streak: **${res.data.streak_count}**\n${daysCheckedIcons}`
          )
          .setColor(msgColors.PRIMARY as ColorResolvable),
      ],
    },
  }
}

const command: Command = {
  id: "gm_streak",
  command: "streak",
  brief: "Show user's gm/gn streak",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handle(msg.author.id, msg.guildId)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}gm streak`,
          examples: `${PREFIX}gm streak`,
          document: `${GM_GITBOOK}&action=streak`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
