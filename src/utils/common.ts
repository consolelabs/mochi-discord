import {
  Message,
  TextChannel,
  GuildEmoji,
  User,
  MessageOptions,
  ColorResolvable,
  MessageComponentInteraction,
  Permissions,
} from "discord.js"
import { DISCORD_ADMIN_GROUP } from "../env"
import { Command } from "types/common"
import { API_BASE_URL, DOT, SPACE, VERTICAL_BAR } from "./constants"

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

export const defaultEmojis: Record<string, string> = {
  ERROR: ":no_entry_sign:",
  AIRPLANE: ":airplane:",
  CHECK: ":white_check_mark:",
  ARROW_DOWN: ":arrow_heading_down:",
  ARROW_UP: ":arrow_heading_up:",
}

export const emojis: { [key: string]: string } = {
  GOOD_MORNING: "930840080761880626",
  REVOKE: "933341948431962172",
  REPLY: "915972703050162237",
  PROFILE: "916737804384485447",
  DEFI: "933281365586227210",
  BLANK: "916757233122021376",
  PREV_PAGE: "935053694112784424",
  NEXT_PAGE: "935053694439936070",
  ...chainEmojis,
  ...tokenEmojis,
  ...numberEmojis,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88", // 500
  ERROR: "#D73833", // 900
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

export async function onlyRunInAdminGroup(msg: Message) {
  const groupId = (msg.channel as TextChannel).parentId
  return groupId === DISCORD_ADMIN_GROUP
}

export async function onlyAdminsAllowed(msg: Message) {
  return msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
}

export function getListCommands(
  _emoji: GuildEmoji | string,
  commands: Record<string, Pick<Command, "command" | "name" | "experimental">>
) {
  const emoji = getEmoji("reply")
  return Object.values(commands)
    .filter((c) => !c.experimental)
    .map((c) => `[**${c.command}**](https://google.com)\n${emoji}${c.name}`)
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

export const getCommandArguments = (message: Message) =>
  message ? message.content.split(SPACE) : []

export const numberWithCommas = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

// TODO: integrate with BE
export async function handleNormalMessage(_message: Message) {
  // const resp = await fetch(`${API_BASE_URL}/messages/handle`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(message),
  // })
  // if (resp.status !== 200) {
  //   throw new Error("Error while handling messages")
  // }
  // const json = await resp.json()
  // if (json.error !== undefined) {
  //   throw new Error(json.error)
  // }
  // return json
}
