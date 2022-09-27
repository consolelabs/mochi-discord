import { Event } from "."
import Discord from "discord.js"
import config from "adapters/config"
import webhook from "../adapters/webhook"
import { DISCORD_DEFAULT_AVATAR } from "env"
import { createBEGuildMember } from "../types/webhook"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import ChannelLogger from "utils/ChannelLogger"
import { logger } from "logger"
import { BotBaseError, APIError } from "errors"
import client from "index"
import Profile from "adapters/profile"
import CacheManager from "utils/CacheManager"
import defi from "adapters/defi"
import {
  getEmoji,
  defaultEmojis,
  roundFloatNumber,
  capFirst,
} from "utils/common"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import { HexColorString, User, MessageAttachment } from "discord.js"
import Community from "adapters/community"
import { EphemeralMessage } from "utils/CommandChoiceManager"

const voteLimitCount = 4
const formatter = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2 })
export default {
  name: "guildMemberAdd",
  once: false,
  execute: async (member: Discord.GuildMember) => {
    try {
      await setUserDefaultRoles(member)
      const res = await webhook.pushDiscordWebhook(
        "guildMemberAdd",
        createBEGuildMember(member)
      )
      const guild = await config.getGuild(member.guild.id)
      const logChannel = member.guild.channels.cache.find(
        (channel) => channel.id === guild?.log_channel_id
      )

      if (!res || res.error) {
        sendInviteTrackerMessage(
          member.guild.id,
          unknowErrorMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
        return
      }

      const data = res.data
      if (data.is_invitee_a_bot) {
        sendInviteTrackerMessage(
          member.guild.id,
          addBotMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
      } else if (data.is_bot) {
        sendInviteTrackerMessage(
          member.guild.id,
          botInviteMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
      } else if (data.is_vanity) {
        sendInviteTrackerMessage(
          member.guild.id,
          vantityInviteMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
      } else if (!data.inviter_id) {
        sendInviteTrackerMessage(
          member.guild.id,
          unknowErrorMsg(member.id),
          logChannel,
          member.user.avatarURL() ?? ""
        )
      } else {
        sendInviteTrackerMessage(
          member.guild.id,
          inviteMsg(member.id, data.inviter_id, data.invites_amount),
          logChannel,
          member.user.avatarURL() ?? ""
        )
      }
      welcomeNewMember(member)
      sendDMToUser(member.guild.name, data.invitee_id)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"guildMemberAdd">')
    }
  },
} as Event<"guildMemberAdd">

function unknowErrorMsg(memberID: string) {
  return `I can not figure out how <@${memberID}> joined the server.`
}

function vantityInviteMsg(memberID: string) {
  return `<@${memberID}> joined using a vanity invite.`
}

function botInviteMsg(memberID: string) {
  return `<@${memberID}> joined using OAuth.`
}

function addBotMsg(memberID: string) {
  return `<@${memberID}> has been invited by admin.`
}

function inviteMsg(memberID: string, inviterID: string, inviteAmount: number) {
  return `<@${memberID}> has been invited by <@${inviterID}> and has now ${inviteAmount} invites.`
}

function sendInviteTrackerMessage(
  guildId: string,
  msg: string,
  logChannel?: Discord.Channel,
  thumbnail?: string
) {
  if (!logChannel || !logChannel.isText()) {
    // TODO(tuand): need to handle better e.g show warning to user
    logger.warn(`[guildMemberAdd/${guildId}] - log channel not set`)
    return
  }
  const embed = composeEmbedMessage(null, {
    title: "Invite Tracker",
    description: msg,
    thumbnail: thumbnail || DISCORD_DEFAULT_AVATAR,
  })
  logChannel.send({ embeds: [embed] })
}

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const res = await config.getCurrentDefaultRole(member.guild.id)

  if (res.ok && res.data.role_id) {
    await member.roles.add(res.data.role_id)
  }
}

async function welcomeNewMember(member: Discord.GuildMember) {
  const welcomeChannel = await config.getCurrentWelcomeConfig(member.guild.id)
  if (!welcomeChannel.ok) return

  const configData = welcomeChannel.data
  if (
    !configData ||
    !configData.channel_id ||
    !configData.guild_id ||
    !configData.welcome_message
  ) {
    logger.warn(
      `[guildMemberAdd/${member.guild.id}] - welcome channel configs invalid`
    )
    return
  }
  // channel id returned but cannot find in guild
  const chan = await client.channels.fetch(configData.channel_id)
  if (!chan) {
    const guild = await config.getGuild(member.guild.id)
    if (!guild) {
      logger.warn(
        `[guildMemberAdd/${member.guild.id}] - failed to get guild data`
      )
      return
    }

    const logChannel = member.guild.channels.cache.find(
      (channel) => channel.id === guild?.log_channel_id
    )
    if (logChannel?.isText()) {
      logChannel.send({
        embeds: [
          getErrorEmbed({
            description: "Welcome channel not found",
          }),
        ],
      })
    }
    return
  }

  const embed = composeEmbedMessage(null, {
    title: "Welcome",
    description: configData.welcome_message.replaceAll(
      "$name",
      `<@${member.id}>`
    ),
  })
  if (chan.isText()) {
    chan.send({ embeds: [embed] })
  }
}

async function sendDMToUser(guildName: string, inviteeID: string) {
  const res = await Profile.getUser({ discordId: inviteeID })

  if (!res.ok) return

  if (res.data.nr_of_join > 1) return

  const embedTickerEth = await defaultTickerEth()

  client.users.fetch(inviteeID).then(async (user) => {
    const embedVote = await handle(user)
    user
      .createDM()
      .then((dm) => {
        dm.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `Welcome to the ${guildName} server installed Mochi Bot.`,
              color: `0xFCD3C1`,
              description: `Type \`$help\` in ${guildName} server or read this Instruction on [Gitbook](https://app.gitbook.com/s/nJ8qX0cEj5ph125HugiB/~/changes/SoXaDd3kMCfyXNQDOZ9f/getting-started/permission-and-prefix) to get to know all our features. Now, let us walk you through some of Mochi Bot main functions:\n
              - **Crypto management:** Managing your crypto portfolio.
              - **NFT Rarity Ranking & Volume:** Tracking and managing your favorite NFT collections.
              - **Server Administration:** Building and managing your own community on Discord (For server owners only. Want to use these features? [Install Mochi Bot to your server now!](https://getmochi.co/))
              \nRemember to use our feature, you need to place \`$\` or \`/\` in every command. Now, back to ${guildName} server, start with $help, and try our features!!!`,
            }),
          ],
        }).catch((e) => {
          logger.info(e)
        })
        dm.send({
          ...((embedTickerEth.messageOptions.files?.length ?? 0) > 0
            ? { files: embedTickerEth.messageOptions.files }
            : {}),
          embeds: [
            composeEmbedMessage(null, {
              description: `For instance, you can view your favorite token price by \`$ticker eth\`.`,
              color: `0xFCD3C1`,
            }),
            embedTickerEth.messageOptions.embeds[0],
            composeEmbedMessage(null, {
              description: `Or vote for Mochi Bot to get rewards by running \`$vote\`.`,
              color: `0xFCD3C1`,
            }),
            embedVote,
          ],
        }).catch((e) => {
          logger.info(e)
        })
      })
      .catch((e) => {
        logger.info(e)
      })
  })
}

