import { Message, MessageEmbed, User } from "discord.js"
import { CommandChoiceHandlerResult } from "utils/CommandChoiceManager"
import {
  balanceIcons,
  chainEmojis,
  composeDiscordExitButton,
  getEmbedFooter,
  getEmoji,
  getHeader,
  thumbnails,
} from "utils/discord"
import profile from "./index"
import Profile from "modules/profile"
import Portfolio from "modules/portfolio"
import { UserNotFoundError, UserNotVerifiedError } from "errors"

const noFractionNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumIntegerDigits: 1,
})

const icons: Record<string, string> = {
  ...chainEmojis,
  BSC: chainEmojis["BINANCE"],
}

const emptyColumn = {
  name: getEmoji("blank"),
  value: getEmoji("blank"),
  inline: true,
}

const balances: Record<number, string> = Object.entries(balanceIcons).reduce(
  (acc, cur) => {
    const [_name, num] = cur[0].split("_")
    return {
      ...acc,
      [num]: cur[1],
    }
  },
  {}
)

function getBalanceIcon(balance?: number) {
  if (!balance) return null
  const keys = Object.keys(balances)
    .map(Number)
    .sort((a, b) => a - b)
  let largest
  for (const key of keys) {
    if (balance >= key) {
      largest = key
    }
  }

  return largest || largest === 0 ? balances[largest] : null
}

const command: (
  user: User,
  msg: Message
) => Promise<CommandChoiceHandlerResult> = async (user, msg) => {
  const params: Record<string, string> = {
    address: null,
    discordId: null,
    guildId: null,
  }

  params.discordId = user.id
  params.guildId = msg.guildId

  const userData = await Profile.getUser(params)

  if (!userData) {
    throw new UserNotFoundError({
      message: msg,
      guildId: msg.guild.id,
    })
  }
  if (!userData?.is_verified) {
    throw new UserNotVerifiedError({
      message: msg,
      discordId: user.id,
    })
  }
  const rawData = await Portfolio.getData(userData.address)
  rawData.data = rawData.data
    .map((d) => {
      d.portfolio_list = d.portfolio_list.filter(
        (p) => p.stats.net_usd_value >= 0.001
      )
      return d
    })
    .filter((d) => d.portfolio_list.length)
  const portData = Portfolio.calculate(rawData)

  const embed = new MessageEmbed()
    .setColor("#19a8f5")
    .setThumbnail(thumbnails.PORTFOLIO)
    .setAuthor(
      `Total balance: $${noFractionNumberFormatter.format(
        portData.balance.total_usd_value
      )}`,
      getBalanceIcon(portData.balance.total_usd_value)
    )
    .setFields([
      ...portData.asset.map((a) => {
        const chainEmoji = msg.client.emojis.cache.get(
          icons[a.chain.toUpperCase()]
        )

        return {
          name: `${chainEmoji} Asset on ${a.chain}${getEmoji("blank")}`,
          value: `**$${noFractionNumberFormatter.format(a.amount_usd_value)}**${
            typeof a.percentage === "number"
              ? ` - ${a.percentage.toFixed(0)}%`
              : ""
          }${getEmoji("blank")}\n`,
          inline: true,
        }
      }),
      ...(portData.asset.length % 3 !== 0 ? [emptyColumn] : []),
    ])
    .setTimestamp()
    .setFooter(
      getEmbedFooter(['React or type "exit" to close!']),
      user.avatarURL()
    )

  const exitBtnRow = composeDiscordExitButton()

  return {
    messageOptions: {
      embeds: [embed],
      components: [exitBtnRow],
      content: getHeader("Your asset across chains", user),
    },
    commandChoiceOptions: {
      timeout: profile.inactivityTimeout,
    },
  }
}

export default command
