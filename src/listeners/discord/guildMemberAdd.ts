import { DiscordEvent } from "."
import Discord from "discord.js"
import config from "adapters/config"
import { DISCORD_DEFAULT_AVATAR } from "env"
import { logger } from "logger"
import { APIError } from "errors"
import client from "index"
import Profile from "adapters/profile"
import CacheManager from "cache/node-cache"
import defi from "adapters/defi"
import { getEmoji, roundFloatNumber } from "utils/common"
import { HexColorString, MessageAttachment } from "discord.js"
import { wrapError } from "utils/wrap-error"
import { createBEGuildMember } from "types/webhook"
import webhook from "adapters/webhook"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { renderChartImage } from "ui/canvas/chart"
import { getChartColorConfig } from "ui/canvas/color"
import { HOMEPAGE_URL } from "utils/constants"

const event: DiscordEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  once: false,
  execute: async (member) => {
    wrapError(null, async () => {
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
      await welcomeNewMember(member)
      await sendDMToUser(member.guild.name, data.invitee_id)
    })
  },
}

export default event

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
  return `<@${memberID}> has been invited by <@${inviterID}> and now has ${inviteAmount} invites.`
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
  const { ok, data } = await config.getCurrentDefaultRole(member.guild.id)
  if (ok && data.role_id) {
    await member.roles.add(data.role_id)
  }
}

async function welcomeNewMember(member: Discord.GuildMember) {
  const welcomeChannel = await config.getCurrentWelcomeConfig(member.guild.id)
  if (!welcomeChannel.ok || !welcomeChannel.data) return

  const configData = welcomeChannel.data
  if (
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
  const chan = await client.channels
    .fetch(configData.channel_id)
    .catch(() => null)
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

  const welcomeMsg = configData.welcome_message
    .replaceAll("$name", `<@${member.id}>`)
    .replaceAll(`\\n`, "\n")

  if (chan.isText()) {
    chan.send({ content: welcomeMsg })
  }
}

async function sendDMToUser(guildName: string, inviteeID: string) {
  const res = await Profile.getUser({ discordId: inviteeID })

  if (!res.ok) return

  if (res.data.nr_of_join > 1) return

  const embedTickerEth = await defaultTickerEth()

  client.users.fetch(inviteeID).then(async (user) => {
    if (user.bot) return

    user
      .createDM()
      .catch(() => null)
      .then((dm) => {
        dm?.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `Welcome to the ${guildName} server installed Mochi Bot.`,
              color: `0xFCD3C1`,
              description: `Type \`$help\` in ${guildName} server or read this Instruction on [Gitbook](https://app.gitbook.com/s/nJ8qX0cEj5ph125HugiB/~/changes/SoXaDd3kMCfyXNQDOZ9f/getting-started/permission-and-prefix) to get to know all our features. Now, let us walk you through some of Mochi Bot main functions:\n
              - **Crypto management:** Managing your crypto portfolio.
              - **NFT Rarity Ranking & Volume:** Tracking and managing your favorite NFT collections.
              - **Server Administration:** Building and managing your own community on Discord (For server owners only. Want to use these features? [Install Mochi Bot to your server now!](${HOMEPAGE_URL}))
              \nRemember to use our feature, you need to place \`$\` or \`/\` in every command. Now, back to ${guildName} server, start with $help, and try our features!!!`,
            }),
          ],
        }).catch(() => null)
        dm?.send({
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
          ],
        }).catch(() => null)
      })
      .catch(() => null)
  })
}

export const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("INCREASING")
      : change === 0
      ? ""
      : getEmoji("DECREASING")
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
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
    call: () =>
      defi.getHistoricalMarketData({ coinId: "ethereum", currency, days }),
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

async function defaultTickerEth() {
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
  }
}
