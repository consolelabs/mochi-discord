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
import { EMPTY, PROFILE_THUMBNAIL, SPACE, VERTICAL_BAR } from "./constants"
import {
  emojis,
  getCommandArguments,
  getEmbedFooter,
  getEmoji,
  msgColors,
  thumbnails,
} from "./common"
import { factsAndTipsManager } from "commands"
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

export function composeEmbedMessage(msg: Message, props: EmbedProperties) {
  const {
    title,
    description,
    thumbnail,
    color,
    footer,
    timestamp = null,
    image,
    author,
  } = props
  const args = getCommandArguments(msg)
  const isHelpCommand = args.length > 1 && args[0].includes("help")
  const embed = new MessageEmbed()
    .setTitle(
      isHelpCommand
        ? msg.content
            .replace("help", EMPTY)
            .replace(SPACE, EMPTY)
            .split(SPACE)[0]
        : title ?? "Info"
    )
    .setColor((color ?? msgColors.PRIMARY) as ColorResolvable)
    .setFooter(
      getEmbedFooter(footer ? [...footer, msg.author.tag] : [msg.author.tag]),
      msg.author.avatarURL()
    )
    .setThumbnail(thumbnail ?? PROFILE_THUMBNAIL)
    .setTimestamp(timestamp ?? new Date())

  if (description) embed.setDescription(description)
  if (image) embed.setImage(image)
  if (!!author && author.length === 1) embed.setAuthor(author[0])
  if (!!author && author.length === 2) embed.setAuthor(author[0], author[1])

  return embed
}

export async function getLoadingEmbed(msg: Message) {
  const { message, type, no, total } = factsAndTipsManager.random()
  return composeEmbedMessage(msg, {
    title: `${type === "fact" ? "Fact" : "Tip"} ${no}/${total}`,
    description: message,
    thumbnail: thumbnails.LOADING,
  })
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
      "That is an invalid response. Please try again. Type 'exit' to leave the menu.",
  })
}
