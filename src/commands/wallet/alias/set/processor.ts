import defi from "adapters/defi"
import { User } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  AddressChainType,
  EmojiKey,
  emojis,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
  resolveNamingServiceDomain,
  shortenHashOrAddress,
} from "utils/common"
import { getProfileIdByDiscord } from "../../../../utils/profile"

export async function updateAlias(
  msg: OriginalMessage,
  author: User,
  wallet: string,
  alias = ""
) {
  const resolvedAddress = await resolveNamingServiceDomain(wallet)
  if (resolvedAddress !== "") {
    wallet = resolvedAddress
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const { data, status } = await defi.updateTrackingWalletInfo({
    profileId,
    wallet,
    alias,
  })

  if (status !== 200) {
    throw new InternalError(
      await composeAliasErrorMsg(msg, wallet, alias, status)
    )
  }

  const { chainType } = isAddress(data?.address || "")

  if (alias === "") {
    return await composeAliasRemovedMsg(data, chainType)
  }

  return await composeAliasUpdatedMsg(data, chainType, alias)
}

async function composeAliasUpdatedMsg(
  data: Record<string, any> | null,
  chainType: AddressChainType,
  alias: string
) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: [`Alias updated`, getEmojiURL(emojis.CHECK)],
          color: msgColors.SUCCESS,
          description: `
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} You can see used aliases by using ${await getSlashCommand("wallet list")}.
${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
            "wallet alias set"
          )} to change to another alias.\n
**Detail**
${getEmoji("WALLET_1")} \`Wallet.    ${shortenHashOrAddress(
            data?.address
          )}\` ${getEmoji(chainType as EmojiKey)}
${getEmoji("CONVERSION")} \`Alias.     ${
            alias.length >= 16 ? shortenHashOrAddress(alias) : alias
          }\`
          `,
        }),
      ],
    },
  }
}

async function composeAliasRemovedMsg(
  data: Record<string, any> | null,
  chainType: AddressChainType
) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: [`Alias is removed`, getEmojiURL(emojis.CHECK)],
          color: msgColors.SUCCESS,
          description: `
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} You can see used aliases by using ${await getSlashCommand("wallet list")}.
${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
            "wallet alias set"
          )} to change to another alias.\n
**Detail**
${getEmoji("WALLET_1")} \`Wallet.    ${shortenHashOrAddress(
            data?.address
          )}\` ${getEmoji(chainType as EmojiKey)}
`,
        }),
      ],
    },
  }
}

async function composeAliasErrorMsg(
  msg: OriginalMessage,
  wallet: string,
  alias: string,
  code: number | undefined
) {
  let reason = ""
  switch (code) {
    case 409:
      reason = "Alias already exists"
      break
    case 404:
      reason = "Wallet not found"
      break
    default:
      reason = "Unexpected internal error"
      break
  }

  let description = `
    ${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Some unexpected error occurred. Please try again later!
    ${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Can try ${await getSlashCommand(
    "wallet list"
  )} to see your tracking wallets.

    **Detail**
    ${getEmoji("CONFIG")}\`Reason.   \`${reason}
    ${getEmoji("WALLET_1")}\`Wallet.   \`${shortenHashOrAddress(wallet)}
  `

  if (alias !== "") {
    description += `${getEmoji("CONVERSION")}\`Alias.    \`${alias}`
  }

  return {
    msgOrInteraction: msg,
    title: alias === "" ? "Remove alias failed" : "Set alias failed",
    description: description,
  }
}
