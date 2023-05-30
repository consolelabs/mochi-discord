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
  EmojiKey,
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

export async function render(user: User) {
  const { data: res, ok } = await defi.getUserTrackingWallets(
    "567326528216760320"
  )
  let data: ResponseGetTrackingWalletsResponse["data"] = []
  if (ok) {
    data = (res as ResponseGetTrackingWalletsResponse["data"]) ?? []
  }

  const embed = composeEmbedMessage(null, {
    author: [`${user.username}'s tracking wallets`, user.displayAvatarURL()],
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} To track a wallet, use ${await getSlashCommand("wallet add")}`,
  })

  embed.setFields({
    name: "Wallets",
    value: `${getEmoji("WALLET_1")}\`On-chain\`\n${
      formatDataTable(
        data.map((d) => ({
          type: (d.type ?? "").toUpperCase(),
          address: shortenHashOrAddress(d.address ?? "", 4),
          usd: `$${formatDigit({
            value: String(d.net_worth ?? 0),
            fractionDigits: 2,
          })}`,
        })),
        {
          cols: ["type", "address", "usd"],
          separator: [VERTICAL_BAR, APPROX],
          rowAfterFormatter: (f, i) =>
            `${getEmoji(`NUM_${i + 1}` as EmojiKey)}${f}${getEmoji("CASH")}`,
        }
      ).joined
    }`,
    inline: false,
  })

  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder("💰 View a wallet")
          .setCustomId("wallets_view-wallet")
          .addOptions(
            data
              .filter((d) => d.user_id && d.address)
              .map((d, i) => ({
                emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                value: `${d.user_id}_${d.address}`,
                label: `🔹 ${
                  d.type?.toUpperCase() ?? ""
                } | ${shortenHashOrAddress(
                  d.address ?? "",
                  4
                )} | 💵 $${formatDigit({
                  value: String(d.net_worth ?? 0),
                  fractionDigits: 2,
                })}`,
              }))
          )
      ),
    ],
  }
}
