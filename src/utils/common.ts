import {
  ColorResolvable,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Permissions,
  User,
} from "discord.js"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { MARKETPLACE_BASE_URL } from "env"
import type { Pagination } from "types/common"
import { TopNFTTradingVolumeItem } from "types/community"
import { DOT, SPACE } from "./constants"
import fetch from "node-fetch"
import { ethers } from "ethers"
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js"
import {
  NameRegistryState,
  getHashedName,
  getNameAccountKey,
  performReverseLookup,
} from "@bonfida/spl-name-service"
import { logger } from "logger"
import providers from "utils/providers"
import { OriginalMessage } from "errors"
import {
  marketplaceEmojis,
  rarityEmojis,
  traitEmojis,
  traitTypeMapping,
} from "./nft"
dayjs.extend(relativeTime)

export const tokenEmojis = {
  FTM: "967285237686108212",
  SPIRIT: "967285237962924163",
  TOMB: "967285237904179211",
  REAPER: "967285238306857063",
  BOO: "967285238042599434",
  SPELL: "967285238063587358",
  BTC: "967285237879013388",
  ETH: "991657409082830858",
  WETH: "1052849700019109889",
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
  MATIC: "1037985931816349746",
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
  REN: "1037985602202779690",
  MANA: "1037985604010508360",
  COMP: "1037985570724528178",
  YFI: "1037985592971116564",
  BAT: "1037985578341371964",
  AAVE: "1037985567146774538",
  BNT: "1037985589355626517",
  MKR: "1037985596964081696",
  ANC: "1037985575334051901",
  BRUSH: "1037985582162378783",
  SOL: "1006838270862295080",
  APT: "1047707078183096320",
  RONIN: "1047707529884483614",
  ARB: "1056772215477112862",
  OKC: "1006838263165767681",
  ONUS: "1077203550075093053",
  SUI: "1077132420500951081",
  FBOMB: "1079669535117938788",
  MCLB: "1079669537408036955",
  BSC: "972205674715054090",
  POL: "1037985931816349746",
  SAMO: "1095714152221261905",
  BONK: "1095714104108388362",
  STG: "1097786444057169941",
}

