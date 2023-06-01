import defi from "adapters/defi"
import { BalanceType, renderBalances } from "commands/balances/index/processor"
import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { ResponseGetTrackingWalletsResponse } from "types/api"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import {
  authorFilter,
  capitalizeFirst,
  getEmoji,
  shortenHashOrAddress,
} from "utils/common"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { formatDigit } from "utils/defi"
import { wrapError } from "utils/wrap-error"

export function collectSelection(reply: Message, author: User) {
  reply
    .createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }
        if (i.customId === "wallets_view-wallet") {
          const [userId, address] = i.values[0].split("_")
          const walletDetailView = await renderBalances(
            userId,
            i,
            BalanceType.Onchain,
            address
          )
          walletDetailView.messageOptions.components.unshift(
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("Back")
                .setStyle("SECONDARY")
                .setCustomId("back")
            )
          )

          const edited = (await i.editReply(
            walletDetailView.messageOptions
          )) as Message

          edited
            .createMessageComponentCollector({
              componentType: "BUTTON",
              filter: authorFilter(author.id),
              time: 300000,
            })
            .on("collect", async (i) => {
              if (!i.deferred) {
                await i.deferUpdate().catch(() => null)
              }
              wrapError(reply, async () => {
                if (i.customId === "back") {
                  await i.editReply({
                    embeds: reply.embeds,
                    components: reply.components,
                  })
                }
              })
            })
            .on("end", () => {
              wrapError(reply, async () => {
                await i.editReply({ components: [] }).catch(() => null)
              })
            })
        }
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

const emojiMap = {
  following: getEmoji("PLUS"),
  tracking: getEmoji("ANIMATED_STAR", true),
  copying: getEmoji("SWAP_ROUTE"),
}

export async function render(user: User) {
  const { data: res, ok } = await defi.getUserTrackingWallets(user.id)
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
    data.following = (res as ResponseGetTrackingWalletsResponse["data"]) ?? []
  }

  const embed = composeEmbedMessage(null, {
    author: [`${user.username}'s favorite wallets`, user.displayAvatarURL()],
    description: [
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
        "wallet follow"
      )} to add a wallet to favorite list`,
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
        "wallet track"
      )} to be notified of this wallet's txns`,
      `${getEmoji("ANIMATED_POINTING_RIGHT", true)} Use ${await getSlashCommand(
        "wallet copy"
      )} to copy every move this wallet makes`,
    ].join("\n"),
  })

  Object.entries(data).forEach((e) => {
    if (!e[1].length) return
    embed.addFields({
      name: `${emojiMap[e[0] as keyof typeof emojiMap]} ${capitalizeFirst(
        e[0]
      )}`,
      value: formatDataTable(
        e[1]
          .sort((a, b) => (b.net_worth ?? 0) - (a.net_worth ?? 0))
          .map((d) => {
            let chain = (d.type ?? "").toUpperCase()
            chain = chain === "ETH" ? "EVM" : chain
            return {
              type: chain,
              address: d.alias || shortenHashOrAddress(d.address ?? "", 4),
              usd: `$${formatDigit({
                value: String(d.net_worth ?? 0),
                fractionDigits: 2,
              })}`,
            }
          }),
        {
          cols: ["type", "address", "usd"],
          separator: [VERTICAL_BAR, APPROX],
          rowAfterFormatter: (f) => `${f}${getEmoji("CASH")}`,
        }
      ).joined,
      inline: false,
    })
  })

  const options = Object.entries(data)
    .map((e) => {
      return e[1]
        .filter((d) => d.user_id && d.address)
        .map((d) => {
          let chain = (d.type ?? "").toUpperCase()
          chain = chain === "ETH" ? "EVM" : chain
          return {
            value: `${e[0]}_${d.user_id}_${d.address}`,
            label: `🔹 ${chain} | ${
              d.alias || shortenHashOrAddress(d.address ?? "", 4)
            } | 💵 $${formatDigit({
              value: String(d.net_worth ?? 0),
              fractionDigits: 2,
            })}`,
          }
        })
    })
    .flat()

  if (!options.length) {
    embed.description += "\n\nNo wallets yet, use commands above."
  }

  return {
    embeds: [embed],
    components: options.length
      ? [
          new MessageActionRow().addComponents(
            new MessageSelectMenu()
              .setPlaceholder("💰 View a wallet")
              .setCustomId("wallets_view-wallet")
              .addOptions(options)
          ),
        ]
      : [],
  }
}