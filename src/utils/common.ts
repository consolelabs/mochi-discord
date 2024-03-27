import { swr } from "adapters/fetcher"
import CacheManager from "cache/node-cache"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  ColorResolvable,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Permissions,
  User,
} from "discord.js"
import { MARKETPLACE_BASE_URL } from "env"
import { OriginalMessage } from "errors"
import { ethers } from "ethers"
import { logger } from "logger"
import fetch from "node-fetch"
import type { Pagination } from "types/common"
import { TopNFTTradingVolumeItem } from "types/community"
import providers from "utils/providers"

import {
  getHashedNameSync,
  getNameAccountKeySync,
  NameRegistryState,
  reverseLookup as performReverseLookup,
} from "@bonfida/spl-name-service"
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js"
import { Address } from "@ton/core"

import { emojis as fetchedEmojis } from "../"
import { DOT, SPACE } from "./constants"
import {
  marketplaceEmojis,
  rarityEmojis,
  traitEmojis,
  traitTypeMapping,
} from "./nft"

dayjs.extend(relativeTime)

const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx",
)

export const countryFlagEmojis = {
  "UNITED STATES": ":flag_us:",
  "EURO ZONE": ":flag_eu:",
  "UNITED KINGDOM": ":flag_gb:",
}

export const tokenEmojis = {
  FANTOM: "1113120054352019476",
  ETHEREUM: "972205674173972542",
  SPIRIT_CHAIN: "1113120136879165560",
  BSC: "1113114862596391033",

  FTM: "967285237686108212",
  SPIRIT: "967285237962924163",
  TOMB: "967285237904179211",
  REAPER: "967285238306857063",
  BOO: "1151074936253845505",
  SPELL: "1150806619920273428",
  BTC: "1150601628559360010",
  ETH: "1113120035783856209",
  WETH: "1052849700019109889",
  BNB: "1150601624461508688",
  CAKE: "1113114867361120287",
  OP: "1113120107107987568",
  USDT: "1150601617629003858",
  USDC: "1150601614676197417",
  ADA: "1005010608443359272",
  XRP: "1113115473022832680",
  BUSD: "1005010097535197264",
  DOT: "1005009972716908554",
  DOGE: "1004962950756454441",
  DAI: "1005009904433647646",
  MATIC: "1150601602835685456",
  WMATIC: "1150806619920273428",
  AVAX: "1113114813455937579",
  UNI: "1005012087967334443",
  SHIB: "1005009723277463703",
  TRX: "1005009394209128560",
  WBTC: "1121653566550048838",
  ETC: "1005009314802569277",
  LEO: "1005009244187263047",
  LTC: "1005009185940963380",
  FTT: "1005009144044064779",
  CRO: "1005009127937949797",
  LINK: "1005008904205385759",
  CHAINLINK: "1005008904205385759",
  NEAR: "1150803872982519861",
  ATOM: "1114116090759487560",
  XLM: "1113115466727170208",
  XMR: "1005008819866312724",
  BCH: "1121653562326397012",
  APE: "1150805766178078780",
  DFG: "1007157463256145970",
  ICY: "1049620715374133288",
  CARROT: "1113154879779786773",
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
  BRUSH: "1113120008684441631",
  SOL: "1150803875884978216",
  SOLANA: "1150803875884978216",
  APT: "1151073569103695922",
  APTOS: "1150803860827426839",
  RON: "1149678716985810944",
  WRON: "1149678716985810944",
  ARB: "1150809015434104884",
  OKC: "1006838263165767681",
  ONUS: "1077203550075093053",
  SUI: "1150601612440633424",
  FBOMB: "1113114920360353824",
  MCLB: "1113114976350122005",
  POL: "1037985931816349746",
  SAMO: "1151075961987661915",
  BONK: "1095714104108388362",
  STG: "1150989167992508508",
  ASTAR: "1113114810012422245",
  LUNC: "1113114970239017031",
  ETHW: "1113114916757446718",
  SKULLSWAP_EXCHANGE: "1113115377153613877",
  SYN: "1113115410020179998",
  TSHARE: "1113115430203170897",
  TAROT: "1115116219624869918",
  METIS: "1113114980624113684",
  BEND: "1113114838391066697",
  ICE: "1115841380883894363",
  MONERO: "1113115286489530408",
  RDNT: "1113115338192715849",
  KEK: "1113114952526483588",
  OATH: "1113115308073435219",
  LDO: "1113114936432918591",
  ARKN: "1113114806543728670",
  RXD: "1113115351585132564",
  VET: "1113115453766774855",
  SUSHI: "820335596186763295",
  SOUL: "1113115383742865458",
  EQUAL: "1113114913087443034",
  CETUS: "1113114876164984863",
  TSUKA: "1113115434611384380",
  BLUR: "1113114854488809472",
  PNDR: "1113115334292025405",
  LQDR: "1113114963838521415",
  CSPR: "1113114884637474859",
  USTC: "1113115444916785274",
  BAY: "1113114831755673712",
  THE: "1113115413270769715",
  BASED: "1115120132289724476",
  BASE: "1150810490012958800",
  KAS: "1113114949342994543",
  AIDOGE: "1113114778001481869",
  SOLID: "1113115381184331929",
  ORCA: "1113115321797197917",
  MMY: "1113115281586401280",
  MAGIC: "1114116202466398238",
  BEETS: "1113114834540703885",
  SIS: "1115122571659186307",
  PIP: "1113115324569616454",
  TIMELESS: "1113115416760426529",
  MPX: "1113115291824697434",
  STRAX: "1113115392529924287",
  SCREAM: "1113115360800014346",
  SSS: "1113115387538706516",
  RADIANT: "1113115351585132564",
  LRC: "1113114967021998211",
  DEUS: "1115129025191497768",
  MYRA: "1115129131647123496",
  SPOOKYSWAP: "967285238042599434",
  GMT: "1113114925280280637",
  BIT: "1113114840609865749",
  PLS: "1113115330986901565",
  ROSE: "1113115304176922655",
  OMI: "1113115318735351880",
  OKB: "1041845602033614948",
  CONK: "1113114880338317335",
  X2Y2: "1113115463329792222",
  QNT: "1006838231159033906",
  SPACEFI: "1113120133041377310",
  FLOKI: "1113120048098324521",
  HOOK: "1113120062979715122",
  PERP: "1113120116171866182",
  AHE: "1113115806302224414",
  ICP: "1150803870080057359",
  XCAL: "1113120173214416906",
  WGMI: "1113120161621344346",
  SKULL: "1113115377153613877",
  HUM: "1113120067496984586",
  BFG: "1113115816636977192",
  CHESS: "1113120027089059861",
  TREEB: "1113120140201033759",
  LODE: "1113120095326179348",
  SFTMX: "1113120124900216844",
  ALGO: "1006838257843179520",
  BSGG: "1113120013155586158",
  FUSD: "1113120058600857682",
  AXS: "1150803865948651560",
  FCTR: "1113120040657625159",
  UNIDX: "1113120144793800754",
  KAI: "1113120080151199824",
  PENDLE: "1113120112485085315",
  BINANCE: "1116727169654206595",
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
  ANIMATED_STAR_GREYSCALE: "1112649018615533658",
  ANIMATED_PARTY_POPPER: "1095990305414709331",
  ANIMATED_VAULT_KEY: "1093923048807203016",
  ANIMATED_TOKEN_ADD: "1095990093585592360",
  ANIMATED_POINTING_RIGHT: "1093923073557807175",
  ANIMATED_POINTING_DOWN: "1093923065169199144",
  ANIMATED_WITHDRAW: "1095990359840002130",
  ANIMATED_XP: "1093923101202452501",
  ANIMATED_MONEY: "1093923034131353762",
  ANIMATED_CROWN: "1093923029672796261",
  ANIMATED_CHART_INCREASE: "1110454129509269644",
  ANIMATED_CHART_DECREASE: "1110454113247965275",
  ANIMATED_TROPHY: "1095990335794069614",
  ANIMATED_MAIL_RECEIVE: "1093923054389837854",
  ANIMATED_MAIL_SEND: "1093923059498496045",
  ANIMATED_SHRUGGING: "1095990328898637824",
  ANIMATED_IDEA: "1095990263828197428",
  ANIMATED_ROBOT: "1095990316147937382",
  ANIMATED_CHEST: "1095990185658945566",
  ANIMATED_ARROW_UP: "1093922976912638094",
  ANIMATED_DIAMOND: "1095990245876576316",
  ANIMATED_GEM: "1095990259877158964",
  ANIMATED_MOCHI_SPIN: "1098960373417250886",
  ANIMATED_FLASH: "1093923038325653634",
}

