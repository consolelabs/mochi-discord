import defi from "adapters/defi"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  lookUpDomains,
  msgColors,
  resolveNamingServiceDomain,
} from "utils/common"
import { getProfileIdByDiscord } from "../../../utils/profile"

export async function untrackWallet(
  msg: OriginalMessage,
  author: User,
  addressOrAlias: string,
) {
  const resolvedAddress = await resolveNamingServiceDomain(addressOrAlias)
  if (resolvedAddress) {
    addressOrAlias = resolvedAddress
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const {
    data: wallet,
    ok,
    status = 500,
    curl,
    log,
    error,
  } = await defi.findWallet(profileId, addressOrAlias)
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  // wallet not found
  if (!ok && status === 404) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: " Invalid wallet information",
      description: `Your inserted address or alias was not saved.\n${pointingright} Add more wallets to easily track by \`$wallet add <address> [alias]\`.`,
    })
  }
  if (!ok)
    throw new APIError({
      msgOrInteraction: msg,
      description: log,
      curl,
      status,
      error,
    })

  const {
    ok: removed,
    curl: untrackCurl,
    log: untrackLog,
    status: untrackStatus = 500,
    error: untrackError,
  } = await defi.untrackWallet({
    profileId,
    address: wallet.address,
    alias: wallet.alias,
  })
  if (!removed) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: untrackCurl,
      description: untrackLog,
      status: untrackStatus,
      error: untrackError,
    })
  }
  // remove successfully
  const embed = getSuccessEmbed({
    title: "Wallet removed",
    description: `
${pointingright} To follow other wallets, ${await getSlashCommand(
      "wallet follow",
    )}.
${pointingright} To track other wallets, use ${await getSlashCommand(
      "wallet track",
    )}.
${pointingright} To copy trade, use ${await getSlashCommand("wallet copy")}.
${pointingright} Click \`Wallets\` to view all tracked wallets.
    `,
  })
  const btnRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Wallets")
      .setStyle("PRIMARY")
      .setCustomId(`view_wallets`)
      .setEmoji(emojis.WALLET_1),
  )
  return { msgOpts: { embeds: [embed], components: [btnRow] } }
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
  await msg.edit(response.msgOpts)
}

export async function removeWalletConfirmation(i: ButtonInteraction) {
  await (i.message as Message).edit({ components: [] })
  if (!i.customId.startsWith("wallet_remove_confirmation-")) return
  const [userId, address, alias] = i.customId.split("-").slice(1)
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply()
  const label = alias || (await lookUpDomains(address))
  const embed = composeEmbedMessage(null, {
    author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
    description: `Do you want to remove wallet **${label || address}**?`,
    color: msgColors.SUCCESS,
  })
  const buttonRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `wallet_remove-${userId}-${address}`,
      style: "DANGER",
      label: "Remove",
    }),
    new MessageButton({
      customId: `exit-${userId}`,
      emoji: getEmoji("REVOKE"),
      style: "SECONDARY",
      label: "Cancel",
    }),
  )
  await i.editReply({ embeds: [embed], components: [buttonRow] })
}
