import defi from "adapters/defi"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { WEBSITE_ENDPOINT } from "env"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeButtonLink, getExitButton } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
} from "utils/common"
import { awaitMessage } from "utils/discord"

export async function handleWalletAddition(msg: OriginalMessage) {
  const isTextMsg = msg instanceof Message
  const author = isTextMsg ? msg.author : msg.user
  const embed = composeEmbedMessage(null, {
    author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
    title: "Add Wallet",
    description: `Manage your crypto wallets\n${getEmoji(
      "pointingdown"
    )} Please choose "Connect Wallet" below to connect your metamask wallet.\nAlternatively, press Exit to abort.`,
    originalMsgAuthor: author,
    color: "#5CD97D",
  })
  const replyPayload = { embeds: [embed] }
  const reply = (await (isTextMsg
    ? msg.reply(replyPayload)
    : msg.editReply(replyPayload))) as Message
  const { data, ok, curl, log } = await defi.generateWalletVerification({
    userId: author.id,
    channelId: msg.channelId,
    messageId: reply.id,
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, description: log, curl })
  }
  const buttonRow = composeButtonLink(
    "Connect Wallet",
    `${WEBSITE_ENDPOINT}/verify?code=${data.code}`
  ).addComponents(getExitButton(author.id))
  await reply.edit({ components: [buttonRow] })
}

export async function redirectToAddMoreWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_add_more-")) return
  const userId = i.customId.split("-")[1]
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply()
  await handleWalletAddition(i)
}

export async function addWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_add-")) return
  const [userId, address] = i.customId.split("-").slice(1)
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply()
  await trackWallet(i, i.user, address, "")
  // await i.editReply(res)
  await renameWallet(i, userId, address)
  // const res = await trackWallet(i, i.user, address, "")
  // await i.editReply(res.messageOptions)
}

export async function renameWallet(
  i: ButtonInteraction,
  userId: string,
  address: string
) {
  const pointingright = getEmoji("pointingright")
  const reply = await i.editReply({
    embeds: [
      composeEmbedMessage(null, {
        author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
        description: `Set a short, easy-to-remember label for long, complicated wallet addresses.\n${pointingright} Enter label for \`${address}\` or \`cancel\` to skip.\nE.g. baddeed.eth`,
        color: "#5CD97D",
      }),
    ],
  })
  const { first, content } = await awaitMessage({
    authorId: userId,
    msg: reply as Message,
  })
  const skipped = content.toLowerCase() === "cancel"
  const alias = skipped ? "" : content
  const { ok, status, curl, log } = await defi.trackWallet({
    userId,
    address,
    alias,
    type: "eth",
  })
  if (!ok && status === 409) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Alias has been used",
      description: `This alias has been used for another address. Please enter another alias!\n${pointingright} You can see used aliases by using \`$wallet view\`.`,
    })
  }
  if (!ok) {
    throw new APIError({ msgOrInteraction: i, description: log, curl })
  }
  const successEmbed = new MessageEmbed()
    .setDescription(`${getEmoji("approve")} Wallet name has been changed!`)
    .setColor(msgColors.SUCCESS)
  const buttonRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `wallet_view_details-${address}`,
      style: "SECONDARY",
      label: `View ${alias} Wallet`,
    })
  )
  await first?.reply({ embeds: [successEmbed], components: [buttonRow] })
}

export async function trackWallet(
  msg: OriginalMessage,
  author: User,
  address: string,
  alias: string
) {
  const { valid, type } = isAddress(address)
  if (!valid) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid address",
      description:
        "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
    })
  }
  const { ok, log, curl, status } = await defi.trackWallet({
    userId: author.id,
    address,
    alias,
    type,
  })
  const pointingright = getEmoji("pointingright")
  if (!ok && status === 409) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Alias has been used",
      description: `This alias has been used for another address. Please enter another alias!\n${pointingright} You can see used aliases by using \`$wallet view\`.`,
    })
  }
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, description: log, curl })
  }
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
    description: `Set a short, easy-to-remember label for long, complicated wallet addresses.\n${pointingright} Enter label for \`${address}\` or press Skip.\nE.g. baddeed.eth`,
    color: "#5CD97D",
  })
  return {
    embeds: [embed],
    components: [composeViewWaletButtonRow(address)],
  }
}

function composeViewWaletButtonRow(address: string) {
  return new MessageActionRow().addComponents(
    new MessageButton({
      style: MessageButtonStyles.SUCCESS,
      label: "View wallet",
      customId: `wallet_view_details-${address}`,
      emoji: getEmoji("wallet"),
    })
  )
}
