import defi from "adapters/defi"
import { Message } from "discord.js"
import {
  APIError,
  DirectMessageNotAllowedError,
  InternalError,
  OriginalMessage,
} from "errors"
import fs from "fs"
import * as qrcode from "qrcode"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
} from "utils/common"
import { isTokenSupported } from "utils/tip-bot"
import * as processor from "./processor"
import { MOCHI_SERVER_INVITE_URL } from "utils/constants"

export async function deposit(
  msgOrInteraction: OriginalMessage,
  tokenSymbol: string
) {
  const symbol = tokenSymbol.toUpperCase()
  const author = getAuthor(msgOrInteraction)
  const isDm = msgOrInteraction.channel?.type === "DM"
  const validToken = await isTokenSupported(symbol)
  if (!validToken) {
    const pointingright = getEmoji("pointingright")
    throw new InternalError({
      msgOrInteraction,
      title: "Unsupported token",
      description: `**${symbol}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
  }

  const { ok, curl, log, data, error } =
    await defi.offchainTipBotAssignContract({
      user_id: author.id,
      token_symbol: tokenSymbol,
    })
  if (equalIgnoreCase(error ?? "", "contract not found or already assigned")) {
    const description = `${getEmoji(
      "nekosad"
    )} Unfortunately, no **${symbol}** contract is available at this time. Please try again later`
    throw new InternalError({
      msgOrInteraction,
      description,
    })
  }

  if (!ok) throw new APIError({ msgOrInteraction, description: log, curl })

  // create QR code image
  const qrFileName = `qr_${author.id}.png`
  await qrcode
    .toFile(qrFileName, data.contract.contract_address)
    .catch(() => null)
  const dmEmbed = composeEmbedMessage(null, {
    author: [`Deposit ${symbol}`, getEmojiURL(emojis.WALLET)],
    thumbnail: `attachment://${qrFileName}`,
    description: `Below is the deposit address linked to your Discord account. Please copy your deposit address and paste it into your third-party wallet or exchange.\n\n*Please send only **${symbol}** to this address.*\n\n${getEmoji(
      "clock"
    )} Your deposit address is **only valid for 3 hours**.\n\n**${symbol} Deposit Address**\n\`\`\`${
      data.contract.contract_address
    }\`\`\``,
  })
  //
  const dm = await author
    .send({
      embeds: [dmEmbed],
      files: [{ attachment: qrFileName }],
    })
    .catch(() => null)

  // delete QR code image
  fs.unlink(qrFileName, () => null)

  // failed to send dm
  if (!dm) {
    throw new DirectMessageNotAllowedError({
      message: msgOrInteraction,
      title: "Failed to send deposit info",
      description: `You have to enable Direct Message to receive **${symbol}** deposit address`,
    })
  }

  // replace with a msg without contract after 3 hours
  // -> force users to reuse $deposit
  // -> prevent users from depositing to wrong / expired contract
  processor.handleDepositExpiration(dm, symbol)

  const dmRedirectEmbed = composeEmbedMessage(null, {
    author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
    description: `${author}, your deposit address has been sent to you. Check your DM!`,
    originalMsgAuthor: author,
  })
  if (isDm) return null
  return {
    messageOptions: {
      embeds: [dmRedirectEmbed],
      components: [composeButtonLink("See the DM", dm.url)],
    },
  }
}

/**
 * remove deposit address after get expired (3h)
 *
 *  -> force users to reuse $deposit
 *
 *  -> prevent users from depositing to wrong / expired contract
 *
 * @param toEdit
 * @param token
 */
export function handleDepositExpiration(toEdit: Message, token: string) {
  const expiredEmbed = getErrorEmbed({
    title: `The ${token} deposit address is expired`,
    description: `Please re-run \`$deposit token \` to get the new address. If you have deposited but the balance was not topped up, contact the team via [Mochi Server](${MOCHI_SERVER_INVITE_URL}).`,
  })
  setTimeout(() => {
    toEdit.edit({
      embeds: [expiredEmbed],
      files: [],
    })
  }, 10800000)
}
