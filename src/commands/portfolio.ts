import { Command } from "commands"
import { PREFIX, PROFILE_THUMBNAIL } from "env"
import maskAddress, {
  chainEmojis,
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
  getPaginatedData,
  getPaginationButtons,
  getUserInfoParams,
  onlyRunInAdminGroup,
} from "utils/discord"
import Profile from "modules/profile"
import Portfolio from "modules/portfolio"
import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageEmbed,
  User,
} from "discord.js"
import {
  Portfolio as PortfolioType,
  PortfolioItem,
  PortfolioSummary,
} from "types"
import { MessageComponentTypes } from "discord.js/typings/enums"
import dayjs from "dayjs"
import { UserNotFoundError, UserNotVerifiedError } from "errors"

const blank = getEmoji("blank")
const dash = getEmoji("dash")

const icons: Record<string, string> = {
  ...chainEmojis,
  BSC: chainEmojis["BINANCE"],
}

const emptyColumn = {
  name: blank,
  value: blank,
  inline: true,
}

const noFractionNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumIntegerDigits: 1,
})

const portfolioPage = "portfolio_page"

function renderPortfolioList(pd: PortfolioItem[]): EmbedFieldData[] {
  if (!pd.length) return []
  let fields: EmbedFieldData[][] = []
  const detailType = pd[0].detail_types
  const name = pd[0].name
  const isYield = name.toLowerCase() === "yield"
  const isLP = name.toLowerCase() === "liquidity pool"
  const isRewards = name.toLowerCase() === "rewards"
  const isLocked =
    name.toLowerCase() === "locked" && pd.some((p) => p.detail.end_at)
  const isVesting = name.toLowerCase() === "vesting"

  switch (true) {
    case detailType.includes("leveraged_farming"):
      fields.push([
        {
          name: "Pool",
          value: pd
            .map((p) => p.detail.supply_token_list.map((t) => t.symbol))
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: "Supply/Borrow",
          value: pd
            .map((p) =>
              p.detail.supply_token_list.map(
                (t, i) =>
                  `${t.amount.toFixed(2)} ${
                    t.symbol
                  }/${p.detail.borrow_token_list[i].amount.toFixed(2)} ${
                    p.detail.borrow_token_list[i].symbol
                  }`
              )
            )
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: "USD value",
          value: pd
            .map(
              (p) =>
                `$${p.stats.net_usd_value.toFixed(
                  3
                )}${blank}\n${`${blank}\n`.repeat(
                  p.detail.supply_token_list.length - 1
                )}`
            )
            .join(""),
          inline: true,
        },
      ])
      break
    case detailType.includes("reward"):
      fields.push([
        {
          name: "Pool",
          value: pd
            .map((p) => p.detail.token_list.map((t) => t.symbol))
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: "Balance",
          value: pd
            .map((p) =>
              p.detail.token_list.map(
                (t) => `${t.amount.toFixed(2)} ${t.symbol}`
              )
            )
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: "USD value",
          value: pd
            .map((p) =>
              p.detail.token_list.map(
                (t) => `$${(t.amount * t.price).toFixed(3)}`
              )
            )
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
      ])
      break
    case isVesting && detailType.includes("vesting"):
      fields.push([
        {
          name: "Pool",
          value: pd
            .map((p) => p.detail.token.symbol)
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: `Balance (end time)`,
          value: pd
            .map(
              (p) =>
                `${p.detail.token.amount.toFixed(2)} ${
                  p.detail.token.symbol
                } (${dayjs.unix(p.detail.end_at).format("YYYY/MM/DD HH:mm")})`
            )
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
        {
          name: "USD value",
          value: pd
            .map(
              (p) =>
                `$${(p.detail.token.amount * p.detail.token.price).toFixed(3)}`
            )
            .flat()
            .map((t) => `${t}${blank}\n`)
            .join(""),
          inline: true,
        },
      ])
      break
    case detailType.includes("lending") ||
      detailType.includes("common") ||
      detailType.includes("locked") ||
      detailType.includes("vesting"):
      if (pd[0].detail.supply_token_list?.length) {
        fields.push([
          {
            name: pd[0].detail.reward_token_list?.length ? "Pool" : "Supplied",
            value: pd
              .map((p) => p.detail.supply_token_list.map((st) => st.symbol))
              .flat()
              .map((t) => `${t}${blank}\n`)
              .join(""),
            inline: true,
          },
          {
            name: `Balance${isRewards ? " (rewards)" : ""}${
              isLocked ? " (unlock time)" : ""
            }${isVesting ? " (end time)" : ""}`,
            value: pd
              .map((p) =>
                p.detail.supply_token_list.map(
                  (st, i) =>
                    `${st.amount.toFixed(2)} ${st.symbol}${
                      isRewards && p.detail.reward_token_list[i].amount > 0
                        ? ` (${p.detail.reward_token_list[i].amount.toFixed(
                            2
                          )} ${p.detail.reward_token_list[i].symbol})`
                        : ""
                    }${
                      isLocked && dayjs.unix(p.detail.unlock_at).isValid()
                        ? ` (${dayjs
                            .unix(p.detail.unlock_at)
                            .format("YYYY/MM/DD HH:mm")})`
                        : ""
                    }${
                      isVesting && dayjs.unix(p.detail.end_at).isValid()
                        ? ` (${dayjs
                            .unix(p.detail.end_at)
                            .format("YYYY/MM/DD HH:mm")})`
                        : ""
                    }`
                )
              )
              .flat()
              .map((t) => `${t}${blank}\n`)
              .join(""),
            inline: true,
          },
          {
            name: "USD value",
            value:
              isYield || isLP
                ? pd
                    .map(
                      (p) =>
                        `$${p.stats.net_usd_value.toFixed(
                          3
                        )}${blank}\n${`${blank}\n`.repeat(
                          p.detail.supply_token_list.length - 1
                        )}`
                    )
                    .join("")
                : pd
                    .map((p) =>
                      p.detail.supply_token_list.map(
                        (st) => `$${(st.amount * st.price).toFixed(3)}`
                      )
                    )
                    .flat()
                    .map((t) => `${t}${blank}\n`)
                    .join(""),
            inline: true,
          },
        ])
      }
      if (pd[0].detail.borrow_token_list?.length) {
        fields.push([
          {
            name: "Borrowed",
            value: pd
              .map((p) => p.detail.borrow_token_list.map((t) => t.symbol))
              .flat()
              .map((t) => `${t}${blank}\n`)
              .join(""),
            inline: true,
          },
          {
            name: "Balance",
            value: pd
              .map((p) =>
                p.detail.borrow_token_list.map(
                  (t) => `${t.amount.toFixed(2)} ${t.symbol}`
                )
              )
              .flat()
              .map((t) => `${t}${blank}\n`)
              .join(""),
            inline: true,
          },
          {
            name: "USD value",
            value: pd
              .map((p) =>
                p.detail.borrow_token_list.map(
                  (t) => `$${(t.amount * t.price).toFixed(3)}`
                )
              )
              .flat()
              .map((t) => `${t}${blank}\n`)
              .join(""),
            inline: true,
          },
        ])
      }
      break
    default:
      break
  }

  return fields.flat()
}

export function render({
  page,
  data: fullData,
  user_address,
  balance,
  asset,
  msg,
  author,
}: PortfolioType & { page: number; msg: Message; author: User }) {
  const pageSize = 4
  const totalPages = Math.ceil(fullData.length / pageSize)
  const data = getPaginatedData<PortfolioSummary>(fullData, pageSize, page)
  const customIds = [
    `${portfolioPage}_${page - 1}|${user_address}|${author.id}`,
    `${portfolioPage}_${page + 1}|${user_address}|${author.id}`,
  ]
  const actionButtons = getPaginationButtons(page, totalPages, customIds)
  const port = new MessageEmbed()
    .setColor("#19a8f5")
    .setAuthor(
      "Portfolio",
      "https://cdn.discordapp.com/attachments/895993366960017491/925700398201860126/portfolio.png"
    )
    .setFields([
      ...(page === 0
        ? [
            {
              name: `💳 Address${blank}`,
              value: `\`${maskAddress(user_address)}\``,
              inline: true,
            },
            {
              name: `💰 Total balance${blank}`,
              value: `**$${noFractionNumberFormatter.format(
                balance.total_usd_value
              )}**`,
              inline: true,
            },
            emptyColumn,
            ...asset.map((a) => {
              const chainEmoji = msg.client.emojis.cache.get(
                icons[a.chain.toUpperCase()]
              )

              return {
                name: `${chainEmoji} Asset on ${a.chain}${blank}`,
                value: `**$${noFractionNumberFormatter.format(
                  a.amount_usd_value
                )}**${
                  typeof a.percentage === "number"
                    ? ` - ${a.percentage.toFixed(0)}%`
                    : ""
                }${blank}\n`,
                inline: true,
              }
            }),
            ...(asset.length % 3 !== 0 ? [emptyColumn] : []),
          ]
        : []),
      ...data
        .map((dapp, i) => {
          const portType = new Set(dapp.portfolio_list.map((p) => p.name))
          let portData: PortfolioItem[][] = []
          for (let [type] of portType.entries()) {
            const typeArray = dapp.portfolio_list.filter((p) => p.name === type)
            portData.push(typeArray)
          }

          return [
            {
              name: `${i === 0 ? "" : dash.repeat(9)}\n${dapp.name}`,
              value: `\`${dapp.portfolio_list[0].name}\``,
              inline: false,
            },
            ...portData
              .map((pd, i) => {
                return [
                  ...(i === 0 || pd[0].name === dapp.portfolio_list[0].name
                    ? []
                    : [
                        {
                          name: blank,
                          value: `\`${pd[0].name}\``,
                          inline: false,
                        },
                      ]
                  ).flat(),
                  ...renderPortfolioList(pd),
                ]
              })
              .flat(),
          ]
        })
        .flat(),
    ])
  const pageIndicator = `Page ${page + 1}/${totalPages}`
  port.setFooter(
    getEmbedFooter([author.tag, pageIndicator]),
    author.avatarURL()
  )
  return {
    embed: port,
    components: actionButtons.length
      ? [
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: actionButtons,
          },
        ]
      : [],
  }
}

export async function changePage(interaction: ButtonInteraction) {
  try {
    const args = interaction.customId
      .substring(`${portfolioPage}_`.length)
      .split("|")
    const [pageIndex, address, authorId] = [+args[0], args[1], args[2]]

    const rawData = await Portfolio.getData(address)
    rawData.data = rawData.data
      .map((d) => {
        d.portfolio_list = d.portfolio_list.filter(
          (p) => p.stats.net_usd_value >= 0.001
        )
        return d
      })
      .filter((d) => d.portfolio_list.length)
    const data = Portfolio.calculate(rawData)

    const author = (await interaction.guild.members.fetch(authorId)).user
    const { embed, components } = render({
      ...data,
      page: pageIndex,
      msg: interaction.message as Message,
      author,
    })
    interaction.update({ embeds: [embed], components })
  } catch (e) {
    console.trace(e)
    interaction.channel.send("Something went wrong! Please try again later")
  }
}

const command: Command = {
  id: "portfolio",
  name: "Portfolio of your wallet",
  command: "portfolio",
  alias: ["port"],
  category: "Profile",
  canRunWithoutAction: true,
  checkBeforeRun: onlyRunInAdminGroup,
  experimental: true,
  run: async function (msg, action, isAdmin) {
    let params: Record<string, string> = {
      address: null,
      discordId: null,
      guildId: null,
    }
    if (isAdmin) {
      const args = msg.content.split(" ")
      if (args.length < 2) {
        return { messageOptions: await this.getHelpMessage(msg, action, true) }
      }

      params = await getUserInfoParams(args, msg)
    } else {
      params.discordId = msg.author.id
    }
    params.guildId = msg.guildId

    const user = await Profile.getUser(params)
    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guild.id,
      })
    }
    if (!user?.is_verified) {
      throw new UserNotVerifiedError({
        message: msg,
        discordId: msg.author.id,
      })
    }
    const rawData = await Portfolio.getData(user.address)
    rawData.data = rawData.data
      .map((d) => {
        d.portfolio_list = d.portfolio_list.filter(
          (p) => p.stats.net_usd_value >= 0.001
        )
        return d
      })
      .filter((d) => d.portfolio_list.length)
    const portData = Portfolio.calculate(rawData)
    const { embed, components } = render({
      ...portData,
      page: 0,
      msg,
      author: msg.author,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components,
        content: getHeader("View your address's porfolio", msg.author),
      },
    }
  },
  getHelpMessage: async function () {
    let embedMsg = getHelpEmbed()
      .setTitle(`${PREFIX}port`)
      .setThumbnail(PROFILE_THUMBNAIL)
      .setDescription(`\`\`\`View portfolio of your address.\`\`\``)
    return { embeds: [embedMsg] }
  },
}

export default command
