import defi from "adapters/defi"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { getExitButton } from "ui/discord/button"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, reverseLookup } from "utils/common"

export async function untrackWallet(
  msg: OriginalMessage,
  author: User,
  addressOrAlias: string
) {
  const {
    data: wallet,
    ok,
    status,
    curl,
    log,
  } = await defi.findWallet(author.id, addressOrAlias)
  const pointingright = getEmoji("pointingright")
  // wallet not found
  if (!ok && status === 404) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: " Invalid wallet information",
      description: `Your inserted address or alias was not saved.\n${pointingright} Add more wallets to easily track by \`$wallet add <address> [alias]\`.`,
    })
  }
  if (!ok) throw new APIError({ msgOrInteraction: msg, description: log, curl })
  const {
    ok: removed,
    curl: untrackCurl,
    log: untrackLog,
  } = await defi.untrackWallet({
    userId: author.id,
    address: wallet.address,
    alias: wallet.alias,
  })
  if (!removed) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: untrackCurl,
      description: untrackLog,
    })
  }
  // remove successfully
  const embed = getSuccessEmbed({
    title: "Successfully untrack the wallet address",
    description: `This wallet's balance won't be tracked anymore.\n${pointingright} You can track more wallet address by using \`$wallet add <address> [alias]\``,
  })
  const btnRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `wallet_add_more-${author.id}`,
      emoji: getEmoji("plus"),
      style: "SECONDARY",
      label: "Add More",
    })
  )
  return { messageOptions: { embeds: [embed], components: [btnRow] } }
}

export async function removeWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_remove-")) return
  const [userId, address] = i.customId.split("-").slice(1)
  await i.deferUpdate()
  if (i.user.id !== userId) {
    return
  }
  const response = await untrackWallet(i, i.user, address)
  const msg = i.message as Message
  await msg.edit(response.messageOptions)
}

export async function removeWalletConfirmation(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_remove_confirmation-")) return
  const [userId, address, alias] = i.customId.split("-").slice(1)
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply()
  const label = alias || (await reverseLookup(address))
  const embed = composeEmbedMessage(null, {
    author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
    description: `Do you want to remove wallet **${label || address}**?`,
    color: "#5CD97D",
  })
  const buttonRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `wallet_remove-${userId}-${address}`,
      style: "DANGER",
      label: "Remove",
    }),
    getExitButton(userId, "Cancel")
  )
  await i.editReply({ embeds: [embed], components: [buttonRow] })
}
