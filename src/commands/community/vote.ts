import { SlashCommandBuilder } from "@discordjs/builders"
import community from "adapters/community"
import { SlashCommand } from "types/common"
import { getEmoji } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

function buildProgressBar(progress: number, scale = 1) {
  const list = new Array(Math.ceil(10 * scale)).fill(
    getEmoji("progress_empty_2")
  )
  const filled = list.map((empty, index) => {
    if (index < Math.floor(progress * scale)) {
      return getEmoji("progress_2")
    }
    return empty
  })
  // trim 2 ends
  if (progress > 0) {
    filled[0] = getEmoji("progress_1")
  } else {
    filled[0] = getEmoji("progress_empty_1")
  }
  filled[filled.length - 1] = getEmoji("progress_empty_3")
  return filled.join("")
}

function buildStreakBar(progress: number) {
  return [
    ...new Array(progress).fill(getEmoji("approve")),
    ...new Array(10 - progress).fill(getEmoji("approve_grey")),
  ].join(" ")
}

const voteLimitCount = 4
const formatter = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2 })

const command: SlashCommand = {
  name: "vote",
  category: "Community",
  help: async () => {
    return {}
  },
  colorType: "Server",
  prepare: () => {
    return new SlashCommandBuilder()
      .setDescription("Display voting streaks and links to vote")
      .setName("vote")
  },
  ephemeral: true,
  run: async function (i) {
    const res = await community.getUpvoteStreak(i.user.id)
    if (!res.ok) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: res.error })],
        },
      }
    }
    const streak = Math.max(Math.min(res.data?.streak_count ?? 0, 10), 0)
    const total = res.data?.total_count ?? 0
    const embed = composeEmbedMessage(null, {
      title: "Call for Mochians!",
      description:
        "Every 12 hours, help vote Mochi Bot raise to the top.\nYou get rewards, Mochi is happy, it's a win-win.\n\u200b",
      color: "#47ffc2",
      originalMsgAuthor: i.user,
      thumbnail:
        "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
    })
    embed.setFields([
      {
        name: `${getEmoji("like")} Vote Available`,
        value:
          "[Click here to vote on top.gg](https://top.gg/bot/963123183131709480/vote)\n\u200b",
        inline: true,
      },
      {
        name: `${getEmoji("like")} Vote Available`,
        value:
          "[Click here to vote on discordbotlist.com](https://discordbotlist.com/bots/mochi-bot/upvote)\n\u200b",
        inline: true,
      },
      {
        name: `${getEmoji("exp")} Reward`,
        value: `Every \`${formatter.format(
          voteLimitCount
        )}\` votes, \`+20\` to all factions exp\n\u200b`,
        inline: true,
      },
      {
        name: "Recurring Vote Progress",
        value: `\`${formatter.format(
          total % voteLimitCount
        )}/${formatter.format(voteLimitCount)}\` ${buildProgressBar(
          ((total % voteLimitCount) / voteLimitCount) * 10
        )}`,
        inline: false,
      },
      {
        name: `${getEmoji("like")} Voting Streak Buff: \`Tier ${streak}\``,
        value: `${buildStreakBar(streak)}`,
        inline: false,
      },
    ])

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
}

export default command
