import defi from "adapters/defi"
import {
  HexColorString,
  Message,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { Coin } from "types/defi"
import CacheManager from "utils/CacheManager"
import { getChartColorConfig } from "utils/canvas"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis } from "utils/common"
import { PREFIX } from "utils/constants"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
} from "utils/discordEmbed"
import TurnDown from "turndown"

async function composeTokenInfoResponse({
  msg,
  coinId,
}: {
  msg: Message
  coinId: string
}) {
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
  }
}

function composeTokenInfoSelectionResponse(
  coins: Coin[],
  coinSymbol: string,
  msg: Message
) {
  const opt = (coin: Coin): MessageSelectOptionData => ({
    label: `${coin.name} (${coin.symbol})`,
    value: `${coin.id}`,
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
  const coinId = interaction.values[0]
  return await composeTokenInfoResponse({
    msg: message,
    coinId,
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
