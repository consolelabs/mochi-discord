import {
  Message,
  GuildEmoji,
  User,
  MessageOptions,
  ColorResolvable,
  MessageComponentInteraction,
  Permissions,
  GuildMember,
} from "discord.js"

import { Command, Pagination } from "types/common"
import { DOT, HOMEPAGE_URL, SPACE, VERTICAL_BAR } from "./constants"
import { TopNFTTradingVolumeItem } from "types/community"
import Defi from "adapters/defi"
import {
  marketplaceEmojis,
  rarityEmojis,
  traitEmojis,
  traitTypeMapping,
} from "./nft"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { MARKETPLACE_BASE_URL } from "env"
dayjs.extend(relativeTime)

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
  OP: "1002151912403107930",
  USDT: "1005010747308396544",
  USDC: "1005010675342520382",
  ADA: "1005010608443359272",
  XRP: "1005010559856554086",
  BUSD: "1005010097535197264",
  DOT: "1005009972716908554",
  DOGE: "1004962950756454441",
  DAI: "1005009904433647646",
  MATIC: "1005009862893240452",
  AVAX: "1005009817523474492",
  UNI: "1005012087967334443",
  SHIB: "1005009723277463703",
  TRX: "1005009394209128560",
  WBTC: "1005009348956790864",
  ETC: "1005009314802569277",
  LEO: "1005009244187263047",
  LTC: "1005009185940963380",
  FTT: "1005009144044064779",
  CRO: "1005009127937949797",
  LINK: "1005008904205385759",
  NEAR: "1005008870038589460",
  ATOM: "1005008855111049216",
  XLM: "1005008839139151913",
  XMR: "1005008819866312724",
  BCH: "1005008800106942525",
  APE: "1005008782486675536",
  DFG: "1007157463256145970",
  ICY: ":ice_cube:",
  CARROT: ":carrot:",
  BUTT: "1007247521468403744",
  WDOGE: "1010512669448605756",
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

// TODO(tuand) rename this to expBarEmojis
export const expBarEmojis: Record<string, string> = {
  XP_FILLED_LEFT: "933278893559918602",
  XP_FILLED: "933278891450187816",
  XP_FILLED_RIGHT: "933278892435836948",
}

export const progressEmojis: Record<string, string> = {
  PROGRESS_EMPTY_1: "1016993271051984936",
  PROGRESS_EMPTY_2: "1016993269202296892",
  PROGRESS_EMPTY_3: "1016993266371141704",
  PROGRESS_1: "1016993258380988436",
  PROGRESS_2: "1016993262101344306",
  PROGRESS_3: "1016993264357875743",
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
  X: ":x:",
}

export const factionEmojis: Record<string, string> = {
  IMPERIAL: "932605622044729344",
  IMPERIAL_EXP_1: "933612077686341672",
  IMPERIAL_EXP_2: "933612077300473866",
  IMPERIAL_EXP_3: "933612078856552498",
  REBELIO: "932605621914701875",
  REBELIO_EXP_1: "933606190523490324",
  REBELIO_EXP_2: "933606189512683520",
  REBELIO_EXP_3: "933606190678679633",
  MERCANTO: "932651179593322527",
  MERCANTO_EXP_1: "933612151732596786",
  MERCANTO_EXP_2: "933612151753572393",
  MERCANTO_EXP_3: "933612151174758401",
  ACADEMIA: "932605621730160680",
  ACADEMIA_EXP_1: "933606673178820658",
  ACADEMIA_EXP_2: "933606672709074974",
  ACADEMIA_EXP_3: "933606672444817408",
  FACTION_EXP_1: "933276771133063198",
  FACTION_EXP_2: "933276771107868692",
  FACTION_EXP_3: "933276771141451856",
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
  APPROVE: "933341948402618378",
  APPROVE_GREY: "1016628985351909457",
  NFTS: "977508805011181638",
  QUESTION: "1008993149076635698",
  SWAP: "933340602223955998",
  LIKE: "900370883594551348",
  PAWCOIN: "887275176113373194",
  EXP: "1016985999039016982",
  LEFT_ARROW: "933339868224958504",
  RIGHT_ARROW: "933339868233359380",
  CASH: "933341119998210058",
  BUBBLE_CASH: "1022765345875968040",
  TIP: "933384794627248128",
  SEARCH: "933341511062552626",
  PREDICTION: "931194309385003058",
  FELLOWSHIP: "922044644928421888",
  ...tokenEmojis,
  ...numberEmojis,
  ...rarityEmojis,
  ...marketplaceEmojis,
  ...traitEmojis,
  ...expBarEmojis,
  ...progressEmojis,
  ...factionEmojis,
}

