import {
  Message,
  GuildEmoji,
  User,
  MessageOptions,
  ColorResolvable,
  MessageComponentInteraction,
  Permissions,
} from "discord.js"

import { CanvasRenderingContext2D } from "canvas"
import { Command } from "types/common"
import { DOT, HOMEPAGE_URL, SPACE, VERTICAL_BAR } from "./constants"
import { TopNFTTradingVolumeItem } from "types/community"
import Defi from "adapters/defi"

export const tokenEmojis: Record<string, string> = {
  FTM: "967285237686108212",
  SPIRIT: "967285237962924163",
  TOMB: "967285237904179211",
  REAPER: "967285238306857063",
  BOO: "967285238042599434",
  SPELL: "967285238063587358",
  BTC: "967285237879013388",
  ETH: "991657409082830858",
  BNB: "972205674715054090",
  CAKE: "972205674371117126",
}

export const numberEmojis: Record<string, string> = {
  NUM_0: "932856132869963806",
  NUM_1: "932856133088067604",
  NUM_2: "932856132861583470",
  NUM_3: "932856133012557884",
  NUM_4: "932856133067083816",
  NUM_5: "932856132937068594",
  NUM_6: "932856132626710549",
  NUM_7: "932856132958048276",
  NUM_8: "932856132869976136",
  NUM_9: "932856132832223232",
}

export const rarityEmojis: Record<string, string> = {
  COMMON1: "992087374144225300",
  COMMON2: "992087372076429433",
  COMMON3: "992087369647919225",
  COMMON4: "992087367680786473",

  UNCOMMON1: "992087334675808287",
  UNCOMMON2: "992087366237966396",
  UNCOMMON3: "992087364396654733",
  UNCOMMON4: "992087361624232066",

  RARE1: "992087358981799968",
  RARE2: "992087357081800774",
  RARE3: "992087355303411722",
  RARE4: "992087353160114206",

  EPIC1: "992019141550682122",
  EPIC2: "992019139738751096",
  EPIC3: "992019137771602020",
  EPIC4: "992019353748910091",

  LEGENDARY1: "992087351188803674",
  LEGENDARY2: "992087349003563028",
  LEGENDARY3: "992087346646351882",
  LEGENDARY4: "992087344779907082",

  MYTHIC1: "992087342624014477",
  MYTHIC2: "992087340480741397",
  MYTHIC3: "992087338337456249",
  MYTHIC4: "992087336621973566",
}

export const defaultEmojis: Record<string, string> = {
  ERROR: ":no_entry_sign:",
  AIRPLANE: ":airplane:",
  CHECK: ":white_check_mark:",
  ARROW_DOWN: ":arrow_heading_down:",
  ARROW_UP: ":arrow_heading_up:",
  CHART_WITH_UPWARDS_TREND: ":chart_with_upwards_trend:",
  CHART_WITH_DOWNWARDS_TREND: ":chart_with_downwards_trend:",
  MAG: ":mag:",
}

export const marketplaceEmojis: Record<string, string> = {
  PAINTSWAP: "988743794532958259",
  OPENSEA: "988748731857911878",
  LOOKSRARE: "992327588716486676",
  NFTKEY: "992327591220490350",
}

export const emojis: { [key: string]: string } = {
  GOOD_MORNING: "967285238306840576",
  REVOKE: "967285238055174195",
  REPLY: "967285237983875122",
  PROFILE: "967285238394925086",
  DEFI: "933281365586227210",
  BLANK: "967287119448014868",
  PREV_PAGE: "967285237958705162",
  NEXT_PAGE: "967285238000676895",
  SPARKLE: "984824963112513607",
  ENERGY: "984876653090070658",
  STAR: "984895650623811614",
  BADGE1: "984908515900547092",
  BADGE2: "985038477487919194",
  BADGE3: "985038479492808715",
  FLAG: "985056775554342973",
  CUP: "985137841027821589",
  COIN: "985243708419108914",
  MONEY: "985245648716697680",
  GAME: "916623575824338974",
  HEART: "991939196405174442",
  ...tokenEmojis,
  ...numberEmojis,
  ...rarityEmojis,
  ...marketplaceEmojis,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88",
  ERROR: "#D94F50",
}

export const thumbnails: Record<string, string> = {
  HELP: "https://i.imgur.com/uuQhOmH.png",
  PROFILE: "https://i.imgur.com/JTCGRO6.png",
  TIP: "https://i.imgur.com/qj7iPqz.png",
  TOKENS: "https://i.imgur.com/hcqO0Wu.png",
  LOADING:
    "https://cdn.discordapp.com/attachments/895993366960017491/933427920817492028/loading.gif",
}

export function isInteraction(
  msgOrInteraction: Message | MessageComponentInteraction
): msgOrInteraction is MessageComponentInteraction {
  return "message" in msgOrInteraction
}

