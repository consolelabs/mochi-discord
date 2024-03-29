import defi from "adapters/defi"
import { MessageActionRow, MessageSelectMenu, User } from "discord.js"
import { ResponseGetTrackingWalletsResponse } from "types/api"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  capitalizeFirst,
  emojis,
  getEmoji,
  getEmojiURL,
  lookUpDomains,
  shortenHashOrAddress,
} from "utils/common"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { formatUsdDigit } from "utils/defi"

import { getProfileIdByDiscord } from "../../../utils/profile"

const emojiMap = {
  following: getEmoji("PLUS"),
  tracking: getEmoji("ANIMATED_STAR", true),
  copying: getEmoji("SWAP_ROUTE"),
}

export async function render(user: User) {
  const profileId = await getProfileIdByDiscord(user.id)
  const { data: res, ok } = await defi.getUserTrackingWallets(profileId)
  const data: {
    following: any[]
    tracking: any[]
    copying: any[]
  } = {
    following: [],
    tracking: [],
    copying: [],
  }

  if (ok) {
    data.following =
      (res as ResponseGetTrackingWalletsResponse["data"])?.following ?? []
    data.tracking =
      (res as ResponseGetTrackingWalletsResponse["data"])?.tracking ?? []
    data.copying =
      (res as ResponseGetTrackingWalletsResponse["data"])?.copying ?? []
  }

  const embed = composeEmbedMessage(null, {
    author: [`Your favorite wallets`, getEmojiURL(emojis.ANIMATED_STAR)],
    description: [
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} ${await getSlashCommand(
        "wallet follow",
      )} to add a wallet to favorite list`,
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} ${await getSlashCommand(
        "wallet track",
      )} to be notified of this wallet's txns`,
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} ${await getSlashCommand(
        "wallet copy",
      )} to copy every move this wallet makes`,
    ].join("\n"),
  })

  Object.entries(data).forEach(async (e) => {
    if (!e[1].length) return
    embed.addFields({
      name: `${emojiMap[e[0] as keyof typeof emojiMap]} ${capitalizeFirst(
        e[0],
      )}`,
      value: formatDataTable(
        await Promise.all(
          e[1]
            .sort((a, b) => (b.net_worth ?? 0) - (a.net_worth ?? 0))
            .map(async (d) => {
              const chain = (d.chain_type ?? "").toUpperCase()
              return {
                chainType: chain,
                address: await lookUpDomains(d.address ?? true),
                alias:
                  (d?.alias ?? "").length >= 16
                    ? shortenHashOrAddress(d.alias ?? "", 4)
                    : d.alias ?? "",
                usd: `$${formatUsdDigit(d.net_worth ?? 0)}`,
              }
            }),
        ),
        {
          cols: ["chainType", "address", "alias", "usd"],
          separator: [VERTICAL_BAR, VERTICAL_BAR, ` ${APPROX} `],
          rowAfterFormatter: (f, i) =>
            `${getEmoji(e[1][i].chain_type.toUpperCase())} ${f}${getEmoji(
              "CASH",
            )}`,
        },
      ).joined,
      inline: false,
    })
  })

  const options = await Promise.all(
    Object.entries(data)
      .map((e) => {
        return e[1]
          .filter((d) => d.profile_id && d.address)
          .map(async (d) => {
            const chain = (d.chain_type ?? "").toUpperCase()
            return {
              value: `${e[0]}_onchain_${d.address}`,
              label: `🔹 ${chain} | ${
                d.alias || (await lookUpDomains(d.address))
              } | 💵 $${formatUsdDigit(d.net_worth ?? 0)}`,
            }
          })
      })
      .flat(),
  )

  if (!options.length) {
    embed.description += "\n\nNo wallets yet, use commands above."
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: options.length
        ? [
            new MessageActionRow().addComponents(
              new MessageSelectMenu()
                .setPlaceholder("💰 View a wallet")
                .setCustomId("view_wallet")
                .addOptions(options),
            ),
          ]
        : [],
    },
  }
}
