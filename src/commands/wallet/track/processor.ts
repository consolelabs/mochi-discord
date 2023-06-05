import defi from "adapters/defi"
import { BalanceType, renderBalances } from "commands/balances/index/processor"
import { User } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { getEmoji, isAddress } from "utils/common"
import { WALLET_TRACKING_TRACK } from "utils/constants"

export async function trackWallet(
  msg: OriginalMessage,
  author: User,
  address: string,
  chain: string,
  alias = ""
) {
  const { valid, chainType } = isAddress(address)
  if (!valid) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid address",
      description:
        "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
    })
  }

  if (chain != chainType) {
    chain = chainType
  }

  const { ok, status } = await defi.trackWallet({
    userId: author.id,
    address,
    alias,
    chainType: chain,
    type: WALLET_TRACKING_TRACK,
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
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't track wallet",
    })
  }
  const { messageOptions } = await renderBalances(
    author.id,
    msg,
    BalanceType.Onchain,
    address
  )

  const iconURl = messageOptions.embeds[0].author?.iconURL
  if (alias) {
    messageOptions.embeds[0].setAuthor(alias, iconURl)
  } else {
    messageOptions.embeds[0].setAuthor("Wallet tracked", iconURl)
  }

  return messageOptions
}
