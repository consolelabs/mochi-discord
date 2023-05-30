import profile from "adapters/profile"
import {
  Message,
  MessageActionRow,
  MessageButton,
  User,
  MessageAttachment,
  GuildMember,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  authorFilter,
  capitalizeFirst,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import {
  TWITTER_USER_URL,
  TELEGRAM_USER_URL,
  HOMEPAGE_URL,
} from "utils/constants"
import { wrapError } from "utils/wrap-error"
import * as qrcode from "qrcode"
import mochiPay from "adapters/mochi-pay"
import { formatDigit } from "utils/defi"
import { convertString } from "utils/convert"
import { chunk } from "lodash"
import { getPaginationRow } from "ui/discord/button"
import CacheManager from "cache/node-cache"

const PAGE_SIZE = 10

CacheManager.init({
  pool: "user_qr_codes",
  ttl: 300000,
  checkperiod: 300000,
})

async function getAll(discordId: string, findId?: string) {
  const data = await CacheManager.get({
    pool: "user_qr_codes",
    key: discordId,
    call: async () => {
      const [dataProfile, walletsRes, socials] = await Promise.all([
        profile.getByDiscord(discordId),
        profile.getUserWallets(discordId),
        profile.getUserSocials(discordId),
      ])
      const data: any[] = [
        {
          id: `profile-id-${HOMEPAGE_URL}/${dataProfile.profile_name}`,
          type: "Mochi ID",
          content: `mochi:${dataProfile.profile_name}`,
          category: "profile",
        },
        ...socials.map((s) => ({
          id: `social-${s.platform}-${s.platform_identifier}`,
          type: capitalizeFirst(s.platform),
          content: s.platform_identifier,
          category: "social",
        })),
      ]

      const { mochiWallets, wallets: _wallets } = walletsRes
      const wallets = _wallets.slice(0, 10)

      data.push(
        ...mochiWallets.map((w) => ({
          id: `wallet-mochi-${w.value}`,
          chain: w.chain,
          address: w.value,
          type: `${w.chain} wallet`,
          content: shortenHashOrAddress(w.value, 4),
          category: `wallet-${w.chain}`,
        }))
      )
      data.push(
        ...wallets.map((w) => ({
          id: `wallet-onchain-${w.value}`,
          chain: w.chain,
          address: w.value,
          type: `${w.chain} wallet`,
          content: shortenHashOrAddress(w.value, 4),
          category: `wallet-${w.chain}`,
        }))
      )

      if (dataProfile.err) {
        data.shift()
      } else {
        const [paylinks, paymes] = await Promise.all([
          mochiPay.getPaymentRequestByProfile(dataProfile.id, "paylink"),
          mochiPay.getPaymentRequestByProfile(dataProfile.id, "payme"),
        ])

        data.push(
          ...paymes.map((p) => {
            const amount = formatDigit({
              value: String(convertString(p.amount, p.token.decimal)),
              fractionDigits: 2,
            })
            const symbol = p.token.symbol

            return {
              id: `pay-me-${HOMEPAGE_URL}/${dataProfile.id}/receive/${p.code}`,
              type: "Payme",
              content: `${amount} ${symbol}`,
              category: "pay",
              amount,
              symbol,
              chain: p.token.chain.symbol,
              note: p.note,
            }
          })
        )
        data.push(
          ...paylinks.map((p) => {
            const amount = formatDigit({
              value: String(convertString(p.amount, p.token.decimal)),
              fractionDigits: 2,
            })
            const symbol = p.token.symbol

            return {
              id: `pay-link-${HOMEPAGE_URL}/pay/${p.code}`,
              type: "Paylink",
              content: `${amount} ${symbol}`,
              category: "pay",
              amount,
              symbol,
              chain: p.token.chain.symbol,
              note: p.note,
            }
          })
        )
      }

      return data
    },
  })

  if (findId) return data.find((d: any) => d.id === findId)
  return data
}

function mapEmoji(d: any) {
  let emoji = getEmoji("QRCODE")
  if (d.category === "profile") {
    emoji = getEmoji("MOCHI_CIRCLE")
  } else if (d.category === "social") {
    if (d.type.toLowerCase() === "twitter") {
      emoji = getEmoji("TWITTER")
    } else if (d.type.toLowerCase() === "telegram") {
      emoji = getEmoji("TELEGRAM")
    }
  } else if (d.category.startsWith("wallet")) {
    emoji = getEmoji("WALLET_1")
  }

  return emoji
}

export async function compose(user: User, page = 0) {
  const all = await getAll(user.id)
  const paginated = chunk(all, PAGE_SIZE) as any[][]
  const data = paginated[page]

  const embed = composeEmbedMessage(null, {
    author: ["QR codes", user.displayAvatarURL()],
    color: msgColors.BLUE,
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All your links as QR codes, ready to be shared.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Click view/save to view it via **_Apple Wallet_**\n\n${
      formatDataTable(data, {
        cols: ["type", "content"],
        rowAfterFormatter: (f, i) => {
          const d = data[i]
          const emoji = mapEmoji(d)

          return `${emoji} ${f} [${
            d.category === "profile" ? "View" : "Save"
          }](${HOMEPAGE_URL})`
        },
      }).joined
    }`,
  })

  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder("🎫 View one")
          .setCustomId("view_qr")
          .addOptions(
            data.map((d) => ({
              emoji: mapEmoji(d),
              label: `${d.type} ${d.content}`,
              value: d.id,
            }))
          )
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("New QR")
          .setStyle("SECONDARY")
          .setEmoji(getEmoji("QRCODE"))
          .setCustomId("new_qr")
      ),
      ...getPaginationRow(page, paginated.length, {
        left: { emoji: getEmoji("LEFT_ARROW"), label: "\u200b" },
        right: { emoji: getEmoji("RIGHT_ARROW"), label: "\u200b" },
        extra: "",
      }),
    ],
  }
}

function collectButton(reply: Message, author: User) {
  reply
    .createMessageComponentCollector({
      componentType: "BUTTON",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }

        const [action, ...rest] = i.customId.split("_")
        if (action === "page") {
          const [curPage, dir] = rest
          let nextPage = Number(curPage)
          if (dir === "+") {
            nextPage += 1
          } else {
            nextPage -= 1
          }

          const msgOpts = await compose(author, nextPage)

          i.editReply(msgOpts)
        }
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

function formatContent(
  category: string,
  type: string,
  value: string,
  data: any
) {
  switch (category) {
    case "wallet": {
      const author = ["Deposit", getEmojiURL(emojis.WALLET)]
      let description = ""

      switch (type) {
        case "mochi": {
          description = `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Here is the deposit address linked to your Discord account.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT"
          )} Transfers to this address is prioritized and processed at top of queue compare to linked wallets.`
          break
        }
        case "onchain": {
          description = `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Here is the deposit address of one of your linked wallet.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please note that it might take some time for Mochi to pick up tranfers to this address as we need to perform on-chain lookup.`
          break
        }
      }

      return {
        author,
        description,
        fields: [
          {
            name: "Address",
            value: `\`${data.address}\``,
            inline: true,
          },
          {
            name: "Chain",
            value: `${getEmojiToken(data.chain)} ${data.chain}`,
            inline: false,
          },
        ],
      }
    }
    case "pay": {
      const author = [getEmojiURL(emojis.CASH)]
      let description = ""

      switch (type) {
        case "me": {
          author.unshift("Pay Me")
          description = `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} You have requested to be paid ${data.amount} ${
            data.symbol
          }, share [this link](${value}) or others can scan the code to pay you.`
          break
        }
        case "link": {
          author.unshift("Pay Link")
          description = `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Here is the link to temp wallet of ${data.amount} ${
            data.symbol
          }\n${getEmoji(
            "ANIMATED_POINTING_RIGHT"
          )} Scan the code to claim the airdrop.`
        }
      }

      return {
        author,
        description,
        fields: [
          {
            name: "Link",
            value: `**${value}**`,
            inline: false,
          },
          {
            name: "Amount",
            value: `${getEmojiToken(data.symbol)} ${data.amount} ${
              data.symbol
            }`,
            inline: true,
          },
          {
            name: "Chain",
            value: data.chain,
            inline: true,
          },
          ...(data.note
            ? [
                {
                  name: "Message",
                  value: data.note,
                  inline: true,
                },
              ]
            : []),
        ],
      }
    }
    default:
      return {
        author: ["Here is your QR code", getEmojiURL(emojis.QRCODE)],
      }
  }
}

