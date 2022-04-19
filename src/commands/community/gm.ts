import { Command } from "types/common"
import { Message } from "discord.js"
import { DISCORD_GM_CHANNEL } from "../../env"
import Profile from "modules/profile"
import { BotBaseError } from "errors"
import { workInProgress } from "utils/discord-embed"

export async function newGm(msg: Message) {
  try {
    if (msg.channel.id !== DISCORD_GM_CHANNEL) {
      return
    }

    const json = await Profile.newUserGM(
      msg.author.id,
      msg.guildId,
      msg.createdTimestamp
    )

    if (json.error !== undefined) {
      throw new BotBaseError(json.error)
    }

    if (json.data.new_streak_recorded && json.data.streak_count >= 3) {
      await msg.channel.send(
        `${msg.content.toLowerCase() === "gn" ? "gn" : "gm"} <@${
          msg.author.id
        }>, you've said gm-gn ${
          json.data.streak_count
        } days in a row :fire: and ${json.data.total_count} days in total.`
      )
    }

    if (!json.data.new_streak_recorded && json.data.duration_til_next_goal) {
      await msg.channel.send(
        `${msg.content.toLowerCase() === "gn" ? "gn" : "gm"} <@${
          msg.author.id
        }>, you've already said gm-gn today. You need to wait \`${
          json.data.duration_til_next_goal
        }\` :alarm_clock: to reach your next streak goal :dart:.`
      )
    }
  } catch (err: any) {
    throw err
  }
}

const command: Command = {
  id: "gm",
  command: "gm",
  name: "GM",
  category: "Community",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  experimental: true,
}

export default command