export const shapes = {
  MEDIUM_RED_TRIANGLE: "🔺",
  MEDIUM_ORANGE_DIAMOND: "🔸",
  MEDIUM_BLUE_DIAMOND: "🔹",
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
  CONVERSION: "1100681077808443423",
  LINE: "1119200809880666164",
  PREV_PAGE: "967285237958705162",
  NEXT_PAGE: "967285238000676895",
  SPARKLE: "984824963112513607",
  ENERGY: "984876653090070658",
  FLAG: "1058304313157500978",
  COIN: "942088817391849543",
  MONEY: "985245648716697680",
  GAME: "916623575824338974",
  APPROVE: "1077631110047080478",
  APPROVE_GREY: "1097925666483228822",
  NFTS: "977508805011181638",
  SWAP: "933340602223955998",
  SWAP_ROUTE: "1090477921128431636",
  LIKE: "900370883594551348",
  PAWCOIN: "887275176113373194",
  EXP: "1016985999039016982",
  LEFT_ARROW: "935053694112784424",
  RIGHT_ARROW: "935053694439936070",
  SEARCH: "933341511062552626",
  PREDICTION: "931194309385003058",
  FELLOWSHIP: "922044644928421888",
  TRADE: "1026414280498757652",
  DISCORD: "1039475287169183744",
  TWITTER: "1097390164629782539",
  TELEGRAM: "1097390168723435550",
  GITHUB: "1219931821815500800",
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
  MOCHI_SQUARE: "1108255728298381414",
  MOCHI_CIRCLE: "1108255728298381414",
  NEKOSAD: "900363887122186310",
  HUH: "907525013417115689",
  WALLET: "933342303546929203",
  WALLET_2: "1077631115340304495",
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
  DASHBOARD: "933339868795404408",
  SHELTER: "998929232212275221",
  PENCIL: "1078633895500722187",
  WINKINGFACE: "1058304390869549117",
  WALLET_1: "1077631121614970992",
  PLUS: "1078633897513992202",
  ARROW_UP: "1058304264071561267",
  ARROW_DOWN: "1058304267737374720",
  CLOCK: "1080757110146605086",
  NFT2: "1080788646841557072",
  BIN: "1078633887292477450",
  SLOW: "1085777459875696690",
  NORMAL: "1058304356421730424",
  PRAY: "1058304356421730424",
  FAST: "1085777392552910959",
  MOCHI_APP: "1086128796412944444",
  MOCHI_PAY: "1086128801903284294",
  GIFT: "1086128793988632669",
  QUEST: "1086128805191622697",
  CLIPBOARD: "1085873013309833216",
  PROPOSAL: "1087564986504708167",
  CHECK: "1077631110047080478",
  CONFIG: "1058304297395306496",
  MONIKER: "1090477895861944411",
  TREASURER: "1098461538609799278",
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
  WEB: "1058304372469141524",
  CHART: "1058304295205883936",
  HAMMER: "1087564968536317953",
  QRCODE: "1106995993678975056",
  LEAF: "1087564972474769458",
  BANK: "1090902907244777542",
  BELL: "1087564962941124679",
  XP: "1058304395000938516",
  EVM: "991657409082830858",
  GRIM: "1115115006040756294",
  OASIS: "1113115304176922655",
  OCEAN: "1113115314113224764",
  NO: "1112604245875765319",
  METAMASK: "1121380474766491648",
  CHAT: "1078633889247006790",
  CALENDAR: "🗓️",
  CALENDAR_NUMBER: "📅",
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
  ...countryFlagEmojis,
  ...shapes,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88",
  ERROR: "#D94F4F",
  SUCCESS: "#5cd97d",
  PINK: "#FCD3C1",
  GRAY: "#1E1F22",
  // BLUE: "#34AAFF",
  BLUE: "#62A1FE",
  GREEN: "#5CD97D",
  YELLOW: "#FFCC4C",
  MOCHI: "#34AAFF",
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
  MOCHI_POSE_11:
    "https://cdn.discordapp.com/attachments/1003535223973224478/1115944536879939724/Mochi_Pose_11.png",
  MOCHI_POSE_12:
    "https://cdn.discordapp.com/attachments/1052079279619457095/1116938833888555048/Mochi_Pose_12.png",
  MOCHI_POSE_14:
    "https://cdn.discordapp.com/attachments/984660970624409630/1098472181631045742/Mochi_Pose_14.png",
  MOCHI_POSE_17:
    "https://cdn.discordapp.com/attachments/1052079279619457095/1118039688922529832/Mochi_Pose_17.png",
  ROCKET:
    "https://cdn.discordapp.com/attachments/933195103273627719/1100350433295339541/rocket.webp",
}

