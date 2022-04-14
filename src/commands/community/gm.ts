import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX, DISCORD_GM_CHANNEL } from "../../env"
import { emojis, getHelpEmbed, getListCommands } from "../../utils/discord"
import Profile from "modules/profile"
import { BotBaseError } from "errors"

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

async function countGm(msg: Message) {
  try {
    const json = await Profile.getUserGMStreak(msg.author.id, msg.guildId)

    switch (json.error) {
      case "user has no gm streak":
        break
      case undefined:
        await msg.channel.send(
          `gm <@${msg.author.id}>, you've said gm-gn ${
            json.data.streak_count
          } day${json.data.streak_count > 1 ? "s" : ""} in a row :fire: and ${
            json.data.total_count
          } day${json.data.total_count > 1 ? "s" : ""} in total.`
        )
        break
      default:
        throw new BotBaseError(json.error)
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
  run: countGm,
  getHelpMessage: async function (msg) {
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embedMsg = getHelpEmbed("Check GM Streak")
      .setTitle(`${PREFIX}gm`)
      .addField("_Examples_", `\`${PREFIX}gm\``, true)
      .setDescription(
        `\`\`\`Check how many days you've said gm in a row.\`\`\`\n${getListCommands(
          replyEmoji ?? "╰ ",
          {
            gm: {
              name: "Check your gm streak `$gm`",
              command: "gm",
            },
          }
        )}`
      )
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
}

export default command
