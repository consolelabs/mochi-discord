import defi from "adapters/defi"
import { User, MessageActionRow, MessageButton } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis } from "utils/common"
import { getEmojiURL } from "utils/common"
import { shortenHashOrAddress } from "utils/common"
import { getEmoji, isAddress, msgColors } from "utils/common"
import { WalletTrackingType } from ".."

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
    type: WalletTrackingType.Track,
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

  const { messageOptions } = renderTrackingResult(
    msg,
    author.id,
    address,
    chain,
    alias
  )

  return messageOptions
}

function renderTrackingResult(
  msg: OriginalMessage,
  authorID: string,
  address: string,
  chain: string,
  alias: string
) {
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: [
            `${shortenHashOrAddress(
              address
            )} has been added to the watchlist to track`,
            getEmojiURL(emojis.CHECK),
          ],
          color: msgColors.SUCCESS,
          description: `
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} View wallet watchlist by clicking on button \`Watchlist\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} Follow this wallet by clicking on button \`Follow\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} Copy trade by clicking on button \`Copy\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} To untrack, click on button \`Untrack\`.
            `,
        }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Watchlist")
            .setStyle("PRIMARY")
            .setCustomId(`view_wallet`)
            .setEmoji(emojis.PROPOSAL),
          new MessageButton()
            .setLabel("Follow")
            .setStyle("SECONDARY")
            .setCustomId(`follow_wallet/${address}/${chain}/${alias}`)
            .setEmoji(emojis.PLUS),
          new MessageButton()
            .setLabel("Copy")
            .setStyle("SECONDARY")
            .setCustomId(`copy_wallet/${address}/${chain}/${alias}`)
            .setEmoji(emojis.SWAP_ROUTE),
          new MessageButton()
            .setLabel("Untrack")
            .setStyle("SECONDARY")
            .setCustomId(`untrack_wallet/${address}`)
            .setEmoji(emojis.REVOKE)
        ),
      ],
    },
  }
}