export type EmojiKey = keyof typeof emojis
export type TokenEmojiKey = keyof typeof tokenEmojis

export function isInteraction(
  msgOrInteraction: Message | MessageComponentInteraction,
): msgOrInteraction is MessageComponentInteraction {
  return "message" in msgOrInteraction
}

export function getHeader(text: string, user: User, ctas?: string) {
  return `> **${text} ${DOT} [** ${user.tag} **]${
    typeof ctas === "string" && ctas !== "" ? ` ${DOT}${ctas}` : ""
  }**`
}

export function hasAdministrator(member?: GuildMember | null) {
  if (!member) return false
  return member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
}

export function maskAddress(str: string, minLen?: number) {
  const num = minLen || 8
  if (str.length > num && str.length > 3) {
    const a = Math.round((num * 2) / 3)
    const b = num - a

    return `${str.substring(0, a)}***${str.substring(
      str.length - b,
      str.length,
    )}`
  }

  return str
}

export function getEmoji(
  key: EmojiKey | "",
  _animated?: boolean,
  fallback = "<a:coin:1093923016691421205>",
) {
  return fetchedEmojis?.get(key.toUpperCase())?.emoji ?? fallback
  // const emoji = api.emojis.get(key.toUpperCase())
  // const text = emoji?.emoji?.replaceAll("_", key.toLowerCase()) ?? fallback
  // return (text as string).trim()
}

