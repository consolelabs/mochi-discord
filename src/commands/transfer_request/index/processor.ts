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
    handleTransferRequestErr(i, status)
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
    handleTransferRequestErr(i, status)
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
) {
  if (status === 400) {
    const embed = composeEmbedMessage(null, {
      author: ["Action failed!", getEmojiURL(emojis.REVOKE)],
      description:
        "Transfer request is not available at the moment!\nPlease try again later!",
    })

    await i.reply({ embeds: [embed], ephemeral: true })
  }

  return
}
