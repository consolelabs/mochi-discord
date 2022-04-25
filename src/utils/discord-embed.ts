import {
  ColorResolvable,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectMenuOptions,
} from "discord.js"
import { EMPTY, PREFIX, SPACE, VERTICAL_BAR } from "./constants"
import {
  getCommandArguments,
  getEmbedFooter,
  getEmoji,
  msgColors,
  specificHelpCommand,
} from "./common"
import { EmbedProperties } from "types/common"
import { commands } from "commands"

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

export function composeDiscordSelectionRow(
  options: MessageSelectMenuOptions = {}
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu(options)
  )

  return row
}

function getExitButton() {
  return new MessageButton({
    customId: "exit",
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: "Exit",
  })
}

export function composeDiscordExitButton(): MessageActionRow {
  const row = new MessageActionRow().addComponents(getExitButton())

  return row
}

export async function workInProgress(msg: Message): Promise<MessageOptions> {
  const embed = new MessageEmbed()
  embed
    .setColor("#F4BE5B")
    .setThumbnail(
      "https://cdn.discordapp.com/emojis/916737804002799699.png?size=240"
    )
    .setTitle("Work In Progress")
    .setDescription("This command is currently being worked on, stay tuned!")

  return { embeds: [embed] }
}

export function composeEmbedMessage(
  msg: Message | null,
  props: EmbedProperties
) {
  const {
    title,
    description,
    thumbnail,
    color,
    footer = [],
    timestamp = null,
    image,
    author,
    originalMsgAuthor,
  } = props
  // display command name as title if this is a command's help embed
  const isSpecificHelpCommand = specificHelpCommand(msg)
  const args = getCommandArguments(msg)

  let commandKey = ""
  if (args.length > 0) {
    commandKey = isSpecificHelpCommand ? args[1] : args[0].slice(PREFIX.length)
  }
  const commandName = commands[commandKey]?.name

  let authorTag = msg?.author?.tag
  let authorAvatarURL = msg?.author?.avatarURL()
  if (originalMsgAuthor) {
    authorTag = originalMsgAuthor.tag
    authorAvatarURL = originalMsgAuthor.avatarURL()
  }

  const embed = new MessageEmbed()
    .setTitle(isSpecificHelpCommand ? commandName : title ?? "")
    .setColor((color ?? msgColors.PRIMARY) as ColorResolvable)
    .setFooter(
      getEmbedFooter(authorTag ? [...footer, authorTag] : ["Mochi bot"]),
      authorAvatarURL
    )
    .setTimestamp(timestamp ?? new Date())

  if (description) embed.setDescription(description)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (!!author && author.length === 1) embed.setAuthor(author[0])
  if (!!author && author.length === 2) embed.setAuthor(author[0], author[1])

  return embed
}

export function getErrorEmbed(params: {
  title: string
  description?: string
  thumbnail?: string
  msg: Message
  image?: string
}) {
  const { title, description, thumbnail, msg, image } = params
  return composeEmbedMessage(msg, {
    title,
    description:
      description ??
      "Something went wrong! Please try again or contact administrators",
    image,
    thumbnail,
    color: msgColors.ERROR,
  })
}

export function getInvalidInputEmbed(msg: Message) {
  return composeEmbedMessage(msg, {
    color: msgColors.ERROR,
    author: [
      "Invalid input!",
      "https://cdn.discordapp.com/emojis/933341948431962172.webp?size=240&quality=lossless",
    ],
    description:
      "That is an invalid argument. Please see help message of the command",
  })
}
