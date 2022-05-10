import {
  ColorResolvable,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectMenuOptions
} from "discord.js"
import { COMMA, VERTICAL_BAR } from "./constants"
import {
  defaultEmojis,
  getEmbedFooter,
  getEmoji,
  getListCommands,
  msgColors
} from "./common"
import {
  getCommandObject,
  getActionCommand,
  specificHelpCommand
} from "./commands"
import { EmbedProperties } from "types/common"

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

export function getExitButton() {
  return new MessageButton({
    customId: "exit",
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: "Exit"
  })
}

export function composeDiscordExitButton(): MessageActionRow {
  const row = new MessageActionRow().addComponents(getExitButton())

  return row
}

export async function workInProgress(): Promise<MessageOptions> {
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
  let {
    title,
    description = "",
    thumbnail,
    color,
    footer = [],
    timestamp = null,
    image,
    author,
    originalMsgAuthor,
    usage,
    examples
  } = props
  const commandObj = getCommandObject(msg)
  const actionObj = getActionCommand(msg)
  const isSpecificHelpCommand =
    specificHelpCommand(msg) || (!actionObj && !commandObj?.canRunWithoutAction)

  const hasActions =
    commandObj?.actions && Object.keys(commandObj.actions).length !== 0

  // display only when this is help msg of top-level command
  if (hasActions && isSpecificHelpCommand && !actionObj) {
    description += `\n\n${getListCommands(
      getEmoji("reply" ?? "╰ "),
      commandObj.actions
    )}`
  }
  const alias = (actionObj ?? commandObj)?.aliases

  title =
    (isSpecificHelpCommand ? (actionObj ?? commandObj)?.brief : title) ?? ""

  let authorTag = msg?.author?.tag
  let authorAvatarURL = msg?.author?.avatarURL()
  if (originalMsgAuthor) {
    authorTag = originalMsgAuthor.tag
    authorAvatarURL = originalMsgAuthor.avatarURL()
  }

  const embed = new MessageEmbed()
    .setTitle(title)
    .setColor((color ?? msgColors.PRIMARY) as ColorResolvable)
    .setFooter(
      getEmbedFooter(authorTag ? [...footer, authorTag] : ["Mochi bot"]),
      authorAvatarURL
    )
    .setTimestamp(timestamp ?? new Date())

  if (description) embed.setDescription(`${description}`)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (!!author && author.length === 1) embed.setAuthor(author[0])
  if (!!author && author.length === 2) embed.setAuthor(author[0], author[1])

  // fields
  if (isSpecificHelpCommand && alias)
    embed.addField(
      "\u200B",
      `**Alias**: ${alias.map(a => `\`${a}\``).join(COMMA)}`
    )
  if (usage) embed.addField("**Usage**", `\`\`\`${usage}\`\`\``)
  if (examples) embed.addField("**Examples**", `\`\`\`${examples}\`\`\``)

  return embed
}

export function getErrorEmbed(params: {
  title?: string
  description?: string
  thumbnail?: string
  msg: Message
  image?: string
}) {
  const { title, description, thumbnail, msg, image } = params
  return composeEmbedMessage(msg, {
    title: title ?? `${defaultEmojis.ERROR} Command error`,
    description:
      description ??
      "Something went wrong! Please try again or contact administrators",
    image,
    thumbnail,
    color: msgColors.ERROR
  })
}

export function getInvalidInputEmbed(msg: Message) {
  return composeEmbedMessage(msg, {
    color: msgColors.ERROR,
    author: [
      "Invalid input!",
      "https://cdn.discordapp.com/emojis/933341948431962172.webp?size=240&quality=lossless"
    ],
    description:
      "That is an invalid argument. Please see help message of the command"
  })
}
