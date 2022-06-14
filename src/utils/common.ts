import {
  Message,
  GuildEmoji,
  User,
  MessageOptions,
  ColorResolvable,
  MessageComponentInteraction,
  Permissions,
} from "discord.js"

import { Command } from "types/common"
import { DOT, VERTICAL_BAR } from "./constants"

export const tokenEmojis: Record<string, string> = {
  FTM: "967285237686108212",
  SPIRIT: "967285237962924163",
  TOMB: "967285237904179211",
  REAPER: "967285238306857063",
  BOO: "967285238042599434",
  SPELL: "967285238063587358",
  BTC: "967285237879013388",
  ETH: "972205674173972542",
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
  COMMON1: "976765463008776272",
  COMMON2: "976765462559989811",
  COMMON3: "976765462576771112",

  RARE1: "976765462769713172",
  RARE2: "976765462916497439",
  RARE3: "976765462920720394",

  UNCOMMON1: "976765462723579956",
  UNCOMMON2: "976765463029760020",
  UNCOMMON3: "976765463096852540",

  LEGENDARY1: "976765462115401749",
  LEGENDARY2: "976765462698410024",
  LEGENDARY3: "976765462757117993",

  MYTHIC1: "976765462748741673",
  MYTHIC2: "976765462786498590",
  MYTHIC3: "976765462845222964",
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
  ...tokenEmojis,
  ...numberEmojis,
  ...rarityEmojis,
}

export const msgColors: Record<string, ColorResolvable> = {
  PRIMARY: "#E88B88",
  ERROR: "#D94F50",
  DEFI: "#9EFFE8",
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
        `[**${c.command}**](https://google.com)\n${emoji}${correctBrief(
          c.brief
        )}`
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
