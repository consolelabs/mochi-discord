import profile from "adapters/profile"
import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
  MessageAttachment,
  GuildMember,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  authorFilter,
  capitalizeFirst,
  EmojiKey,
  getEmoji,
  getEmojiToken,
  isAddress,
  msgColors,
  reverseLookup,
  shortenHashOrAddress,
} from "utils/common"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
  TWITTER_USER_URL,
  TELEGRAM_USER_URL,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"
import { wrapError } from "utils/wrap-error"
import * as qrcode from "qrcode"
import mochiPay from "adapters/mochi-pay"
import { formatDigit } from "utils/defi"
import { convertString } from "utils/convert"

export type ReactionType = "message" | "conversation"

async function renderListWallet(
  emoji: string,
  title: string,
  wallets: { value: string; chain?: string; total?: number }[],
  offset: number,
  showCash: boolean
) {
  if (!wallets.length) return ""
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w.value))
  )

  return `${emoji}${title}\n${formatDataTable(
    wallets.map((w, i) => ({
      chain: (w.chain || isAddress(w.value).type).toUpperCase(),
      address: domains[i] || shortenHashOrAddress(w.value),
      balance: w.total?.toString() ? `$${w.total.toString()}` : "",
    })),
    {
      cols: ["chain", "address", "balance"],
      rowAfterFormatter: (formatted, i) =>
        `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)}${formatted}${
          showCash ? getEmoji("CASH") : ""
        } `,
    }
  )}`
}

export async function compose(msg: OriginalMessage, member: GuildMember) {
  const [dataProfile, walletsRes, socials] = await Promise.all([
    profile.getByDiscord(member.user.id),
    profile.getUserWallets(member.id),
    profile.getUserSocials(member.id),
  ])

  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: dataProfile.log,
      curl: dataProfile.curl,
    })
  }

  const paymeLinksRes = await mochiPay.getPaymentRequestByProfile(
    dataProfile.id || "",
    "payme"
  )
  const paymeLinks = paymeLinksRes.slice(0, 5)

  const { mochiWallets, wallets: _wallets } = walletsRes
  const wallets = _wallets.slice(0, 10)

  const embed = composeEmbedMessage(null, {
    author: [
      member.nickname || member.displayName,
      member.user.displayAvatarURL(),
    ],
    color: msgColors.BLUE,
    description: "",
  }).addFields(
    [
      {
        type: "profile",
        label: `Profile`,
        value: `\`https://mochi.gg/${dataProfile.id}\``,
      },
      ...mochiWallets.map((w) => ({
        value: `\`${w.value}\``,
        label: `Mochi_${w.chain}`,
        inline: true,
      })),
      ...(wallets.length > 0
        ? wallets.map((w) => ({
            value: `${w.value}`,
            label: `Onchain_${w.chain}`,
            inline: true,
          }))
        : []),
      ...(socials.length > 0
        ? socials.map((w) => ({
            value: `\`${w.platform_identifier}\``,
            label: `\`${w.platform}\``,
            inline: true,
          }))
        : []),
      ...(paymeLinks.length > 0
        ? paymeLinks.map((w) => {
            return {
              value: `\`https://mochi.gg/payme/${w.code}\``,
              label: `Payme ${formatDigit({
                value: convertString(
                  w.amount,
                  w.token.decimal,
                  false
                ).toString(),
                fractionDigits: 4,
              })} ${w.token.symbol}`,
              inline: true,
            }
          })
        : []),
    ].map((w, i) => ({
      name: getEmoji(`NUM_${i + 1}` as EmojiKey) + " " + `\`${w.label}\``,
      value: getEmoji(`QRCODE`) + w.value,
      inline: false,
    }))
  )

  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder(`💰 View QR codes`)
          .setCustomId("view_qr_code")
          .addOptions(
            [
              //mochi-profile link
              {
                value: `https://mochi.gg/${dataProfile.id}`,
                type: "profile",
                label: `Profile`,
              },
              ...mochiWallets.map((w) => ({
                ...w,
                type: "mochi_wallets",
                label: `Mochi ${w.chain}`,
              })),
              ...wallets.map((w) => ({
                ...w,
                type: "wallet",
                label: `Obchain ${w.chain}`,
              })),
              ...socials.map((w) => ({
                ...w,
                value: w.platform_identifier,
                type: "socials",
                label: `${w.platform}`,
              })),
              ...paymeLinks.map((w) => ({
                ...w,
                value: `\`https://mochi.gg/payme/${w.code}\``,
                type: "payme",
                label: `Payme ${formatDigit({
                  value: convertString(
                    w.amount,
                    w.token.decimal,
                    false
                  ).toString(),
                  fractionDigits: 4,
                })} ${w.token.symbol}`,
              })),
            ].map((w, i) => {
              return {
                emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                label: w.label,
                value: `${w.label}_${w.value}`,
              }
            })
          )
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Quest")
          .setEmoji("<a:brrr:902558248907980871>")
          .setCustomId("profile_quest"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Watchlist")
          .setEmoji(getEmoji("ANIMATED_STAR", true))
          .setCustomId("profile_watchlist"),
        new MessageButton()
          .setLabel(`${wallets.length ? "Add" : "Connect"} Wallet`)
          .setEmoji(getEmoji("WALLET_1"))
          .setStyle("SECONDARY")
          .setCustomId("profiel_connect-wallet")
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("SECONDARY")
          .setEmoji(getEmojiToken("BNB"))
          .setLabel("Connect Binance")
          .setCustomId("profile_connect-binance"),
        ...["twitter", "telegram"]
          .filter((s) =>
            socials.every((connectedSocial) => connectedSocial.platform !== s)
          )
          .map((s) =>
            new MessageButton()
              .setLabel(`Connect ${capitalizeFirst(s)}`)
              .setStyle("SECONDARY")
              .setEmoji(getEmoji(s.toUpperCase() as EmojiKey))
              .setCustomId(`profile_connect-${s}`)
          )
      ),
    ],
  }
}

