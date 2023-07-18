import defi from "adapters/defi"
import { MessageActionRow, MessageButton, User } from "discord.js"
import { InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
  resolveNamingServiceDomain,
  shortenHashOrAddress,
} from "utils/common"

import { WalletTrackingType } from "../"
import { getProfileIdByDiscord } from "../../../utils/profile"

export async function followWallet(
  msg: OriginalMessage,
  author: User,
  address: string,
  alias = ""
) {
  const resolvedAddress = await resolveNamingServiceDomain(address)
  if (resolvedAddress) {
    address = resolvedAddress
  }

  const { valid, chainType } = isAddress(address)
  if (!valid) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid address",
      description:
        "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
    })
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const { ok, status } = await defi.trackWallet({
    profileId,
    address,
    alias,
    chainType,
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

  return await renderTrackingResult(author, address, alias)
}

async function renderTrackingResult(
  user: User,
  address: string,
  alias: string
) {
  return {
    context: {
      user,
      address,
      alias,
    },
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: [
            `${shortenHashOrAddress(address)} added to watchlist`,
            getEmojiURL(emojis.CHECK),
          ],
          color: msgColors.SUCCESS,
          description: `
${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
            "wallet alias set"
          )} to assign name for any tracking wallet.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} View list tracking wallet by clicking on button \`Wallets\` below.
${getEmoji(
  "ANIMATED_POINTING_RIGHT",
  true
)} Pick any other buttons if you change your decision.
            `,
        }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Wallets")
            .setStyle("PRIMARY")
            .setCustomId(`view_wallets`)
            .setEmoji(emojis.WALLET_1),
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
