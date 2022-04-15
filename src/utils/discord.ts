import { factsAndTipsManager } from "commands"
import {
  Message,
  TextChannel,
  MessageEmbed,
  GuildEmoji,
  MessageActionRowComponentResolvable,
  User,
  MessageOptions,
  MessageButton,
  EmbedField,
  ColorResolvable,
  MessageActionRow,
  MessageSelectMenu,
  MessageSelectMenuOptions,
  MessageComponentInteraction,
} from "discord.js"
import {
  MessageButtonStyles,
  MessageComponentTypes,
} from "discord.js/typings/enums"
import { TwitterHandleNotFoundError, UserNotFoundError } from "errors"
import twitter from "modules/twitter"
import { DISCORD_ADMIN_GROUP, DOT, VERTICAL_BAR } from "../env"
import guildConfig from "../modules/guildConfig"
import Profile from "modules/profile"
import { Command } from "types/common"

export function isInteraction(
  msgOrInteraction: Message | MessageComponentInteraction
): msgOrInteraction is MessageComponentInteraction {
  return "message" in msgOrInteraction
}

export function getExitButton() {
  return new MessageButton({
    customId: "exit",
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: "Exit",
  })
}

export function getBackButton(customId: string) {
  return new MessageButton({
    customId: customId,
    style: "SECONDARY",
    label: "Back",
  })
}

/**
 * Returns a formatted string of options (maximum 8)
 *
 * @param {string[]} options Array of option strings
 *
 * @return {string} Formatted string
 * */
export function composeSimpleSelection(options: string[]): string {
  return `${options
    .slice(0, 8)
    .map((o, i) => `${getEmoji(`num_${i + 1}`)} ${VERTICAL_BAR} ${o}`)
    .join("\n")}`
}

export function composeSelection(
  options: { title: string; body: string }[]
): EmbedField[] {
  return options.map<EmbedField>((o, i) => {
    return {
      name: `${getEmoji(`num_${(i % 9) + 1}`)} ${o.title}`,
      value: o.body,
      inline: false,
    }
  })
}

export function composeDiscordSelectionRow(
  options: MessageSelectMenuOptions = {}
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu(options)
  )

  return row
}

export function composeDiscordExitButton(): MessageActionRow {
  const row = new MessageActionRow().addComponents(getExitButton())

  return row
}

export function composeDiscordBackButton(customId?: string): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    getBackButton(customId ?? "back")
  )

  return row
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

export async function onlyRunInBotChannel(msg: Message) {
  if (msg.channel.id !== guildConfig.getVerifyChannelId(msg.guildId)) {
    msg.channel.send(
      `sur! head to <#${guildConfig.getVerifyChannelId(
        msg.guildId
      )}> to run your command`
    )
    return false
  }
  return true
}

export async function onlyRunInAdminGroup(msg: Message) {
  const groupId = (msg.channel as TextChannel).parentId
  return groupId === DISCORD_ADMIN_GROUP
}

export async function workInProgress(msg: Message): Promise<MessageOptions> {
  const emoji = msg.client.emojis.cache.get(emojis.NEKO_COOL)
  const embed = new MessageEmbed()
  embed
    .setColor("#F4BE5B")
    .setThumbnail(
      "https://cdn.discordapp.com/emojis/916737804002799699.png?size=240"
    )
    .setTitle("Work In Progress")
    .setDescription(
      `${emoji} This command is currently being worked on, stay tuned!`
    )

  return { embeds: [embed] }
}

// typically used in help message
export function getDefaultEmbed() {
  return new MessageEmbed().setColor("#FBCB2D").setAuthor("Neko Info")
}

export function getHelpEmbed(author?: string) {
  return new MessageEmbed()
    .setColor(msgColors.PRIMARY)
    .setAuthor(author ?? "Neko Info")
}

export async function getLoadingEmbed(msg: Message) {
  const { message, type, no, total } = factsAndTipsManager.random()

  return new MessageEmbed()
    .setColor("#a6cacc")
    .setTitle(`${type === "fact" ? "Fact" : "Tip"} ${no}/${total}`)
    .setDescription(message)
    .setThumbnail(thumbnails.LOADING)
    .setFooter(getEmbedFooter([msg.author.tag]), msg.author.avatarURL())
}

export function getErrorEmbed(params: {
  title: string
  message: string
  avatarFooter?: boolean
  thumbnail?: string
  discordMsg?: Message
  image?: string
}) {
  const embed = new MessageEmbed()
    .setColor(msgColors.ERROR)
    .setTitle(params.title)
    .setDescription(params.message)
  if (params.avatarFooter && params.discordMsg) {
    embed.setFooter(
      getEmbedFooter([`${params.discordMsg.author.tag}`]),
      params.discordMsg.author.avatarURL()
    )
  }

  if (params.image) {
    embed.setImage(params.image)
  }

  if (params.thumbnail) {
    embed.setThumbnail(params.thumbnail)
  }

  return embed
}

