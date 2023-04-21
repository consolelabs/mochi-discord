import {
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import {
  APIError,
  DirectMessageNotAllowedError,
  InternalError,
  OriginalMessage,
} from "errors"
import fs from "fs"
import { InteractionHandler } from "handlers/discord/select-menu"
import * as qrcode from "qrcode"
import { Token } from "types/defi"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { emojis, getAuthor, getEmoji, getEmojiURL } from "utils/common"
import { MOCHI_SERVER_INVITE_URL } from "utils/constants"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import * as processor from "./processor"

export async function deposit(
  msgOrInteraction: OriginalMessage,
  token: string
) {
  const author = getAuthor(msgOrInteraction)
  const isDm = msgOrInteraction.channel?.type === "DM"
  const symbol = token.toUpperCase()
  const res: any = await mochiPay.getTokens({
    symbol,
  })
  // api error
  if (!res.ok) {
    const { log: description, curl } = res
    throw new APIError({ msgOrInteraction, description, curl })
  }
  const tokens = res.data.filter(
    (t: any) => t.chain_id !== "0" && Boolean(t.chain)
  )
  if (tokens?.length < 1) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    throw new InternalError({
      msgOrInteraction,
      title: "Unsupported token",
      description: `**${symbol}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
  }
  if (tokens?.length > 1) {
    const options: MessageSelectOptionData[] = tokens.map((token: Token) => ({
      label: `${token.name} ${token.chain?.name ?? ""}`,
      value: `${token.symbol}|${token.chain_id}`,
    }))
    const selectionRow = composeDiscordSelectionRow({
      customId: "deposit-select-token",
      placeholder: "Select a token",
      options,
    })
    const embed = composeEmbedMessage(null, {
      originalMsgAuthor: author,
      author: ["Multiple results found", getEmojiURL(emojis.MAG)],
      description: `There are \`${token}\` token on multiple chains: ${tokens
        .map((t: any) => {
          return `\`${t.chain?.name}\``
        })
        .filter((s: any) => Boolean(s))
        .join(", ")}.\nPlease select one of the following`,
    })
    return {
      messageOptions: {
        embeds: [embed],
        components: [selectionRow],
      },
      interactionOptions: {
        handler,
      },
    }
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const { ok, curl, log, data } = await mochiPay.deposit({
    profileId,
    token: symbol,
    chainId: tokens[0].chain_id,
  })
  if (!ok) throw new APIError({ curl, description: log })

  // create QR code image
  const qrFileName = `qr_${author.id}.png`
  await qrcode.toFile(qrFileName, data.contract.address).catch(() => null)
  const dmEmbed = composeEmbedMessage(null, {
    author: [`Deposit ${symbol}`, getEmojiURL(emojis.WALLET)],
    thumbnail: `attachment://${qrFileName}`,
    description: `Below is the deposit address linked to your Discord account. Please copy your deposit address and paste it into your third-party wallet or exchange.\n\n*Please send only **${symbol}** to this address.*\n\n${getEmoji(
      "CLOCK"
    )} Your deposit address is **only valid for 3 hours**.\n\n**${getEmoji(
      "ANIMATED_POINTING_DOWN",
      true
    )} ${symbol} Deposit Address${
      data.contract.chain?.name ? ` (${data.contract.chain.name})` : ""
    }**${getEmoji("ANIMATED_POINTING_DOWN", true)}`,
  })
  //
  const dm = await author
    .send({
      embeds: [dmEmbed],
      files: [{ attachment: qrFileName }],
    })
    .then(() => author.send(data.contract.address))
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

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const [symbol, chainId] = interaction.values[0].split("|")

  const author = getAuthor(msgOrInteraction)
  const isDm = msgOrInteraction.channel?.type === "DM"
  const profileId = await getProfileIdByDiscord(author.id)
  const { ok, curl, log, data } = await mochiPay.deposit({
    profileId,
    token: symbol,
    chainId,
  })
  if (!ok) throw new APIError({ curl, description: log })

  // create QR code image
  const qrFileName = `qr_${author.id}.png`
  await qrcode.toFile(qrFileName, data.contract.address).catch(() => null)
  const dmEmbed = composeEmbedMessage(null, {
    author: [`Deposit ${symbol}`, getEmojiURL(emojis.WALLET)],
    thumbnail: `attachment://${qrFileName}`,
    description: `Below is the deposit address linked to your Discord account. Please copy your deposit address and paste it into your third-party wallet or exchange.\n\n*Please send only **${symbol}** to this address.*\n\n${getEmoji(
      "CLOCK"
    )} Your deposit address is **only valid for 3 hours**.\n\n**${getEmoji(
      "ANIMATED_POINTING_DOWN",
      true
    )} ${symbol} Deposit Address${
      data.contract.chain?.name ? ` (${data.contract.chain.name})` : ""
    }**${getEmoji("ANIMATED_POINTING_DOWN", true)}`,
  })
  //
  const dm = await author
    .send({
      embeds: [dmEmbed],
      files: [{ attachment: qrFileName }],
    })
    .then(() => author.send(data.contract.address))
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

  if (isDm)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${author}, your deposit address has been sent to you.`,
            originalMsgAuthor: author,
          }),
        ],
        components: [],
      },
    }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
          description: `${author}, your deposit address has been sent to you. Check your DM!`,
          originalMsgAuthor: author,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    },
  }
}
