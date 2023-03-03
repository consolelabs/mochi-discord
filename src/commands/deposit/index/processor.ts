import { CommandInteraction, Message } from "discord.js"
import { DirectMessageNotAllowedError, InternalError } from "errors"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { APIError } from "errors"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import * as qrcode from "qrcode"
import defi from "adapters/defi"
import fs from "fs"
import { composeButtonLink } from "ui/discord/button"
import CacheManager from "cache/node-cache"

export async function deposit(
  msgOrInteraction: Message | CommandInteraction,
  tokenSymbol: string
) {
  const msg =
    msgOrInteraction instanceof Message
      ? <Message>msgOrInteraction
      : <CommandInteraction>msgOrInteraction
  const author =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.author
      : msgOrInteraction.user
  try {
    const { ok, status, curl, log, data, error } =
      await defi.offchainTipBotAssignContract({
        user_id: author.id,
        token_symbol: tokenSymbol,
      })
    if (!ok && status === 404) {
      let description
      switch (error?.toLowerCase()) {
        case "contract not found or already assigned":
          description = `${getEmoji(
            "nekosad"
          )} Unfortunately, no **${tokenSymbol.toUpperCase()}** contract is available at this time. Please try again later`
          break
        default:
          description = `**${tokenSymbol.toUpperCase()}** hasn't been supported.\n${getEmoji(
            "POINTINGRIGHT"
          )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
            "POINTINGRIGHT"
          )} To add your token, run \`$token add\`.`
          break
      }
      throw new InternalError({
        title: "Command error",
        msgOrInteraction: msg,
        description,
      })
    }
    if (!ok) {
      throw new APIError({ msgOrInteraction: msg, curl, description: log })
    }

    // create QR code image
    const qrFileName = `qr_${author.id}.png`
    await qrcode
      .toFile(qrFileName, data.contract.contract_address)
      .catch(() => null)
    const dm = await author
      .send({
        embeds: [
          composeEmbedMessage(null, {
            author: [
              `Deposit ${tokenSymbol.toUpperCase()}`,
              getEmojiURL(emojis.WALLET),
            ],
            thumbnail: `attachment://${qrFileName}`,
            description: `Below is the wallet address linked to your Discord account. Please copy your deposit address and paste it into your third-party wallet or exchange.\n\n*Please send only **${tokenSymbol.toUpperCase()}** to this address.*\n\n${getEmoji(
              "CLOCK"
            )} Your deposit address is **only valid for 3 hours**.\n\n**${tokenSymbol.toUpperCase()} Wallet Address**\n\`\`\`${
              data.contract.contract_address
            }\`\`\``,
          }),
        ],
        files: [{ attachment: qrFileName }],
      })
      .catch(() => null)

    // delete QR code image
    fs.unlink(qrFileName, () => null)

    // failed to send dm
    if (dm == null) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Failed to send deposit info",
              description: `You have to enable Direct Message to receive **${tokenSymbol.toUpperCase()}** deposit address`,
            }),
          ],
        },
      }
    }
    // cache message to update when expire
    CacheManager.set({
      pool: "deposit",
      key: `deposit-${dm.id}`,
      val: "",
      ttl: 10800, // 3 hours
      callOnExpire: () => handleDepositExpire(dm, tokenSymbol),
    })
    if (msg.channel?.type === "DM") return null
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${author}, your deposit address has been sent to you. Check your DM!`,
            color: "#5CD97D",
          }),
        ],
        components: [composeButtonLink("See the DM", dm.url)],
      },
    }
  } catch (e: any) {
    if (msg.channel?.type !== "DM" && e.httpStatus === 403) {
      throw new DirectMessageNotAllowedError({ message: msg })
    }
    throw e
  }
}

async function handleDepositExpire(reply: Message, token: string) {
  const expiredEmbed = getErrorEmbed({
    title: `The ${token.toUpperCase()} wallet address has expired`,
    thumbnail: "attachment://qr.png",
    description: `Please re-run \`$deposit token\` to get new address\n\n${getEmoji(
      "CLOCK"
    )} Your deposit address is **no longer valid**.`,
  })
  await reply.edit({
    embeds: [expiredEmbed],
  })
}