export function getEmojiToken(key: TokenEmojiKey, animated?: boolean) {
  return getEmoji(key, animated, getEmoji("ANIMATED_COIN_1", true))
}

export function roundFloatNumber(n: number, fractionDigits = 1) {
  return parseFloat(parseFloat(`${n}`).toFixed(fractionDigits))
}

export function capFirst(str = "") {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export function getEmojiURL(emojiId: string) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.png?size=240&quality=lossless`
}

export function getAnimatedEmojiURL(emojiId: string) {
  return `https://cdn.discordapp.com/emojis/${emojiId}.gif?size=240&quality=lossless`
}

export function shortenHashOrAddress(hash: string, len = 3, lenRight = 4) {
  if (!hash) return ""
  return `${hash.slice(0, len)}..${hash.slice(hash.length - lenRight)}`
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
  symbol: Map<string, number>,
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
      (w) => `${w[0]?.toUpperCase() ?? ""}${w.slice(1)?.toLowerCase() ?? ""}`,
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
  tokenId: string,
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
  (authorId: string) => (i: MessageComponentInteraction) => {
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
    url,
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

export function isHex(value: string): boolean {
  return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0
}

export function getHexByteLength(value: string): number {
  return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2
}

export function isValidSuiAddress(value: string): boolean {
  const SUI_ADDRESS_LENGTH = 32
  return isHex(value) && getHexByteLength(value) === SUI_ADDRESS_LENGTH
}

export function isValidTonAddress(value: string): boolean {
  try {
    Address.parse(value)
  } catch (e) {
    return false
  }

  return true
}

export function isValidRoninAddress(value: string): boolean {
  return value.length === 46 && value.toLowerCase().startsWith("ronin:")
}

export enum AddressChainType {
  EVM = "EVM",
  SOL = "SOL",
  SUI = "SUI",
  RON = "RON",
  TON = "TON",
  UNKNOWN = "",
}

export function isAddress(address: string): {
  valid: boolean
  chainType: AddressChainType
} {
  try {
    if (ethers.utils.isAddress(address)) {
      return {
        valid: true,
        chainType: AddressChainType.EVM,
      }
    }
    if (isValidRoninAddress(address)) {
      return { valid: true, chainType: AddressChainType.RON }
    }
    if (isValidSuiAddress(address)) {
      return { valid: true, chainType: AddressChainType.SUI }
    }
    if (isValidTonAddress(address)) {
      return { valid: true, chainType: AddressChainType.TON }
    }
    // TODO: consider catching error inside SOL addr checking, because if any error occurs it will return false immediately even if it's a valid address of another chain that is checked after this sol check
    if (PublicKey.isOnCurve(new PublicKey(address))) {
      return { valid: true, chainType: AddressChainType.SOL }
    }
  } catch (e) {
    return { valid: false, chainType: AddressChainType.UNKNOWN }
  }
  return { valid: false, chainType: AddressChainType.UNKNOWN }
}

async function resolveSNSDomain(domain: string) {
  const hashedName = getHashedNameSync(domain.replace(".sol", ""))
  const nameAccountKey = getNameAccountKeySync(
    hashedName,
    undefined,
    SOL_TLD_AUTHORITY,
  )
  const owner = await NameRegistryState.retrieve(
    new Connection(clusterApiUrl("mainnet-beta")),
    nameAccountKey,
  )
  return owner.registry.owner.toBase58()
}

async function resolveENSDomain(domain: string) {
  return await providers.eth.resolveName(domain)
}

CacheManager.init({
  pool: "naming-service",
  // 1 week
  ttl: 604800,
  checkperiod: 604800,
})
export async function resolveNamingServiceDomain(domain: string) {
  if (!domain) return domain
  return await CacheManager.get({
    pool: "naming-service",
    key: domain,
    call: async () => {
      try {
        if (domain.endsWith(".sol")) {
          return await resolveSNSDomain(domain)
        }
        return (await resolveENSDomain(domain)) || ""
      } catch (e) {
        logger.error(`[resolveNamingServiceDomain] failed: ${e}`)
        return ""
      }
    },
  })
}

const connection = new Connection(clusterApiUrl("mainnet-beta"))
export function lookUpDomains(address: string, shorten = true) {
  const cacheKey = `GET lookupDomains/${address}`

  return new Promise<string>((resolve) => {
    let api = false
    let returnNormal = false
    swr(cacheKey, async () => await doLookup(address, shorten)).then(
      ({ value }) => {
        api = true
        if (returnNormal) return
        resolve(value)
      },
    )

    setTimeout(() => {
      returnNormal = true
      if (api) return
      resolve(shorten ? shortenHashOrAddress(address, 5, 5) : address)
    }, 500)
  })
}

async function doLookup(_address: string, shorten: boolean) {
  const { chainType } = isAddress(_address)
  const address = shorten ? shortenHashOrAddress(_address, 5, 5) : _address
  try {
    switch (chainType) {
      case AddressChainType.SOL: {
        const domainKey = new PublicKey(_address)
        return await performReverseLookup(connection, domainKey)
      }
      case AddressChainType.EVM:
        return (await providers.eth.lookupAddress(_address)) || address
      default:
        return address
    }
  } catch (e) {
    logger.warn(`[reverseLookup] failed for ${address}/${chainType}: ${e}`)
    return address
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
  const amount = Number(arg)
  return !Number.isNaN(amount) && amount > 0
}

export function equalIgnoreCase(
  s1: string | undefined,
  s2?: string | undefined,
) {
  return s1?.toLowerCase() === s2?.toLowerCase()
}

export function removeDuplications(arr: any[]) {
  return arr.filter((item, index) => arr.indexOf(item) === index)
}
