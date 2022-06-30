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
import { COMMA, VERTICAL_BAR } from "./constants"
import {
  defaultEmojis,
  getEmbedFooter,
  getEmoji,
  getCommandsList,
  msgColors,
} from "./common"
import {
  getCommandObject,
  getActionCommand,
  specificHelpCommand,
} from "./commands"
import { Command, EmbedProperties, embedsColors } from "types/common"
import {
  MessageButtonStyles,
  MessageComponentTypes,
} from "discord.js/typings/enums"

export const EMPTY_FIELD = {
  name: "\u200B",
  value: "\u200B",
  inline: true,
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

export function composeDiscordSelectionRow(
  options: MessageSelectMenuOptions = {}
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu(options)
  )

  return row
}

export function getExitButton(authorId: string, label?: string) {
  return new MessageButton({
    customId: `exit-${authorId}`,
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: label ?? "Exit",
  })
}

export function composeDiscordExitButton(authorId: string): MessageActionRow {
  const row = new MessageActionRow().addComponents(getExitButton(authorId))

  return row
}

export function composeButtonLink(
  label: string,
  url: string
): MessageActionRow {
  const row = new MessageActionRow().addComponents(
    new MessageButton({
      style: MessageButtonStyles.LINK,
      label,
      url,
    })
  )

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
  let { title, description = "" } = props
  const {
    color,
    thumbnail,
    footer = [],
    timestamp = null,
    image,
    author,
    originalMsgAuthor,
    usage,
    examples,
    withoutFooter,
  } = props
  const commandObj = getCommandObject(msg)
  const actionObj = getActionCommand(msg)
  const isSpecificHelpCommand = specificHelpCommand(msg)

  const hasActions =
    commandObj?.actions && Object.keys(commandObj.actions).length !== 0

  // display only when this is help msg of top-level command
  if (hasActions && isSpecificHelpCommand && !actionObj) {
    description += `\n\n${getCommandsList(
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
    .setColor((color ?? getCommandColor(commandObj)) as ColorResolvable)

  if (!withoutFooter) {
    embed
      .setFooter(
        getEmbedFooter(authorTag ? [...footer, authorTag] : ["Mochi bot"]),
        authorAvatarURL
      )
      .setTimestamp(timestamp ?? new Date())
  }
  if (description) {
    embed.setDescription(description)
  }

  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (author?.length === 1) embed.setAuthor(author[0])
  if (author?.length === 2) embed.setAuthor(author[0], author[1])

  // fields
  if (isSpecificHelpCommand && alias)
    embed.addField(
      "\u200B",
      `**Alias**: ${alias.map((a) => `\`${a}\``).join(COMMA)}.`
    )
  if (usage) embed.addField("**Usage**", `\`\`\`${usage}\`\`\``)
  if (examples) embed.addField("**Examples**", `\`\`\`${examples}\`\`\``)

  return embed
}

function getCommandColor(commandObj: Command) {
  if (!commandObj?.colorType) return msgColors.PRIMARY
  return embedsColors[commandObj.colorType]
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

export function justifyEmbedFields(embed: MessageEmbed, cols: number) {
  if (embed.fields.length % cols === 0) {
    return embed
  }
  embed.addFields(Array(cols - (embed.fields.length % cols)).fill(EMPTY_FIELD))
  return embed
}

export async function renderPaginator(msg: Message, pages: MessageEmbed[]) {
  if (!pages.length) return
  let page = 0
  const forwardBtn = new MessageButton()
    .setCustomId("FORWARD_BTN")
    .setLabel("Next")
    .setStyle("SECONDARY")
  const backwardBtn = new MessageButton()
    .setCustomId("BACKWARD_BTN")
    .setLabel("Back")
    .setStyle("SECONDARY")
  const row = new MessageActionRow().addComponents([backwardBtn, forwardBtn])

  const message = await msg.channel.send({
    embeds: [pages[page]],
    components: [row],
  })

  const collector = message.createMessageComponentCollector({
    componentType: "BUTTON",
    time: 20000,
  })

  collector.on("collect", async (i) => {
    await i.deferUpdate()
    if (i.user.id !== msg.author.id) return
    if (i.customId === "FORWARD_BTN") {
      page = page > 0 ? page - 1 : pages.length - 1
      await message.edit({ embeds: [pages[page]], components: [row] })
    }
    if (i.customId === "BACKWARD_BTN") {
      page = page < pages.length - 1 ? page + 1 : 0
      await message.edit({ embeds: [pages[page]], components: [row] })
    }
  })
}

export function getPaginationRow(page: number, totalPage: number) {
  if (totalPage === 1) return []
  const actionRow = new MessageActionRow()
  if (page !== 0) {
    actionRow.addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: MessageButtonStyles.PRIMARY,
        label: "Back",
        customId: `page_${page}_-_${totalPage}`,
      })
    )
  }

  if (page !== totalPage - 1) {
    actionRow.addComponents({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.PRIMARY,
      label: "Next",
      customId: `page_${page}_+_${totalPage}`,
    })
  }
  return [actionRow]
}

export function listenForPaginateAction(
  replyMsg: Message,
  originalMsg: Message,
  render: (
    msg: Message,
    pageIdx: number
  ) => Promise<{ messageOptions: MessageOptions }>
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const {
        messageOptions: { embeds },
      } = await render(originalMsg, page)
      await replyMsg.edit({
        embeds,
        components: getPaginationRow(page, +totalPage),
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] })
    })
}