export const tripodEmojis: Record<string, string> = {
  DROID: "998929164444905613",
  ROCKET_DROID: "998929223710412950",
  MIMIC_SLIME: "998929210213158982",
  MARBLE_PIECE: "998929205272252466",
  MARBLE_CHUNK: "998929198565568664",
  UNSTABLE_BOMB: "998929246015725579",
  SCARLET_SHARD: "998929226067615814",
  ENERGY_STONE: "998929172191793274",
  ENERGY_REACTOR: "998929168672772176",
  LOOT_CHEST: "998929194765533224",
  CYBERCORE_CRATE: "998929161026539542",
  GLITTEROOT_BUD: "998929179645050951",
  GLITTEROOT_SHRUB: "998929189786894407",
  GLITTEROOT_SHRUB_ENHANCED: "998929187756834846",
  GLITTEROOT: "998929192244760616",
  GLITTEROOT_ENHANCED: "998929183122141194",
  POD: "998929217897111602",
  POD_ENHANCED: "998929215678337054",
  SHELTER: "998929232212275221",
  SHELTER_ENHANCED: "998929228907171921",
  CONDO: "998929158988107836",
  CONDO_ENHANCED: "998929156769316875",
  APARTMENT: "998929154567323688",
  APARTMENT_ENHANCED: "998929152256258078",
  SOARING_TOWER: "998929239086747648",
  SOARING_TOWER_ENHANCED: "998929235500613723",
  GALAXY_FORTRESS: "998929175509475448",
  AIRDROPPER: "998929149634805810",
  REROLL_BOX: "998929220447256618",
  TELEPORT_PORTAL: "998929240823189535",
  TERRAFORMER: "998929243411054592",
  MEGA_BOMB: "998929207767879802",
  MINI_BOMB: "998929212192862299",
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88",
  ERROR: "#D94F50",
  SUCCESS: "#5cd97d",
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

export function hasAdministrator(member?: GuildMember | null) {
  if (!member) return false
  return member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
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
  const emojiKey = traitTypeMapping[key.toUpperCase()] || key.toUpperCase()
  const emoji = emojis[emojiKey]
  if (!emoji) {
    return ":jigsaw:"
  }

  if (isNaN(+emoji)) {
    return emoji
  }

  return `<${animated ? "a" : ""}:${key.replace(/-/g, "_").toLowerCase()}:${
    emojis[emojiKey]
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

// TODO: move this
export async function mapSymbolToPrice(
  msg: Message,
  tokenList: string[]
): Promise<Map<string, number>> {
  const tokenMap = new Map<string, number>()
  for (const item of tokenList) {
    const { data: searchData } = await Defi.searchCoins(item)
    const { data: coin } = await Defi.getCoin(searchData?.[0].id)

    tokenMap.set(item, coin?.market_data.current_price.usd)
  }
  return tokenMap
}

export function sortNFTListByVolume(
  nftList: TopNFTTradingVolumeItem[],
  symbol: Map<string, number>
): TopNFTTradingVolumeItem[] {
  nftList.forEach((item) => {
    const price = symbol.get(item.token) ?? 0
    item.trading_volume = roundFloatNumber(item.trading_volume * price, 2)
  })
  nftList.sort((a, b) => (a.trading_volume > b.trading_volume ? -1 : 1))
  return nftList
}

export function capitalizeFirst(str: string) {
  return str
    .split(/ +/g)
    .map(
      (w) => `${w[0]?.toUpperCase() ?? ""}${w.slice(1)?.toLowerCase() ?? ""}`
    )
    .join(SPACE)
}

export function getDateStr(timestamp: number) {
  return dayjs(timestamp).format("MMMM DD, YYYY")
}

export function getTimeFromNowStr(timestamp: string) {
  return dayjs(timestamp).fromNow()
}

export function getMarketplaceCollectionUrl(collectionAddress: string) {
  return `${MARKETPLACE_BASE_URL}/collections/${collectionAddress}`
}

export function getMarketplaceNftUrl(
  collectionAddress: string,
  tokenId: string
) {
  return `${MARKETPLACE_BASE_URL}/asset/${collectionAddress}/${tokenId}`
}

export function isValidHttpUrl(urlStr: string) {
  let url
  try {
    url = new URL(urlStr)
  } catch (_) {
    return false
  }
  return url.protocol === "http:" || url.protocol === "https:"
}

export function getPaginationFooter({ page, size, total }: Pagination) {
  return [`Page ${page + 1} / ${Math.ceil(total / size) || 1}`]
}

/**
 * Returns result as boolean based on the `percentage` passed in.
 * @param percentage: range is [0-1] or [1-100]. Returns false if out of range
 */
export function getChance(percentage: number) {
  if (percentage >= 100 || percentage <= 0) return false
  if (percentage > 1 && percentage < 100) percentage /= 100
  return Math.random() < percentage
}
