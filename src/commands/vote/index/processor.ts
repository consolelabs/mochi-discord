import Community from "adapters/community"
import { Message, User } from "discord.js"
import { logger } from "logger"
import { capFirst, getEmoji } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"

const voteLimitCount = 4
const formatter = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2 })

export function buildProgressBar(progress: number, scale = 1) {
  const list = new Array(Math.ceil(voteLimitCount * scale)).fill(
    getEmoji("progress_empty_2")
  )
  const filled = list.map((empty, index) => {
    if (index < Math.ceil(progress * scale)) {
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

export function buildStreakBar(progress: number) {
  return [
    ...new Array(progress).fill(getEmoji("approve")),
    ...new Array(10 - progress).fill(getEmoji("approve_grey")),
  ].join(" ")
}

export async function handle(user: User) {
  const res = await Community.getUpvoteStreak(user.id)
  if (!res.ok) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: res.error })],
      },
    }
  }
  const streak = Math.max(Math.min(res.data?.streak_count ?? 0, 10), 0)
  const total = res.data?.total_count ?? 0
  const timeUntilTopgg = res.data?.minutes_until_reset_topgg ?? 0
  const timeUntilDiscordBotList =
    res.data?.minutes_until_reset_discordbotlist ?? 0
  const embed = composeEmbedMessage(null, {
    title: "Call for Mochians!",
    description:
      "Every 12 hours, help vote Mochi Bot raise to the top.\nYou get rewards, Mochi is happy, it's a win-win.\n\u200b",
    color: "#47ffc2",
    originalMsgAuthor: user,
    thumbnail:
      "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
  })
  embed.setFields([
    {
      name: `${getEmoji("like")} Vote ${capFirst(
        `${timeUntilTopgg !== 0 ? "un" : ""}available`
      )}`,
      value:
        timeUntilTopgg === 0
          ? "[Click here to vote on top.gg](https://top.gg/bot/963123183131709480/vote)\n\u200b"
          : `You can [vote again on top.gg](https://top.gg/bot/963123183131709480/vote) in \`${Math.floor(
              timeUntilTopgg / 60
            )}\`**h**\`${timeUntilTopgg % 60}\`**m**!\n\u200b`,
      inline: true,
    },
    {
      name: `${getEmoji("like")} Vote ${capFirst(
        `${timeUntilDiscordBotList !== 0 ? "un" : ""}available`
      )}`,
      value:
        timeUntilDiscordBotList === 0
          ? "[Click here to vote on discordbotlist.com](https://discordbotlist.com/bots/mochi-bot/upvote)\n\u200b"
          : `You can [vote again on discordbotlist.com](https://discordbotlist.com/bots/mochi-bot/upvote) in \`${Math.floor(
              timeUntilDiscordBotList / 60
            )}\`**h**\`${timeUntilDiscordBotList % 60}\`**m**!\n\u200b`,
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
      value: `${buildProgressBar(
        ((total % voteLimitCount) / voteLimitCount) * voteLimitCount,
        2.5
      )} \`${formatter.format(total % voteLimitCount)}/${formatter.format(
        voteLimitCount
      )}\``,
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
}

export async function setCache(msg: Message) {
  const userId = msg.author.id,
    guildId = msg.guildId ?? "",
    channelId = msg.channelId,
    msgId = msg.id

  if (!userId || !guildId || !channelId || !msgId) {
    logger.warn("[setCache] invalid request")
    return
  }
  const req = {
    user_id: userId,
    guild_id: guildId,
    channel_id: channelId,
    message_id: msgId,
  }
  await Community.setUpvoteMessageCache(req)
}

export function disabledVoteEmbed() {
  return composeEmbedMessage(null, {
    title: "Vote is temporarily closed!",
    description: `Thanks for voting for our Bot on [Top.gg/DiscordBotlist](http://Top.gg/DiscordBotlist) in the past few months. ${getEmoji(
      "HEART2"
    )}\n\nHowever, so many spam servers installed Mochi from these platforms, which affected our verification process. So we decided to close the $vote for a while, we will inform you once the vote is opened ${getEmoji(
      "SOON"
    )}`,
  })
}
