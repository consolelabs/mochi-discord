import { ButtonInteraction, Message } from "discord.js"
import mochiPay from "../../../adapters/mochi-pay"
import { emojis, getEmojiURL } from "../../../utils/common"

export async function approveTransferReq(i: ButtonInteraction) {
  await i.deferUpdate()
  const requestCode = i.customId.split("-")[1]
  if (!requestCode) {
    return
  }

  const { ok } = await mochiPay.approveTransferRequest({
    requestCode,
  })
  if (!ok) return

  const msg = i.message as Message
  const embed = msg.embeds[0]
  embed.setAuthor({
    iconURL: getEmojiURL(emojis.APPROVE),
    name: "Transfer request approved",
  })
  await msg.edit({ embeds: [embed], components: [] })
}

export async function rejectTransferReq(i: ButtonInteraction) {
  await i.deferUpdate()
  const requestCode = i.customId.split("-")[1]
  if (!requestCode) {
    return
  }

  const { ok } = await mochiPay.rejectTransferRequest({
    requestCode,
  })
  if (!ok) return

  const msg = i.message as Message
  const embed = msg.embeds[0]
  embed.setAuthor({
    iconURL: getEmojiURL(emojis.REVOKE),
    name: "Transfer request rejected",
  })
  await msg.edit({ embeds: [embed], components: [] })
}
