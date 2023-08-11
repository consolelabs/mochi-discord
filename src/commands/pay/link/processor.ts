import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { CommandInteraction, Message, MessageOptions } from "discord.js"
import { APIError } from "errors"
import fs from "fs"
import * as qrcode from "qrcode"
import { RunResult } from "types/common"
import {
  composeEmbedMessage,
  composeInsufficientBalanceEmbed,
  composeMyWalletSelection,
} from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import {
  TokenEmojiKey,
  emojis,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
} from "utils/common"
import { reply } from "utils/discord"

export async function run({
  msgOrInteraction,
  amount,
  token,
  note,
}: {
  msgOrInteraction: Message | CommandInteraction
  amount: number
  token: TokenEmojiKey
  note?: string
}) {
  const author = getAuthor(msgOrInteraction)
  const tokenEmoji = getEmojiToken(token)
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["Select a wallet", getEmojiURL(emojis.APPROVE)],
    description:
      "Pay Link lets you easily deposit funds into newly generated wallets, which can then be withdrawn by anyone that has access to those links. Pay Link expires 3 days after created.",
    thumbnail: getEmojiURL(emojis.CASH),
  }).addFields(
    {
      name: "Amount",
      value: `${tokenEmoji} ${amount} ${token}`,
      inline: false,
    },
    ...(note
      ? [
          {
            name: `Message ${getEmoji("ANIMATED_CHAT", true)}`,
            value: `\`\`\`${note}\`\`\``,
            inline: false,
          },
        ]
      : []),
    {
      name: "\u200b",
      value: `Please choose a wallet to create a pay link ${getEmoji(
        "ANIMATED_POINTING_DOWN",
        true
      )}`,
      inline: false,
    }
  )
  const options = await composeMyWalletSelection(author.id)
  const selectionRow = composeDiscordSelectionRow({
    customId: "pay_link_select_wallet",
    placeholder: "Select a wallet to tip",
    options,
  })
  // get profile id
  const pfRes = await profile.getByDiscord(author.id)
  if (pfRes.err) {
    throw new APIError({
      msgOrInteraction,
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: "",
    })
  }
  const profileId = pfRes.id
  const response: RunResult<MessageOptions> = {
    messageOptions: {
      embeds: [embed],
      components: [selectionRow],
    },
    selectMenuCollector: {
      options: {
        max: 1,
      },
      handler: async (i) => {
        const selected = i.values[0]
        // TODO: add case on-chain wallets, only accept mochi wallet for now
        if (!selected.startsWith("mochi_")) {
          await i.deferUpdate()
          return
        }
        await i.deferReply({ ephemeral: true })
        const {
          data: balances,
          ok,
          curl,
          log,
        } = await mochiPay.getBalances({
          profileId,
          token,
        })
        if (!ok) {
          throw new APIError({ msgOrInteraction, description: log, curl })
        }
        if (!balances.length) {
          const embed = composeInsufficientBalanceEmbed({
            author,
            current: 0,
            required: amount,
            symbol: token,
          })
          i.deleteReply().catch(() => null)
          return { messageOptions: { embeds: [embed], components: [] } }
        }
        const balance = balances[0]
        const decimal = balance?.token?.decimal ?? 0
        const current = +balance?.amount / Math.pow(10, decimal)
        if (current < amount) {
          const embed = composeInsufficientBalanceEmbed({
            author,
            current,
            required: amount,
            symbol: token,
          })
          i.deleteReply()
          return { messageOptions: { embeds: [embed], components: [] } }
        }

        const res: any = await mochiPay.generatePaymentCode({
          profileId,
          amount: amount.toString(),
          token,
          note,
          type: "paylink",
        })
        // api error
        if (!res.ok) {
          const { log: description, curl } = res
          throw new APIError({ msgOrInteraction, description, curl })
        }
        // compose pay-link embed
        const payCode = res.data.code
        const paylink = `https://mochi.gg/pay/${payCode}`
        const qrFileName = `qr_paylink_${author.id}.png`
        await qrcode.toFile(qrFileName, paylink).catch(() => null)
        const embed = composeEmbedMessage(null, {
          thumbnail: `attachment://${qrFileName}`,
          originalMsgAuthor: author,
          author: [
            "Congrats! You've just created a pay link",
            getEmojiURL(emojis.CASH),
          ],
          description: `Here's ${paylink} ${tokenEmoji} ${amount} ${token} ${
            note
              ? `with message ${getEmoji(
                  "ANIMATED_CHAT",
                  true
                )} \`\`\`${note}\`\`\``
              : ""
          }`,
        })
        // remove wallet selection
        await (<Message>i.message).edit({ components: [] })
        // reply with ephemeral
        await i.editReply({
          embeds: [embed],
          files: [{ attachment: qrFileName }],
          components: [],
        })
        // remove qr file
        fs.unlink(qrFileName, () => null)
      },
    },
  }
  await reply(msgOrInteraction, response)
}
