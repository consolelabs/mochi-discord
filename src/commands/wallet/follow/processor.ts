import defi from "adapters/defi"
import { User, MessageActionRow, MessageButton } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis } from "utils/common"
import { getEmojiURL } from "utils/common"
import { shortenHashOrAddress } from "utils/common"
import { getEmoji, isAddress, msgColors } from "utils/common"
import { WalletTrackingType } from ".."

export async function followWallet(
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
    type: WalletTrackingType.Follow,
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
      description: "Couldn't follow wallet",
    })
  }

  const { msgOpts } = renderTrackingResult(address, chain, alias)

  return { msgOpts }
}

function renderTrackingResult(address: string, chain: string, alias: string) {
  return {
    context: {
      address,
      chain,
      alias,
    },
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: [
            `${shortenHashOrAddress(
              address
            )} has been added to the watchlist to follow`,
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
)} Track this wallet's transaction by clicking on button \`Track\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} Copy trade by clicking on button \`Copy\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} To unfollow, click on button \`Unfollow\`.
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
            .setLabel("Track")
            .setStyle("SECONDARY")
            .setCustomId("track_wallet")
            .setEmoji(emojis.ANIMATED_STAR),
          new MessageButton()
            .setLabel("Copy")
            .setStyle("SECONDARY")
            .setCustomId("copy_wallet")
            .setEmoji(emojis.SWAP_ROUTE),
          new MessageButton()
            .setLabel("Unfollow")
            .setStyle("SECONDARY")
            .setCustomId("untrack_wallet")
            .setEmoji(emojis.REVOKE)
        ),
      ],
    },
  }
}
