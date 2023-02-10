import defi from "adapters/defi"
import { User } from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"

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
      message: msg,
      title: " Invalid wallet information",
      description: `Your inserted address or alias was not saved.\n${pointingright} Add more wallets to easily track by \`$wallet add <address> [alias]\`.`,
    })
  }
  if (!ok) throw new APIError({ message: msg, description: log, curl })
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
      message: msg,
      curl: untrackCurl,
      description: untrackLog,
    })
  }
  // remove successfully
  const embed = getSuccessEmbed({
    title: "Successfully untrack the wallet address",
    description: `This wallet's balance won't be tracked anymore.\n${pointingright} You can track more wallet address by using \`$wallet add <address> [alias]\``,
  })
  return { messageOptions: { embeds: [embed] } }
}
