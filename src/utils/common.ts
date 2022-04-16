import {
  Message,
  TextChannel,
  GuildEmoji,
  User,
  MessageOptions,
  ColorResolvable,
  MessageComponentInteraction,
} from "discord.js"
import { DISCORD_ADMIN_GROUP } from "../env"
import { Command } from "types/common"
import { DOT, SPACE, VERTICAL_BAR } from "./constants"

export const tokenEmojis: Record<string, string> = {
  FTM: "920934041535000637",
  SPIRIT: "920934042021531668",
  TOMB: "920934042147368960",
  REAPER: "920934041610502155",
  BOO: "920934041665011713",
  SPELL: "926013051730296862",
  BTC: "961105849181437952",
}

export const chainEmojis: Record<string, string> = {
  ETHEREUM: "928216430451761172",
  FANTOM: "928216448902508564",
  BINANCE: "928216430632132638",
  POLYGON: "928216430535671818",
  AVALANCHE: "928216430615355412",
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

export const pgBarEmojis: { [key: string]: string } = {
  XP_REBELLIO_LEFT: "933606190523490324",
  XP_REBELLIO: "933606189512683520",
  XP_REBELLIO_RIGHT: "933606190678679633",

  XP_IMPERIAL_LEFT: "933612077686341672",
  XP_IMPERIAL: "933612077300473866",
  XP_IMPERIAL_RIGHT: "933612078856552498",

  XP_MERCHANT_LEFT: "933612151732596786",
  XP_MERCHANT: "933612151753572393",
  XP_MERCHANT_RIGHT: "933612151174758401",

  XP_ACADEMY_LEFT: "933606673178820658",
  XP_ACADEMY: "933606672709074974",
  XP_ACADEMY_RIGHT: "933606672444817408",

  XP_BAR_LEFT: "933276771133063198",
  XP_BAR: "933276771107868692",
  XP_BAR_RIGHT: "933276771141451856",
}

export const dappActionEmojis: { [key: string]: string } = {
  TIP: "933384794627248128",
  BUY: "933341119998210058",
  DEPOSIT: "933339868224958504",
  WITHDRAW: "933339868233359380",
  MINT: "900024905477808140",
  BID: "931194309661823006",
  "CONNECT-TWITTER": "932208655313551420",
  "SHARE-TWITTER": "932208655313551420",
}

export const defaultEmojis: Record<string, string> = {
  ERROR: ":no_entry_sign:",
  AIRPLANE: ":airplane:",
  CHECK: ":white_check_mark:",
  ARROW_DOWN: ":arrow_heading_down:",
  ARROW_UP: ":arrow_heading_up:",
}

export const balanceIcons: { [key: string]: string } = {
  SHRIMP_0:
    "https://cdn.discordapp.com/emojis/930107037814259722.png?size=240&quality=lossless",
  CRAB_1000:
    "https://cdn.discordapp.com/emojis/930107167573438514.png?size=240&quality=lossless",
  SQUID_3000:
    "https://cdn.discordapp.com/emojis/930107225521946704.png?size=240&quality=lossless",
  DOLPHIN_7000:
    "https://cdn.discordapp.com/emojis/930107285093638204.png?size=240&quality=lossless",
  SHARK_13000:
    "https://cdn.discordapp.com/emojis/930107329305796729.png?size=240&quality=lossless",
  WHALE_20000:
    "https://cdn.discordapp.com/emojis/930107395697430588.png?size=240&quality=lossless",
}

export const emojis: { [key: string]: string } = {
  GOOD_MORNING: "930840080761880626",
  RED_ENVELOPE: "936234043513638973",
  SWAP: "933340602223955998",
  REVOKE: "933341948431962172",
  STAR: "933281365384908810",
  TRANSACTION: "933341692667506718",
  LEADERBOARD_1: "933281365347151903",
  PROFILE_1: "933281365498155038",
  WALLET: "933281364919349279",
  ADDRESS: "933281365254873128",
  BALANCE: "933341119998210058",
  PORTFOLIO: "933340734273232957",
  SEARCH: "933341511062552626",
  EXIT: "932296011785863239",
  DASH: "928213014824488990",
  REPLY: "915972703050162237",
  NEKO: "900024905477808140",
  NEKO_SAD: "900363887122186310",
  NEKO_HORRIFIED: "900024905507160154",
  NEKO_FIRE: "900363886979612682",
  NEKO_COOL: "900024905486172281",
  NEKO_TOUCH: "900363887050911784",
  NEKO_PUKE_WHITE: "900748086522048512",
  NEKO_STARE: "900024905758834708",
  PROFILE: "916737804384485447",
  COUNCIL: "916737806137688074",
  GAMES: "916737806288715807",
  LEADERBOARD: "916737806129315921",
  SOCIAL: "933281365586227210",
  WIP: "916737804002799699",
  BLANK: "916757233122021376",
  TWITTER: "932208655313551420",
  PAW: "887275176113373194",
  PREV_PAGE: "935053694112784424",
  NEXT_PAGE: "935053694439936070",
  ...chainEmojis,
  ...tokenEmojis,
  ...numberEmojis,
  ...pgBarEmojis,
  ...dappActionEmojis,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88", // 500
  ERROR: "#D73833", // 900
}

export const thumbnails: Record<string, string> = {
  HELP: "https://i.imgur.com/uuQhOmH.png",
  PORTFOLIO: "https://i.imgur.com/t84U7AA.png",
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
  return `> **${text} ${DOT} [** ${getEmoji("paw")} ${user.tag} **]${
    typeof ctas === "string" && ctas !== "" ? ` ${DOT}${ctas}` : ""
  }**`
}

export function getEmbedFooter(texts: string[]): string {
  return texts.join(` ${DOT} `)
}

export async function onlyRunInAdminGroup(msg: Message) {
  const groupId = (msg.channel as TextChannel).parentId
  return groupId === DISCORD_ADMIN_GROUP
}

export function getListCommands(
  _emoji: GuildEmoji | string,
  commands: Record<string, Pick<Command, "command" | "name">>
) {
  const emoji = getEmoji("reply")
  return Object.values(commands)
    .map((c) => `[**${c.command}**](https://pod.town)\n${emoji}${c.name}`)
    .join("\n\n")
}

export default function maskAddress(str: string, minLen?: number) {
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

export const isGmMessage = (message: Message) =>
  message.content === "gm" ||
  message.content === "gn" ||
  message.content === "<:gm:930840080761880626>" ||
  (message.stickers.get("928509218171006986") &&
    message.stickers.get("928509218171006986").name === ":gm")

export const getCommandArguments = (message: Message) =>
  message.content.split(SPACE)