export function getInvalidInputEmbed() {
  return new MessageEmbed()
    .setColor(msgColors.ERROR)
    .setAuthor(
      "Invalid input!",
      "https://cdn.discordapp.com/emojis/933341948431962172.webp?size=240&quality=lossless"
    )
    .setDescription(
      "That is an invalid response. Please try again. Type 'exit' to leave the menu."
    )
}

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
  ERROR: "#dc4e4d",
  EMPTY: "#7183A1",
  PRIMARY: "#EF3EFF",
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

export function getPaginatedData<T = any>(
  originalData: T[],
  pageSize: number,
  page: number
) {
  const startIndex = page * pageSize
  const endIndex = Math.min((page + 1) * pageSize, originalData.length)
  return originalData.slice(startIndex, endIndex)
}

export function getPaginatedRecordData<T = any>(
  originalData: Record<string, T>,
  pageSize: number,
  page: number
) {
  const startIndex = page * pageSize
  const endIndex = Math.min(
    (page + 1) * pageSize,
    Object.keys(originalData).length
  )
  const result: Record<string, any> = {}
  Object.keys(originalData)
    .slice(startIndex, endIndex)
    .forEach((date) => (result[date] = originalData[date]))
  return result
}

export function getPaginationButtons(
  page: number,
  totalPages: number,
  customIds: string[]
) {
  const actionButtons: MessageActionRowComponentResolvable[] = []
  if (page !== 0) {
    actionButtons.push({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.PRIMARY,
      label: "Previous",
      customId: customIds[0],
    })
  }

  if (page !== totalPages - 1) {
    actionButtons.push({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.PRIMARY,
      label: "Next",
      customId: customIds[1],
    })
  }
  return actionButtons
}

export function getPaginationRow(page: number, totalPages: number) {
  const row = new MessageActionRow()
  if (page !== 0) {
    row.addComponents(
      new MessageButton()
        .setStyle("PRIMARY")
        .setLabel("Previous")
        .setCustomId("back")
        .setEmoji(getEmoji("prev_page"))
    )
  }
  if (page !== totalPages - 1) {
    row.addComponents(
      new MessageButton()
        .setStyle("PRIMARY")
        .setLabel("Next")
        .setCustomId("next")
        .setEmoji(getEmoji("next_page"))
    )
  }

  return row
}

export function roundFloatNumber(n: number, fractionDigits = 1) {
  return parseFloat(parseFloat(`${n}`).toFixed(fractionDigits))
}

export async function getUserInfoParams(
  args: string[],
  msg: Message,
  action?: string
): Promise<Record<string, string>> {
  const addressReg = /^0x[0-9a-fA-F]{40}$/
  const usernameReg = /^.{3,32}#[0-9]{4}$/
  const params: Record<string, string> = {
    address: null,
    discordId: null,
    guildId: null,
  }
  const userInfo = args.slice(1).join(" ")
  switch (true) {
    // address
    case addressReg.test(userInfo):
      params.address = userInfo
      break
    // username#discriminator
    case usernameReg.test(userInfo):
      const userData = userInfo.split("#")
      const members = await msg.guild.members.fetch({
        query: userData[0],
      })

      for (const member of members.values()) {
        if (
          member.user.username === userData[0] &&
          member.user.discriminator === userData[1]
        ) {
          params.discordId = member.id
          break
        }
      }

      if (params.discordId === null) {
        throw new UserNotFoundError({
          message: msg,
          guildId: msg.guildId,
        })
      }
      break

    // set twitter handle
    case action === "twitter":
      params.discordId = args[2].match(/\d+/)?.[0]
      params.twitterHandle = twitter.parseTwitterHandle(args[3])
      if (!params.discordId) {
        throw new UserNotFoundError({
          message: msg,
          guildId: msg.guild.id,
        })
      }
      if (!params.twitterHandle) {
        throw new TwitterHandleNotFoundError({ message: msg })
      }
      await Profile.updateTwitterHandle({
        discordId: params.discordId,
        twitterHandle: params.twitterHandle,
        guildId: params.guildId,
        isAdminCommand: true,
      })

      break

    // only username
    default:
      {
        const members = await msg.guild.members.fetch({
          query: userInfo,
          limit: 1,
        })
        if (members.size === 0) {
          throw new UserNotFoundError({
            message: msg,
            guildId: msg.guildId,
          })
        }
        params.discordId = members.first().id
      }
      break
  }
  return params
}
