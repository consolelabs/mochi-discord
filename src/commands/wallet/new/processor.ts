import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { CommandInteraction, Message, MessageOptions } from "discord.js"
import { APIError } from "errors"
import { parseUnits } from "ethers/lib/utils"
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
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
} from "utils/common"
import { reply } from "utils/discord"
import { getToken } from "../../../utils/tip-bot"

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
    author: ["Confirm the transaction", getEmojiURL(emojis.APPROVE)],
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
      status: pfRes.status ?? 500,
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

        const t = await getToken(token)

        await i.deferReply({ ephemeral: true })
        const res: any = await mochiPay.generatePaymentCode({
          profileId,
          amount: parseUnits(
            amount.toLocaleString().replaceAll(",", ""),
            t?.decimal ?? 0,
          ).toString(),
          token,
          note,
          type: "paylink",
        })
        // insufficient balance
        if (!res.ok && equalIgnoreCase(res.err, "insufficient balance")) {
          // remove wallet selection
          await (<Message>i.message).edit({ components: [] })
          // reply with error embed
          const errEmbed = composeInsufficientBalanceEmbed({
            required: amount,
            symbol: token,
            author,
          })
          await i.editReply({ embeds: [errEmbed] })
          return
        }
        // api error
        if (!res.ok) {
          const { log: description, curl, status = 500 } = res
          throw new APIError({ msgOrInteraction, description, curl, status })
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
                  true,
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
