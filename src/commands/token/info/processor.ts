import { ButtonInteraction, CommandInteraction } from "discord.js"
import defi from "../../../adapters/defi"
import CacheManager from "cache/node-cache"
import { InternalError } from "../../../errors"
import { ResponseTokenInfoKeyValue } from "../../../types/api"
import { composeEmbedMessage } from "../../../ui/discord/embed"
import { getEmoji, EmojiKey } from "../../../utils/common"
import { formatDigit } from "../../../utils/defi"
import { TickerView } from "../../ticker/index/processor"

const CURRENCY = "usd"

export async function renderTokenInfo(
  interaction: ButtonInteraction | CommandInteraction,
  query: string
) {
  const { data, status } = await CacheManager.get({
    pool: "token",
    key: `token-info-${query}`,
    call: () => defi.getTokenInfo(query),
  })

  if (status === 404) {
    throw new InternalError({
      title: "Token not found",
      msgOrInteraction: interaction,
      description: `Token ${query} not found`,
    })
  }

  const embed = composeEmbedMessage(null, {
    title: "About " + data.name,
  })

  const content = data.description_lines[0] ?? ""

  embed.setDescription(content || "This token has not updated description yet")

  if (data?.circulating_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_2", true)} Circulating`,
      value: `${formatDigit({
        value: data.market_data?.circulating_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (data?.total_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_3", true)} Total Supply`,
      value: `${formatDigit({
        value: data.total_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (data?.fully_diluted_valuation?.[CURRENCY]) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_GEM", true)} FDV`,
      value: `$${formatDigit({
        value: data.fully_diluted_valuation?.[CURRENCY],
        shorten: true,
      })}`,
      inline: true,
    })
  }

  embed.addFields({
    name: `${getEmoji("NFT2")} Tags`,
    value: data.categories.join(", "),
    inline: false,
  })

  if (data.explorers) {
    embed.addFields({
      name: `${getEmoji("NEWS")} Addr`,
      value: data.explorers
        .map(
          (explorer: ResponseTokenInfoKeyValue) =>
            `[${explorer.key}](${explorer.value})`
        )
        .join(", "),
      inline: false,
    })
  }

  if (data.communities.length) {
    embed.addFields({
      name: `${getEmoji("WAVING_HAND")} Communities`,
      value: data.communities
        .map(
          (c: any) => `${getEmoji(c.key as EmojiKey)} [${c.key}](${c.value})`
        )
        .join("\n"),
      inline: true,
    })
  }

  return {
    initial: "tokenInfo",
    context: {
      view: TickerView.Info,
      baseCoin: { name: data.name },
    },
    msgOpts: {
      files: [],
      embeds: [embed],
    },
  }
}
