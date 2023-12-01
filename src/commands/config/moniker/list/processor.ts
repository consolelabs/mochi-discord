import config from "adapters/config"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { emojis, getEmoji, getEmojiURL, paginate } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { formatTokenDigit, formatUsdDigit } from "utils/defi"
import { getSlashCommand } from "utils/commands"

export async function handleMonikerList(
  guildId: string,
  guildName = "This guild",
) {
  const {
    ok: defaultMonikerOk,
    data: _defaultMonikers,
    log: defaultLog,
    curl: defaultCurl,
    status: defaultStatus = 500,
    error: defaultError,
  } = await config.getDefaultMoniker()
  const {
    ok: guildMonikerOk,
    data: _guildMonikers,
    log: guildLog,
    curl: guildCurl,
    status: guildStatus = 500,
    error: guildError,
  } = await config.getMonikerConfig(guildId)
  if (!guildMonikerOk) {
    throw new APIError({
      description: guildLog,
      curl: guildCurl,
      status: guildStatus,
      error: guildError,
    })
  }
  if (!defaultMonikerOk) {
    throw new APIError({
      description: defaultLog,
      curl: defaultCurl,
      status: defaultStatus,
      error: defaultError,
    })
  }

  const defaultMonikers = _defaultMonikers.sort(
    (a, b) => (b.value ?? 0) - (a.value ?? 0),
  )
  const { joined: defaultList } = formatDataTable(
    defaultMonikers.map((m) => ({
      value: m.moniker?.moniker ?? "",
      token: `${formatTokenDigit(m.moniker?.amount ?? 0)} ${
        m.moniker?.token?.token_symbol?.toUpperCase() ?? "TOKEN"
      }`,
      usd: `$${formatUsdDigit(m.value ?? 0)}`,
    })),
    {
      cols: ["value", "token", "usd"],
      separator: [VERTICAL_BAR, ` ${APPROX} `],
    },
  )
  const defaultDescription = defaultList.length
    ? `**Default**\n${defaultList}\n`
    : ""

  const guildMonikers = _guildMonikers.sort(
    (a, b) => (b.value ?? 0) - (a.value ?? 0),
  )
  let pages = paginate(guildMonikers, 10)
  pages = await Promise.all(
    pages.map(async (arr: any, idx: number): Promise<MessageEmbed> => {
      const { joined: guildList } = formatDataTable(
        arr.map((m: any) => ({
          value: m.moniker?.moniker ?? "",
          token: `${formatTokenDigit(m.moniker?.amount ?? 0)} ${
            m.moniker?.token?.token_symbol?.toUpperCase() ?? "TOKEN"
          }`,
          usd: `$${formatUsdDigit(m.value ?? 0)}`,
        })),
        {
          cols: ["value", "token", "usd"],
          separator: [VERTICAL_BAR, ` ${APPROX} `],
        },
      )
      const description = guildList.length
        ? `**${guildName}'s monikers**\n${guildList}`
        : ""
      const embed = composeEmbedMessage(null, {
        author: ["Moniker List", getEmojiURL(emojis.MONIKER)],
        thumbnail: getEmojiURL(emojis.MONIKER),
        description: `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} Set up a new moniker configuration ${await getSlashCommand(
          "moniker set",
        )}\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} Remove a configured moniker ${await getSlashCommand(
          "moniker remove",
        )}`,
        footer: [`Page ${idx + 1} / ${pages.length}`],
      })

      embed.addFields({
        name: "Monikers",
        value: `${defaultDescription}\n${description}`,
        inline: false,
      })
      return embed
    }),
  )
  return pages
}
