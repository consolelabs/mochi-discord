import config from "adapters/config"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, paginate, roundFloatNumber } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"

export async function handleMonikerList(guildId: string) {
  const { ok, data, log, curl } = await config.getMonikerConfig(guildId)
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  let monikers = data
  let isDefault = false
  if (!data || data.length === 0) {
    const { ok, data, log, curl } = await config.getDefaultMoniker()
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    monikers = data
    isDefault = true
  }
  let pages = paginate(monikers, 10)
  pages = pages.map((arr: any, idx: number): MessageEmbed => {
    let col1 = ""
    let col2 = ""
    arr.forEach((item: any) => {
      col1 += `**${item.moniker.moniker}**\n`
      col2 += `${roundFloatNumber(item.moniker.amount, 4)} **${
        item.moniker.token.token_symbol
      }** (\u2248 $${item.value})\n`
    })
    const res = composeEmbedMessage(null, {
      title: `${getEmoji("bucket_cash", true)} Moniker List`,
      footer: [`Page ${idx + 1} / ${pages.length}`],
    })
    if (isDefault) {
      return res
        .addFields({
          name: "\u200B",
          value: `This is our default moniker! ${getEmoji("boo")}\n${getEmoji(
            "POINTINGRIGHT"
          )} To set yours, run $monikers set \`<moniker> <amount_token> <token>\`!`,
        })
        .addFields(
          { name: "Moniker", value: col1, inline: true },
          { name: "Value", value: col2, inline: true }
        )
    }
    return res.addFields(
      {
        name: "\u200B",
        value: `${getEmoji(
          "POINTINGRIGHT"
        )}To set more monikers, run \`$monikers set <moniker> <amount_token> <token>\`!\n${getEmoji(
          "POINTINGRIGHT"
        )} For example, try \`$monikers set tea 1 BUTT\``,
      },
      { name: "Moniker", value: col1, inline: true },
      { name: "Value", value: col2, inline: true }
    )
  })
  return pages
}
