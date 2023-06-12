import defi from "adapters/defi"
import { User, MessageActionRow, MessageButton } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import {
  getEmoji,
  isAddress,
  emojis,
  getEmojiURL,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { WalletTrackingType } from ".."
import { composeEmbedMessage } from "ui/discord/embed"

export async function copyWallet(
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
    type: WalletTrackingType.Copy,
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
      description: "Couldn't copy wallet",
    })
  }
  const { msgOpts } = renderTrackingResult(address, chain, alias)

  return { msgOpts, context: { user: author, address } }
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
            )} has been added to the watchlist to copy trades`,
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
)} Track wallet's transactions by clicking on button \`Track\`.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} To remove copy trade setting, click on button \`Uncopy\`.
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
            .setCustomId("follow_wallet")
            .setEmoji(emojis.PLUS),
          new MessageButton()
            .setLabel("Track")
            .setStyle("SECONDARY")
            .setCustomId("track_wallet")
            .setEmoji(emojis.ANIMATED_STAR),
          new MessageButton()
            .setLabel("Uncopy")
            .setStyle("SECONDARY")
            .setCustomId("untrack_wallet")
            .setEmoji(emojis.REVOKE)
        ),
      ],
    },
  }
}