export const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? defaultEmojis.CHART_WITH_UPWARDS_TREND
      : change === 0
      ? ""
      : defaultEmojis.CHART_WITH_DOWNWARDS_TREND
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}

function buildProgressBar(progress: number, scale = 1) {
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

function buildStreakBar(progress: number) {
  return [
    ...new Array(progress).fill(getEmoji("approve")),
    ...new Array(10 - progress).fill(getEmoji("approve_grey")),
  ].join(" ")
}

async function renderHistoricalMarketChart({
  coinId,
  days = 7,
}: {
  coinId: string
  days?: number
}) {
  const currency = "usd"
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getHistoricalMarketData-ethereum-${currency}-${days}`,
    call: () => defi.getHistoricalMarketData("ethereum", currency, days || 7),
  })
  if (!ok) return null
  const { times, prices, from, to } = data

  // draw chart
  const image = await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}) | ${from} - ${to}`,
    labels: times,
    data: prices,
    colorConfig: getChartColorConfig(coinId),
  })

  return new MessageAttachment(image, "chart.png")
}

async function handle(user: User): Promise<Discord.MessageEmbed> {
  const res = await Community.getUpvoteStreak(user.id)
  if (!res.ok) {
    return getErrorEmbed({ description: res.error })
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
    color: "0xFCD3C1",
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
      value: `\`${formatter.format(total % voteLimitCount)}/${formatter.format(
        voteLimitCount
      )}\` ${buildProgressBar(
        ((total % voteLimitCount) / voteLimitCount) * voteLimitCount,
        3
      )}`,
      inline: false,
    },
    {
      name: `${getEmoji("like")} Voting Streak Buff: \`Tier ${streak}\``,
      value: `${buildStreakBar(streak)}`,
      inline: false,
    },
  ])

  return embed
}

async function defaultTickerEth() {
  let ephemeralMessage: EphemeralMessage | undefined
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-ethereum`,
    call: () => defi.getCoin("ethereum"),
  })
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  const currency = "usd"
  const {
    market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  const currentPrice = +current_price[currency]
  const marketCap = +market_cap[currency]
  const blank = getEmoji("blank")

  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  }).addFields([
    {
      name: `Market cap (${currency.toUpperCase()})`,
      value: `$${marketCap.toLocaleString()} (#${
        coin.market_cap_rank
      }) ${blank}`,
      inline: true,
    },
    {
      name: `Price (${currency.toUpperCase()})`,
      value: `$${currentPrice.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })}`,
      inline: true,
    },
    { name: "\u200B", value: "\u200B", inline: true },
    {
      name: "Change (1h)",
      value: getChangePercentage(price_change_percentage_1h_in_currency.usd),
      inline: true,
    },
    {
      name: `Change (24h) ${blank}`,
      value: getChangePercentage(price_change_percentage_24h_in_currency.usd),
      inline: true,
    },
    {
      name: "Change (7d)",
      value: getChangePercentage(price_change_percentage_7d_in_currency.usd),
      inline: true,
    },
  ])

  const chart = await renderHistoricalMarketChart({ coinId: coin.id })

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
    },
    ephemeralMessage,
  }
}
