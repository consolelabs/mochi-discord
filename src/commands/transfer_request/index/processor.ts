import { ButtonInteraction, Message } from "discord.js"
import mochiPay from "../../../adapters/mochi-pay"
import { emojis, getEmojiURL } from "../../../utils/common"
import * as ed25519 from "@noble/ed25519"
import { sha512 } from "@noble/hashes/sha512"
import { MOCHI_APP_PRIVATE_KEY } from "env"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { getProfileIdByDiscord } from "utils/profile"
ed25519.etc.sha512Async = (...m) =>
  Promise.resolve(sha512(ed25519.etc.concatBytes(...m)))

export async function getMochiApplicationHeaders() {
  const privKey = new Uint8Array(
    Buffer.from(MOCHI_APP_PRIVATE_KEY, "hex"),
  ).slice(0, 32)
  const message = Math.floor(new Date().getTime() / 1000).toString()
  const messageHex = Buffer.from(message, "utf-8")
  const signature = await ed25519.signAsync(messageHex, privKey)
  return {
    "X-Message": message,
    "X-Signature": ed25519.etc.bytesToHex(Buffer.from(signature)),
    "X-Application": "Mochi",
  }
}

export async function approveTransferReq(i: ButtonInteraction) {
  // await i.deferReply()
  const [_, requestCode, appId] = i.customId.split("-")
  if (!requestCode || isNaN(+appId)) {
    return
  }

  const profileId = await getProfileIdByDiscord(i.user.id)
  const appHeaders = await getMochiApplicationHeaders()
  const { ok, status } = await mochiPay.approveTransferRequest({
    headers: appHeaders,
    profileId,
    appId,
    requestCode,
  })
  if (!ok) {
    await handleTransferRequestErr(i, status, "approved")
    return
  }

  const msg = i.message as Message
  const embed = msg.embeds[0]
  embed.setAuthor({
    iconURL: getEmojiURL(emojis.APPROVE),
    name: "Transfer request approved",
  })
  await msg.edit({ embeds: [embed], components: [] })
}

export async function rejectTransferReq(i: ButtonInteraction) {
  // await i.deferReply()
  const [_, requestCode, appId] = i.customId.split("-")
  if (!requestCode || isNaN(+appId)) {
    return
  }

  const profileId = await getProfileIdByDiscord(i.user.id)
  const appHeaders = await getMochiApplicationHeaders()
  const { ok, status } = await mochiPay.rejectTransferRequest({
    headers: appHeaders,
    profileId,
    appId,
    requestCode,
  })
  if (!ok) {
    await handleTransferRequestErr(i, status, "rejected")
    return
  }

  const msg = i.message as Message
  const embed = msg.embeds[0]
  embed.setAuthor({
    iconURL: getEmojiURL(emojis.REVOKE),
    name: "Transfer request rejected",
  })
  await msg.edit({ embeds: [embed], components: [] })
}

async function handleTransferRequestErr(
  i: ButtonInteraction,
  status: number | undefined,
  action: string,
) {
  if (status === 400) {
    // Check if it's a settled request error by fetching the actual transfer request
    const [_, requestCode, appId] = i.customId.split("-")
    
    try {
      // Get the actual transfer request status with proper headers
      const appHeaders = await getMochiApplicationHeaders()
      const { data: transferRequest } = await mochiPay.getTransferRequestByCode({
        headers: appHeaders,
        requestCode,
        appId,
      })
      
      if (!transferRequest) {
        throw new Error("Transfer request not found")
      }
      
      const msg = i.message as Message
      const embed = msg.embeds[0]
      
      // Update the original message to show it's settled and remove buttons
      embed.setAuthor({
        iconURL: getEmojiURL(emojis.INFO),
        name: "Transfer Request Settled",
      })
      
      // Use the actual status from the transfer request
      let settledStatus = "settled"
      if (transferRequest.status === "success") {
        settledStatus = "approved"
      } else if (transferRequest.status === "cancelled") {
        settledStatus = "rejected"
      }
      
      // Add a field to indicate the request has been settled with proper alignment
      const description = embed.description
      embed.description = `${description}\n${emojis.INFO}\`Status.       \`${settledStatus}\n\nThis transfer request has already been settled. You cannot take any further action.`
      
      await msg.edit({ embeds: [embed], components: [] })
      
      // Send ephemeral reply to the user
      const replyEmbed = composeEmbedMessage(null, {
        author: ["Request Already Settled", getEmojiURL(emojis.INFO)],
        description: `This transfer request has already been settled. You cannot take any further action.`,
      })

      await i.reply({ embeds: [replyEmbed], ephemeral: true })
    } catch (fetchError) {
      // If we can't fetch the transfer request, fall back to generic error
      const embed = composeEmbedMessage(null, {
        author: ["Action failed!", getEmojiURL(emojis.REVOKE)],
        description:
          "Transfer request is not available at the moment!\nPlease try again later!",
      })

      await i.reply({ embeds: [embed], ephemeral: true })
    }
  } else {
    // Handle other errors
    const embed = composeEmbedMessage(null, {
      author: ["Action failed!", getEmojiURL(emojis.REVOKE)],
      description:
        "Transfer request is not available at the moment!\nPlease try again later!",
    })

    await i.reply({ embeds: [embed], ephemeral: true })
  }

  return
}
