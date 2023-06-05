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
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  emojis,
  EmojiKey,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
} from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
import { awaitMessage } from "utils/discord"
import profile from "../../../adapters/profile"
import { getProfileIdByDiscord } from "../../../utils/profile"

const supportedChains = new Map<string, string>([
  ["EVM", "EVM chains"],
  ["SOL", "Solana"],
  ["RON", "Ronin"],
  ["SUI", "Sui"],
  ["APT", "Aptos"],
  ["NEAR", "Near"],
])

function renderListPlatform(platforms: Map<string, string>) {
  const listChains = Array.from(platforms)

  if (!listChains.length) return ""

  return formatDataTable(
    listChains.map((val) => ({
      symbol: val[0],
      name: val[1],
    })),
    {
      cols: ["symbol", "name"],
      rowAfterFormatter: (formatted, i) => {
        return `${getEmoji(listChains[i][0] as EmojiKey)} ${formatted}`
      },
    }
  ).joined
}

export async function handleWalletAddition(msg: OriginalMessage) {
  const isTextMsg = msg instanceof Message
  const author = isTextMsg ? msg.author : msg.user
  const embed = composeEmbedMessage(null, {
    author: ["Connect On-chain Wallet", getEmojiURL(emojis.WALLET_1)],
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Please click on \`Verify Wallet\` below to connect your cryptocurrency wallet.
    ${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Currently, we only support the following chains.\n
    ${renderListPlatform(supportedChains)}
    `,
    originalMsgAuthor: author,
    color: msgColors.SUCCESS,
  })
  // request profile code
  const profileId = await getProfileIdByDiscord(author.id)
  const { data, ok, curl, log } = await profile.requestProfileCode(profileId)
  if (!ok) throw new APIError({ curl, description: log, msgOrInteraction: msg })
  const buttonRow = composeButtonLink(
    "Verify Wallet",
    `${HOMEPAGE_URL}/verify?code=${data.code}&guild_id=${msg.guildId ?? ""}`,
    getEmoji("ANIMATED_VAULT_KEY", true)
  )

  return {
    embeds: [embed],
    components: [buttonRow],
  }
}

export async function redirectToAddMoreWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_add_more-")) return
  const userId = i.customId.split("-")[1]
  if (i.user.id !== userId) {
    await i.deferUpdate()
    return
  }
  await i.deferReply({ ephemeral: true })
  await handleWalletAddition(i)
}

export async function addWallet(i: ButtonInteraction) {
  await (i.message as Message).edit({ components: [] })
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
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const reply = await i.editReply({
    embeds: [
      composeEmbedMessage(null, {
        author: ["mochi.gg", getEmojiURL(emojis.MOCHI_SQUARE)],
        description: `Set a short, easy-to-remember label for long, complicated wallet addresses.\n${pointingright} Enter label for \`${address}\` or \`cancel\` to skip.\nE.g. baddeed.eth`,
        color: msgColors.SUCCESS,
      }),
    ],
  })
  const { first, content } = await awaitMessage({
    authorId: userId,
    msg: reply as Message,
    timeout: 60000,
    timeoutResponse: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Timeout!",
          description:
            "You can rename wallet later in `$wallet view <address>`",
        }),
      ],
    },
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
    .setDescription(`${getEmoji("CHECK")} Wallet name has been changed!`)
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
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
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
    color: msgColors.SUCCESS,
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
      emoji: getEmoji("WALLET"),
    })
  )
}
