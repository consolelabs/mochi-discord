import config from "adapters/config"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  paginate,
  roundFloatNumber,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { ResponseMonikerConfigData } from "types/api"
import { SLASH_PREFIX } from "utils/constants"

function toList(data: ResponseMonikerConfigData[]) {
  let longestMonikerWord =
    data.sort(
      (a, b) =>
        (b.moniker?.moniker?.length ?? 0) - (a.moniker?.moniker?.length ?? 0)
    )[0]?.moniker?.moniker?.length ?? 0

  longestMonikerWord += 5

  return data
    .map((d) => {
      return `\`${d.moniker?.moniker}${" ".repeat(
        longestMonikerWord - (d.moniker?.moniker?.length ?? 0)
      )}\` ${roundFloatNumber(d.moniker?.amount ?? 0, 4)} ${
        d.moniker?.token?.token_symbol ?? ""
      } (\u2248 $${d.value ?? 0})`
    })
    .join("\n")
}

export async function handleMonikerList(
  guildId: string,
  guildName = "This guild"
) {
  const {
    ok: defaultMonikerOk,
    data: defaultMonikers,
    log: defaultLog,
    curl: defaultCurl,
  } = await config.getDefaultMoniker()
  const {
    ok: guildMonikerOk,
    data: guildMonikers,
    log: guildLog,
    curl: guildCurl,
  } = await config.getMonikerConfig(guildId)
  if (!guildMonikerOk) {
    throw new APIError({ description: guildLog, curl: guildCurl })
  }
  if (!defaultMonikerOk) {
    throw new APIError({ description: defaultLog, curl: defaultCurl })
  }

  const defaultList = toList(defaultMonikers)
  const defaultDescription = defaultList.length
    ? `**Default**\n${toList(defaultMonikers)}\n`
    : ""

  let pages = paginate(guildMonikers, 10)
  pages = pages.map((arr: any, idx: number): MessageEmbed => {
    const guildList = toList(arr)
    const description = guildList.length
      ? `**${guildName}'s monikers**\n${toList(arr)}`
      : ""
    const embed = composeEmbedMessage(null, {
      author: ["Moniker List", getEmojiURL(emojis.MONIKER)],
      thumbnail: getEmojiURL(emojis.MONIKER),
      description: `${defaultDescription}${description}\n\n${getEmoji(
        "POINTINGRIGHT"
      )} Set up a new moniker configuration \`${SLASH_PREFIX}moniker set\`\n${getEmoji(
        "POINTINGRIGHT"
      )} Remove a configured moniker \`${SLASH_PREFIX}moniker remove\``,
      footer: [`Page ${idx + 1} / ${pages.length}`],
    })
    return embed
  })
  return pages
}