export const numberEmojis = {
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

export const expBarEmojis = {
  XP_FILLED_LEFT: "933278893559918602",
  XP_FILLED: "933278891450187816",
  XP_FILLED_RIGHT: "933278892435836948",
}

export const progressEmojis = {
  PROGRESS_EMPTY_1: "1035038442767265882",
  PROGRESS_EMPTY_2: "1035038440426848306",
  PROGRESS_EMPTY_3: "1035038437989961808",
  PROGRESS_1: "1035038429894942761",
  PROGRESS_2: "1035038432294080523",
  PROGRESS_3: "1035038434714206238",
}

export const defaultEmojis = {
  ERROR: ":no_entry_sign:",
  AIRPLANE: ":airplane:",
  CHECK: ":white_check_mark:",
  ARROW_DOWN: ":arrow_heading_down:",
  ARROW_UP: ":arrow_heading_up:",
  CHART_WITH_UPWARDS_TREND: ":chart_with_upwards_trend:",
  CHART_WITH_DOWNWARDS_TREND: ":chart_with_downwards_trend:",
  MAG: ":mag:",
  X: ":x:",
  GREY_QUESTION: ":grey_question:",
  POINT_RIGHT: ":point_right:",
  WARNING: ":warning:",
  WINK: ":wink:",
}

export const factionEmojis = {
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

const fiatEmojis = {
  USD: "1044548311606099969",
  VND: "1044548314735050842",
  EUR: "1044547468404207647",
  SGD: "1044548308363911201",
  GBP: "1044548789433802762",
}

const gameEmojis = {
  TRIPOD: "1084678363895042069",
  HUNGERGAME: "1084678567616585799",
}

const animatedEmojis = {
  ANIMATED_BADGE_1: "1095990101642846258",
  ANIMATED_BADGE_2: "1095990112686448740",
  ANIMATED_BADGE_3: "1095990119988740246",
  ANIMATED_BADGE_5: "1095990124556341278",
  ANIMATED_BELL: "1095990150342918205",
  ANIMATED_ARROW_LEFT: "1093922967664214086",
  ANIMATED_ARROW_DOWN: "1093922982570758254",
  ANIMATED_COIN_1: "1093923016691421205",
  ANIMATED_COIN_2: "1093923019988148354",
  ANIMATED_COIN_3: "1093923024643825717",
  ANIMATED_FIRE: "1095990250146377748",
  ANIMATED_VAULT: "1093923087520637010",
  ANIMATED_HEART: "1093923040859009025",
  ANIMATED_CHAT: "1095990163001315338",
  ANIMATED_CHAT_2: "1095990167350816869",
  ANIMATED_QUESTION_MARK: "1093923080235126804",
  ANIMATED_OPEN_VAULT: "1093923096303521792",
  ANIMATED_STAR: "1093923083934502982",
  ANIMATED_PARTY_POPPER: "1095990305414709331",
  ANIMATED_VAULT_KEY: "1093923048807203016",
  ANIMATED_TOKEN_ADD: "1095990093585592360",
  ANIMATED_POINTING_RIGHT: "1093923073557807175",
  ANIMATED_POINTING_DOWN: "1093923065169199144",
  ANIMATED_WITHDRAW: "1095990359840002130",
  ANIMATED_XP: "1093923101202452501",
  ANIMATED_MONEY: "1093923034131353762",
  ANIMATED_CROWN: "1093923029672796261",
  ANIMATED_CHART_INCREASE: "1095990285512740904",
  ANIMATED_TROPHY: "1095990335794069614",
  ANIMATED_MAIL_RECEIVE: "1093923054389837854",
  ANIMATED_MAIL_SEND: "1093923059498496045",
  ANIMATED_SHRUGGING: "1095990328898637824",
  ANIMATED_IDEA: "1095990263828197428",
}

export const emojis = {
  GOOD_MORNING: "967285238306840576",
  REVOKE: "1077631119073230970",
  REPLY: "967285237983875122",
  REPLY_2: "1093744001611468870",
  REPLY_3: "1093744054312902656",
  PROFILE: "967285238394925086",
  CLAIM: "933340602106519552",
  DEFI: "933281365586227210",
  BLANK: "967287119448014868",
  CONVERSION: "1087692980049170442",
  LINE: "1087608533614338078",
  PREV_PAGE: "967285237958705162",
  NEXT_PAGE: "967285238000676895",
  SPARKLE: "984824963112513607",
  ENERGY: "984876653090070658",
  FLAG: "985056775554342973",
  COIN: "942088817391849543",
  MONEY: "985245648716697680",
  GAME: "916623575824338974",
  APPROVE: "933341948402618378",
  APPROVE_GREY: "1016628985351909457",
  NFTS: "977508805011181638",
  SWAP: "933340602223955998",
  SWAP_ROUTE: "1090477921128431636",
  LIKE: "900370883594551348",
  PAWCOIN: "887275176113373194",
  EXP: "1016985999039016982",
  LEFT_ARROW: "933339868224958504",
  RIGHT_ARROW: "933339868233359380",
  SEARCH: "933341511062552626",
  PREDICTION: "931194309385003058",
  FELLOWSHIP: "922044644928421888",
  TRADE: "1026414280498757652",
  DISCORD: "1039475287169183744",
  TWITTER: "932208655313551420",
  TELEGRAM: "1097390168723435550",
  HORIZONTAL_LINE: "928213014824488990",
  MAIL: "1058304339237666866",
  ASSET: "💰",
  IDENTITY: "🪪",
  NFT: "🖼",
  TICKER: "📈",
  SOULBOUND: "1058304336842727544",
  INFO: "🔎",
  INFO_VAULT: "1090477901725577287",
  RED_FLAG: "🚩",
  FLOORPRICE: "1029662833144766464",
  CHEST: "933339868006871070",
  TOUCH: "900363887050911784",
  MOCHI_SQUARE: "974507016536072242",
  MOCHI_CIRCLE: "1021636928094883864",
  NEKOSAD: "900363887122186310",
  HUH: "907525013417115689",
  WALLET: "933342303546929203",
  OK1: "900024905842712596",
  HELLO: "899666094112010350",
  NEKO1: "897893949979652186",
  NEKOLOVE: "900363887025721374",
  AMPAWSSADORBADGE: "922481485452296192",
  LEADERBOARD: "933281365347151903",
  STATEMENTS: "933341692667506718",
  TRANSACTIONS: "933341692667506718",
  GM: "930840080761880626",
  BUCKET_CASH: "933020342035820604",
  POINTINGRIGHT: "1058304352944656384",
  POINTINGDOWN: "1058304350650384434",
  MOONING: "930840083278487562",
  GLOWINGHEDGE: "998929183122141194",
  SOON: "932544052698701844",
  AIRDROP: "998929149634805810",
  POD: "998929217897111602",
  PUMPEET: "930840081554624632",
  TROPHY: "1060414870895464478",
  ADDRESS: "933216413248802867",
  MAG: "1058304336842727544",
  INCREASING: "1058304334779125780",
  DECREASING: "1058304303888093194",
  DASHBOARD: "933339868795404408",
  SHELTER: "998929232212275221",
  PENCIL: "1078633895500722187",
  WINKINGFACE: "1058304390869549117",
  WALLET_1: "1077631121614970992",
  PLUS: "1078633897513992202",
  ARROW_UP: "1093922976912638094",
  CLOCK: "1080757110146605086",
  NFT2: "1080788646841557072",
  BIN: "1078633887292477450",
  SLOW: "1085777459875696690",
  NORMAL: "1058304356421730424",
  FAST: "1085777392552910959",
  MOCHI_APP: "1086128796412944444",
  MOCHI_PAY: "1086128801903284294",
  GIFT: "1086128793988632669",
  QUEST: "1086128805191622697",
  ACTIVITY_CLOCK: "1080757110146605086",
  CLIPBOARD: "1085873013309833216",
  PROPOSAL: "1087564986504708167",
  CHECK: "1077631110047080478",
  CONFIG: "1058304297395306496",
  MONIKER: "1090477895861944411",
  TREASURER_ADD: "1090902913058078771",
  TREASURER_REMOVE: "1090902910650552380",
  VAULT_NFT: "1080788646841557072",
  SHARE: "1087564990405410936",
  WAVING_HAND: "1058304369210167418",
  NEWS: "1087564980653674496",
  COMMAND: "1090477916132999270",
  TOKEN_LIST: "1090477914388172840",
  GAS: "1090477899657789501",
  CASH: "1058304283642167319",

  ...animatedEmojis,
  ...tokenEmojis,
  ...numberEmojis,
  ...rarityEmojis,
  ...marketplaceEmojis,
  ...traitEmojis,
  ...expBarEmojis,
  ...progressEmojis,
  ...factionEmojis,
  ...fiatEmojis,
  ...gameEmojis,
  ...traitTypeMapping,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88",
  ERROR: "#D94F4F",
  SUCCESS: "#5cd97d",
  PINK: "#FCD3C1",
  GRAY: "#1E1F22",
  BLUE: "#C8EFF8",
  GREEN: "#5CD97D",
  YELLOW: "#F9F687",
  MOCHI: "#FCD3C1",
  ACTIVITY: "#62A1FE",
}

export const thumbnails = {
  HELP: "https://i.imgur.com/uuQhOmH.png",
  PROFILE: "https://i.imgur.com/JTCGRO6.png",
  TIP: "https://i.imgur.com/qj7iPqz.png",
  TOKENS: "https://i.imgur.com/hcqO0Wu.png",
  LOADING:
    "https://cdn.discordapp.com/attachments/895993366960017491/933427920817492028/loading.gif",
  MOCHI:
    "https://media.discordapp.net/attachments/984660970624409630/1094880594976047174/Mochi_New.png?width=1024&height=1024",
  MOCHI_POSE_2:
    "https://cdn.discordapp.com/attachments/984660970624409630/1095630891537149962/Mochi_Pose_2.png",
  MOCHI_POSE_4:
    "https://cdn.discordapp.com/attachments/984660970624409630/1095615053434212362/Mochi_Pose_4.png",
}

export type EmojiKey = keyof typeof emojis
export type TokenEmojiKey = keyof typeof tokenEmojis

export function isInteraction(
  msgOrInteraction: Message | MessageComponentInteraction
): msgOrInteraction is MessageComponentInteraction {
  return "message" in msgOrInteraction
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

// export function getCommandsList(
//   _emoji: GuildEmoji | string,
//   commands: Record<string, Pick<Command, "command" | "brief" | "experimental">>
// ) {
//   const emoji = getEmoji("reply")
//   const correctBrief = (brief: string) =>
//     brief.endsWith(".") ? brief : `${brief}.`
//   return Object.values(commands)
//     .filter((c) => !c.experimental)
//     .map(
//       (c) =>
//         `[**${c.command}**](${HOMEPAGE_URL})\n${emoji}${correctBrief(c.brief)}`
//     )
//     .join("\n\n")
// }

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

export function getEmoji(
  key: EmojiKey | "",
  animated?: boolean,
  fallback = ":jigsaw:"
) {
  if (!key) return fallback

  const emoji = emojis[key]
  if (!emoji) return fallback

  if (isNaN(+emoji)) {
    return emoji
  }

  return `<${animated ? "a" : ""}:${key.replace(/-/g, "_").toLowerCase()}:${
    emojis[key]
  }>`
}

export function getEmojiToken(key: TokenEmojiKey, animated?: boolean) {
  return getEmoji(key, animated, getEmoji("ANIMATED_COIN_1"))
}

export function roundFloatNumber(n: number, fractionDigits = 1) {
  return parseFloat(parseFloat(`${n}`).toFixed(fractionDigits))
}

export function capFirst(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export function getEmojiURL(emojiId: string) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=240&quality=lossless`
}

export function shortenHashOrAddress(hash: string) {
  if (!hash) return ""
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

export function parseNFTTop(data: any): TopNFTTradingVolumeItem[] {
  const nftList: TopNFTTradingVolumeItem[] = []
  data.forEach((item: TopNFTTradingVolumeItem) => {
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

/**
 * Returns the compact formated string
 * e.g 1_000 -> 1K, 1_000_000 -> 1M
 */
export function getCompactFormatedNumber(value: number) {
  const formatter = Intl.NumberFormat("en", { notation: "compact" })
  return formatter.format(value)
}

export const authorFilter =
  (authorId: string) => async (i: MessageComponentInteraction) => {
    // await i.deferUpdate().catch(() => null)
    return i.user.id === authorId
  }

type BuildProgressBarParams = {
  total: number
  progress: number
  // the number of emojis used to render the progress bar
  // defaults to 8 (looks nice on one line on Discord)
  length?: number
  emoji: {
    leftEmpty: string
    empty: string
    rightEmpty: string
    leftFilled: string
    filled: string
    rightFilled: string
  }
}

/**
 * Return a progress bar represented by emojis
 * */
export function buildProgressBar(params: BuildProgressBarParams) {
  const { total, progress, length = 8, emoji } = params
  const list = new Array(Math.ceil(length)).fill(emoji.empty)
  const filled = list.map((empty, index) => {
    if (index < Math.ceil((progress / total) * length)) {
      return emoji.filled
    }
    return empty
  })

  // convert 2 ends to rounded version
  if (progress > 0) {
    filled[0] = emoji.leftFilled
  } else {
    filled[0] = emoji.leftEmpty
  }

  if (progress === total) {
    filled[filled.length - 1] = emoji.rightFilled
  } else {
    filled[filled.length - 1] = emoji.rightEmpty
  }

  return filled.join("")
}

export function isDiscordMessageLink(url: string): boolean {
  return /(http(s)?:\/\/\.)?(www\.)?discord\.com\/channels\/[0-9]*\/[0-9]*\/[0-9]*/g.test(
    url
  )
}

export function intToWeekday(idx: number) {
  const week = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]
  if (idx > 6 || idx < 0) return ""
  return week[idx]
}

export function intToMonth(idx: number) {
  const year = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  if (idx > 11 || idx < 0) return ""
  return year[idx]
}

export function isNotBot(m: GuildMember) {
  return !m.user.bot
}

export function hasRole(roleId: string) {
  return (m: GuildMember) => m.roles.cache.some((r) => r.id === roleId)
}

export function isStatus(shouldBeOnline: boolean) {
  return (m: GuildMember) =>
    shouldBeOnline
      ? m.presence?.status !== "offline" &&
        m.presence?.status !== "invisible" &&
        Boolean(m.presence?.status)
      : true // if not specify online then default to get all
}

export async function pullImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export function isAddress(address: string): { valid: boolean; type: string } {
  try {
    if (ethers.utils.isAddress(address)) {
      return { valid: true, type: "eth" }
    }
    if (PublicKey.isOnCurve(new PublicKey(address))) {
      return { valid: true, type: "sol" }
    }
  } catch (e) {
    return { valid: false, type: "" }
  }
  return { valid: false, type: "" }
}

async function resolveSNSDomain(domain: string) {
  const hashedName = await getHashedName(domain.replace(".sol", ""))
  const nameAccountKey = await getNameAccountKey(
    hashedName,
    undefined,
    new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx") // SOL TLD Authority
  )
  const owner = await NameRegistryState.retrieve(
    new Connection(clusterApiUrl("mainnet-beta")),
    nameAccountKey
  )
  return owner.registry.owner.toBase58()
}

async function resolveENSDomain(domain: string) {
  return await providers.eth.resolveName(domain)
}

export async function resolveNamingServiceDomain(domain: string) {
  try {
    if (domain.endsWith(".sol")) {
      return await resolveSNSDomain(domain)
    }
    return await resolveENSDomain(domain)
  } catch (e) {
    logger.error(`[resolveNamingServiceDomain] failed: ${e}`)
    return ""
  }
}

export async function reverseLookup(address: string) {
  const { type } = isAddress(address)
  try {
    switch (type) {
      case "sol": {
        const connection = new Connection(clusterApiUrl("mainnet-beta"))
        const domainKey = new PublicKey(address)
        return await performReverseLookup(connection, domainKey)
      }
      case "eth":
        return await providers.eth.lookupAddress(address)
      default:
        return ""
    }
  } catch (e) {
    logger.error(`[reverseLookup] failed: ${e}`)
    return ""
  }
}

export function getAuthor(msgOrInteraction: OriginalMessage) {
  return msgOrInteraction instanceof Message
    ? msgOrInteraction.author
    : msgOrInteraction.user
}

export function isValidAmount({
  arg,
  exceptions,
}: {
  arg: string
  exceptions?: string[]
}) {
  if (exceptions?.map((s) => s.toLowerCase()).includes(arg.toLowerCase())) {
    return true
  }
  const amount = parseFloat(arg)
  return !isNaN(amount) && amount > 0
}

export function equalIgnoreCase(s1: string, s2: string) {
  return s1?.toLowerCase() === s2?.toLowerCase()
}

export function removeDuplications(arr: any[]) {
  return arr.filter((item, index) => arr.indexOf(item) === index)
}