export async function renderWallets({
  mochiWallets,
  wallets,
}: {
  mochiWallets: {
    data: any[]
    title?: string
  }
  wallets: {
    data: any[]
    title?: string
  }
}) {
  const strings = (
    await Promise.all([
      await renderListWallet(
        getEmoji("NFT2"),
        mochiWallets.title ?? "`Mochi`",
        mochiWallets.data,
        0,
        false
      ),
      await renderListWallet(
        getEmoji("WALLET_1"),
        wallets.title ?? "`On-chain`",
        wallets.data,
        mochiWallets.data.length,
        true
      ),
    ])
  ).filter(Boolean)

  return strings.join("\n\n")
}

export function collectSelection(
  reply: Message,
  author: User,
  components: any
) {
  reply
    .createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }
        const selectedQRCode = i.values[0]
        const [label, value] = selectedQRCode.split("_")
        let qrCodeValue = value
        if (label === "twitter") {
          qrCodeValue = `${TWITTER_USER_URL}/${value}`
        }
        if (label === "telegram") {
          qrCodeValue = `${TELEGRAM_USER_URL}/${value}`
        }
        const buffer = await qrcode.toBuffer(qrCodeValue, {
          width: 400,
        })
        const messageOptions = {
          embeds: [
            composeEmbedMessage(null, {
              title: `Here is your \`${label}\` QR code`,
              image: "attachment://qr.png",
            }),
          ],
          files: [new MessageAttachment(buffer, "qr.png")],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Back")
                .setStyle("SECONDARY")
                .setCustomId("back_qr")
            ),
          ],
        }

        const edited = (await i.editReply(messageOptions)) as Message
        edited
          .createMessageComponentCollector({
            filter: authorFilter(author.id),
            componentType: "BUTTON",
            time: 300000,
          })
          .on("collect", async (i) => {
            wrapError(edited, async () => {
              if (!i.deferred) {
                await i.deferUpdate().catch(() => null)
              }
              if (i.customId === "back_qr") {
                i.editReply({ files: [], embeds: reply.embeds, components })
              }
            })
          })
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

function sendKafka(profileId: string, username: string) {
  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    profileId,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_PROFILE
  )
  kafkaMsg.activity.content.username = username
  sendActivityMsg(kafkaMsg)
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

  sendKafka(dataProfile.id, member.user.username)

  const replyPayload = await compose(msg, member)

  return replyPayload
}
