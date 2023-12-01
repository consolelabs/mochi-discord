import { Message } from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  emojis,
  EmojiKey,
  getEmoji,
  getEmojiURL,
  msgColors,
} from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
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
    },
  ).joined
}

export async function handleWalletAddition(msg: OriginalMessage) {
  const isTextMsg = msg instanceof Message
  const author = isTextMsg ? msg.author : msg.user
  const embed = composeEmbedMessage(null, {
    author: ["Connect On-chain Wallet", getEmojiURL(emojis.WALLET_1)],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Please click on \`Verify Wallet\` below to connect your cryptocurrency wallet.`,
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Currently, we only support the following chains.\n`,
      renderListPlatform(supportedChains),
    ].join("\n"),
    originalMsgAuthor: author,
    color: msgColors.SUCCESS,
  })
  // request profile code
  const profileId = await getProfileIdByDiscord(author.id)
  const {
    data,
    ok,
    curl,
    log,
    status = 500,
    error,
  } = await profile.requestProfileCode(profileId)
  if (!ok)
    throw new APIError({
      curl,
      description: log,
      msgOrInteraction: msg,
      status,
      error,
    })
  const buttonRow = composeButtonLink(
    "Verify Wallet",
    `${HOMEPAGE_URL}/verify?code=${data.code}&guild_id=${msg.guildId ?? ""}`,
    getEmoji("ANIMATED_VAULT_KEY", true),
  )

  return {
    msgOpts: {
      embeds: [embed],
      components: [buttonRow],
    },
  }
}
