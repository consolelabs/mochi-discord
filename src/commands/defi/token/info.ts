import defi from "adapters/defi"
import {
  ButtonInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { Coin } from "types/defi"
import CacheManager from "utils/CacheManager"
import { getChartColorConfig } from "utils/canvas"
import {
  CommandChoiceHandler,
  EphemeralMessage,
} from "utils/CommandChoiceManager"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis, getEmoji, hasAdministrator } from "utils/common"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getSuccessEmbed,
} from "utils/discordEmbed"
import TurnDown from "turndown"
import config from "adapters/config"

async function composeTokenInfoResponse({
  msg,
  coinId,
  authorId,
  interaction,
  coinSymbol,
  coinName,
}: {
  msg: Message
  coinId: string
  authorId?: string
  interaction?: SelectMenuInteraction
  coinSymbol?: string
  coinName?: string
}) {
  const gMember = msg.guild?.members.cache.get(authorId ?? msg.author.id)
  // ask admin to set server default token
  let ephemeralMessage: EphemeralMessage | undefined
  if (hasAdministrator(gMember)) {
    await interaction?.deferReply({ ephemeral: true })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `${coinId}|${coinSymbol}|${coinName}`,
        emoji: getEmoji("approve"),
        style: "PRIMARY",
        label: "Confirm",
      })
    )
    ephemeralMessage = {
      embeds: [
        composeEmbedMessage(msg, {
          title: "Set default token",
          description: `Do you want to set **${coinName}** as your server default token?\nNo further selection next time use \`$token info\``,
        }),
      ],
      components: [actionRow],
      buttonCollector: setDefaultTicker,
    }
  }
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log })
  }
  const embed = composeEmbedMessage(msg, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
    footer: ["Data fetched from CoinGecko.com"],
  })
  const tdService = new TurnDown()
  const content = coin.description.en
    .split("\r\n\r\n")
    .map((v: any) => {
      return tdService.turndown(v)
    })
    .join("\r\n\r\n")
  embed.setDescription(content || "This token has not updated description yet")
  return {
    messageOptions: {
      embeds: [embed],
    },
    ephemeralMessage,
  }
}

export async function setDefaultTicker(i: ButtonInteraction) {
  const [coinId, symbol, name] = i.customId.split("|")
  await config.setGuildDefaultTicker({
    guild_id: i.guildId ?? "",
    query: symbol,
    default_ticker: coinId,
  })
  CacheManager.findAndRemove("ticker", `ticker-default-${i.guildId}-${symbol}`)
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default token ENABLED",
    description: `Next time your server members use $token info with \`${symbol}\`, **${name}** will be the default selection`,
  })
  return {
    embeds: [embed],
  }
}

function composeTokenInfoSelectionResponse(
  coins: Coin[],
  coinSymbol: string,
  msg: Message
) {
  const opt = (coin: Coin): MessageSelectOptionData => ({
    label: `${coin.name} (${coin.symbol})`,
    value: `${coin.id}_${coin.symbol}_${coin.name}_${msg.author.id}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tokens_info_selection",
    placeholder: "Select a token",
    options: coins.map((c: Coin) => opt(c)),
  })
  const found = coins
    .map((c: { name: string; symbol: string }) => `**${c.name}** (${c.symbol})`)
    .join(", ")
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.MAG} Multiple tokens found`,
          description: `Multiple tokens found for \`${coinSymbol}\`: ${found}.\nPlease select one of the following tokens`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler: tokenInfoSelectionHandler,
    },
  }
}

const tokenInfoSelectionHandler: CommandChoiceHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const value = interaction.values[0]
  const [coinId, coinSymbol, coinName, authorId] = value.split("_")
  return await composeTokenInfoResponse({
    msg: message,
    coinId,
    authorId,
    coinName,
    coinSymbol,
  })
}

const command: Command = {
  id: "info_server_token",
  command: "info",
  brief: "Information of a token",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const [token] = args.slice(2)
    const {
      ok,
      data: coins,
      log,
      curl,
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${token}`,
      call: () => defi.searchCoins(token),
    })
    if (!ok) throw new APIError({ message: msg, curl, description: log })
    if (!coins || !coins.length) {
      throw new CommandError({
        message: msg,
        description: `Cannot find any cryptocurrency with \`${token}\`.\nPlease choose another one!`,
      })
    }
    if (coins.length === 1) {
      return await composeTokenInfoResponse({ msg, coinId: coins[0].id })
    }
    const { symbol } = coins[0]
    const defaultToken = await CacheManager.get({
      pool: "ticker",
      key: `ticker-default-${msg.guildId}-${symbol}`,
      call: () =>
        config.getGuildDefaultTicker({
          guild_id: msg.guildId ?? "",
          query: symbol,
        }),
    })
    if (defaultToken.ok && defaultToken.data.default_ticker) {
      return await composeTokenInfoResponse({
        msg,
        coinId: defaultToken.data.default_ticker,
      })
    }

    return composeTokenInfoSelectionResponse(Object.values(coins), symbol, msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens info <symbol>\n${PREFIX}tokens info <id>`,
        examples: `${PREFIX}tokens info eth\n${PREFIX}tokens info ethereum`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  minArguments: 3,
  colorType: "Defi",
}

export default command