export async function viewQR(i: SelectMenuInteraction) {
  const selectedQRCode = i.values[0]
  const [category, type, ...rest] = selectedQRCode.split("-")
  let qrCodeValue = rest.join("")
  if (category === "social") {
    const [value] = rest
    if (type === "twitter") {
      qrCodeValue = `${TWITTER_USER_URL}/${value}`
    }
    if (type === "telegram") {
      qrCodeValue = `${TELEGRAM_USER_URL}/${value}`
    }
  }
  const buffer = await qrcode.toBuffer(qrCodeValue, {
    width: 400,
  })
  const data = await getAll(i.user.id, selectedQRCode)
  if (!data) return {}
  const {
    author: embedAuthor,
    description,
    fields = [],
  } = formatContent(category, type, qrCodeValue, data)
  const messageOptions = {
    embeds: [
      composeEmbedMessage(null, {
        author: embedAuthor,
        description,
        thumbnail: "attachment://qr.png",
      }).addFields(fields),
    ],
    files: [new MessageAttachment(buffer, "qr.png")],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Save")
          .setStyle("SECONDARY")
          .setCustomId("save_qr")
          .setEmoji(getEmoji("QRCODE")),
        new MessageButton()
          .setLabel("Delete")
          .setStyle("SECONDARY")
          .setCustomId("delete_qr")
          .setEmoji(getEmoji("BIN"))
      ),
    ],
  }

  return messageOptions
}

export async function render(
  msg: OriginalMessage,
  _member?: GuildMember | null
) {
  const member = _member ?? msg.member
  if (!(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't get user data",
    })
  }
  const dataProfile = await profile.getByDiscord(member.user.id)
  if (dataProfile.err) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't get profile data",
    })
  }

  const replyPayload = await compose(member.user)

  return replyPayload
}