export async function inactivityResponse(user: User): Promise<MessageOptions> {
  return {
    content: `> **${getEmoji("revoke")} ${VERTICAL_BAR} ${
      user.tag
    }, the command was closed due to inactivity.**`,
  }
}

export function getHeader(text: string, user: User, ctas?: string) {
  return `> **${text} ${DOT} [** ${user.tag} **]${
    typeof ctas === "string" && ctas !== "" ? ` ${DOT}${ctas}` : ""
  }**`
}

export function getEmbedFooter(texts: string[]): string {
  return texts.join(` ${DOT} `)
}

export function hasAdministrator(msg: Message) {
  return msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
}

export function getCommandsList(
  _emoji: GuildEmoji | string,
  commands: Record<string, Pick<Command, "command" | "brief" | "experimental">>
) {
  const emoji = getEmoji("reply")
  const correctBrief = (brief: string) =>
    brief.endsWith(".") ? brief : `${brief}.`
  return Object.values(commands)
    .filter((c) => !c.experimental)
    .map(
      (c) =>
        `[**${c.command}**](${HOMEPAGE_URL})\n${emoji}${correctBrief(c.brief)}`
    )
    .join("\n\n")
}

export function maskAddress(str: string, minLen?: number) {
  const num = minLen || 8
  if (str.length > num && str.length > 3) {
    const a = Math.round((num * 2) / 3)
    const b = num - a

    return `${str.substring(0, a)}***${str.substring(
      str.length - b,
      str.length
    )}`
  }

  return str
}

export function getEmoji(key: string, animated?: boolean) {
  if (!emojis[key.toUpperCase()]) {
    return ""
  }
  return `<${animated ? "a" : ""}:${key.replace(/-/g, "_").toLowerCase()}:${
    emojis[key.toUpperCase()]
  }>`
}

export function roundFloatNumber(n: number, fractionDigits = 1) {
  return parseFloat(parseFloat(`${n}`).toFixed(fractionDigits))
}

export function catchEm(promise: Promise<unknown>) {
  return promise.then((data) => [null, data]).catch((err) => [err])
}

export function capFirst(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export function getEmojiURL(emojiId: string) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=240&quality=lossless`
}

export function shortenHashOrAddress(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(hash.length - 6)}`
}

export function paginate(arr: any[], size: number) {
  return arr.reduce((acc, val, i) => {
    const idx = Math.floor(i / size)
    const page = acc[idx] || (acc[idx] = [])
    page.push(val)
    return acc
  }, [])
}

export function parseNFTTop(resp: any): TopNFTTradingVolumeItem[] {
  const nftList: TopNFTTradingVolumeItem[] = []
  resp.data.forEach((item: TopNFTTradingVolumeItem) => {
    const ele: TopNFTTradingVolumeItem = {
      collection_address: item.collection_address,
      collection_name: item.collection_name,
      collection_symbol: item.collection_symbol,
      collection_chain_id: item.collection_chain_id,
      trading_volume: item.trading_volume,
      token: item.token,
    }
    nftList.push(ele)
  })
  return nftList
}

export function getUniqueToken(nftList: TopNFTTradingVolumeItem[]): string[] {
  let tokenAvailable: string[] = []
  nftList.forEach((item) => {
    tokenAvailable.push(item.token)
  })
  tokenAvailable = [...new Set(tokenAvailable)]
  return tokenAvailable
}

export async function mapSymbolToPrice(
  msg: Message,
  tokenList: string[]
): Promise<Map<string, number>> {
  const tokenMap = new Map<string, number>()
  for (const item of tokenList) {
    const coinList = await Defi.searchCoins(msg, item)
    const data = await Defi.getCoin(msg, coinList[0].id)

    tokenMap.set(item, data.market_data.current_price.usd)
  }
  return tokenMap
}

export function sortNFTListByVolume(
  nftList: TopNFTTradingVolumeItem[],
  symbol: Map<string, number>
): TopNFTTradingVolumeItem[] {
  nftList.forEach((item) => {
    item.trading_volume = roundFloatNumber(
      item.trading_volume * symbol.get(item.token),
      2
    )
  })
  nftList.sort((a, b) => (a.trading_volume > b.trading_volume ? -1 : 1))
  return nftList
}

export function capitalizeFirst(str: string) {
  return str
    .split(/ +/g)
    .map((w) => `${w[0].toUpperCase()}${w.slice(1)}`)
    .join(SPACE)
}

export function handleTextOverflow(
  c: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  let width = c.measureText(text).width
  const ellipsis = "…"
  const ellipsisWidth = c.measureText(ellipsis).width
  if (width <= maxWidth || width <= ellipsisWidth) {
    return text
  } else {
    let len = text.length
    while (width >= maxWidth - ellipsisWidth && len-- > 0) {
      text = text.substring(0, len)
      width = c.measureText(text).width
    }
    return text + ellipsis
  }
}
