import { getAuthor } from "utils/common"
import { CommandInteraction } from "discord.js"
import UI, { PageSize, Platform } from "@consolelabs/mochi-ui"
import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import { APIError } from "errors"
import { reply } from "utils/discord"
import api from "api"
import { composeEmbedMessage } from "ui/discord/embed"
import { embedsColors } from "types/common"

export async function render(i: CommandInteraction, page = 0) {
  const author = getAuthor(i)
  // get profile id
  const p = await profile.getByDiscord(author.id)
  if (p.err) {
    throw new APIError({
      msgOrInteraction: i,
      description: `[getByDiscord] API error with status ${p.status_code}`,
      curl: p.curl,
      status: p.status ?? 500,
      error: p.error,
    })
  }

  const payLinks = await mochiPay.getPaylinks(p.id)
  const total = Math.ceil(payLinks.length / PageSize.Medium)
  const { text, totalPage } = await UI.components.payLinks({
    payLinks,
    on: Platform.Discord,
    page,
    total,
    withTitle: true,
    groupDate: true,
    api,
  })

  const lines = []
  lines.push(text)
  lines.push("⎯".repeat(5))
  lines.push("\\✅ Paid \\| \\⚠️ End soon \\| \\🔵 New \\| \\⚪ Expired")

  const embed = composeEmbedMessage(null, {
    description: lines.join("\n"),
    color: embedsColors.PayStatusList,
  })

  return reply(i, {
    messageOptions: {
      embeds: [embed],
    },
  })
}
