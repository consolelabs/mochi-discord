import {
  ButtonInteraction,
  ColorResolvable,
  CommandInteraction,
  User,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectMenuOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { COMMA, HOMEPAGE_URL, VERTICAL_BAR } from "./constants"
import {
  getEmbedFooter,
  getEmoji,
  getCommandsList,
  msgColors,
  getDateStr,
  getEmojiURL,
  emojis,
  defaultEmojis,
  hasAdministrator,
  authorFilter,
} from "./common"
import {
  getCommandObject,
  getActionCommand,
  specificHelpCommand,
  getSlashCommandObject,
} from "./commands"
import {
  Command,
  EmbedProperties,
  embedsColors,
  SetDefaultButtonHandler,
  SetDefaultRenderList,
  SlashCommand,
} from "types/common"
import {
  MessageButtonStyles,
  MessageComponentTypes,
} from "discord.js/typings/enums"
import dayjs from "dayjs"
import { wrapError } from "./wrapError"
import { commands, slashCommands } from "commands"
import { InteractionHandler } from "./InteractionManager"

export const EMPTY_FIELD = {
  name: "\u200B",
  value: "\u200B",
  inline: true,
}

type SetDefaultMiddlewareParams<T> = {
  render: SetDefaultRenderList<T>
  label: string
  onDefaultSet?: SetDefaultButtonHandler
  // for slash command case
  commandInteraction?: CommandInteraction
}

export function setDefaultMiddleware<T>(params: SetDefaultMiddlewareParams<T>) {
  return <InteractionHandler>(async (i: SelectMenuInteraction) => {
    const selectedValue = i.values[0]
    const interactionMsg = i.message as Message
    const member = await interactionMsg.guild?.members.fetch(i.user.id)
    const isAdmin = hasAdministrator(member)
    let originalMsg = null
    let replyMessage
    if (interactionMsg.reference) {
      originalMsg = await interactionMsg.fetchReference()
    } else if (params.commandInteraction) {
      originalMsg = params.commandInteraction
    }

    if (!originalMsg) return
    const render = await params.render({
      // TODO(tuan): i don't know how to solve this (yet)
      msgOrInteraction: originalMsg as any,
      value: selectedValue,
    })
    if (isAdmin) {
      if (!params.onDefaultSet) {
        await i.deferUpdate()
        return { ...render }
      }
      await i.deferReply({ ephemeral: true }).catch(() => null)

      const actionRow = new MessageActionRow().addComponents(
        new MessageButton({
          customId: selectedValue,
          emoji: getEmoji("approve"),
          style: "PRIMARY",
          label: "Confirm",
        })
      )

      const embedProps = {
        title: "Set default",
        description: `Do you want to set **${params.label}** as the default value for this command?\nNo further selection next time use command`,
      }

      replyMessage = {
        embeds: [
          originalMsg instanceof Message
            ? composeEmbedMessage(originalMsg, embedProps)
            : composeEmbedMessage2(originalMsg, embedProps),
        ],
        components: [actionRow],
      }
    }

    return {
      ...render,
      replyMessage,
      buttonCollector: params.onDefaultSet,
    }
  })
}

export function getMultipleResultEmbed({
  msg,
  ambiguousResultText,
  multipleResultText,
}: {
  msg: Message | null
  ambiguousResultText: string
  multipleResultText: string
}) {
  return composeEmbedMessage(msg, {
    title: `${defaultEmojis.MAG} Multiple results found`,
    description: `Multiple results found for \`${ambiguousResultText}\`${
      multipleResultText ? `: ${multipleResultText}` : ""
    }.\nPlease select one of the following`,
  })
}

/**
 * Returns a formatted string of options (maximum 8)
 *
 * @param {string[]} options Array of option strings
 *
 * @return {string} Formatted string
 * */
export function composeSimpleSelection(
  options: string[],
  customRender?: (o: string, i: number) => string
): string {
  return `${options
    .slice(0, 8)
    .map((o, i) =>
      customRender
        ? customRender(o, i)
        : `${getEmoji(`num_${i + 1}`)} ${VERTICAL_BAR} ${o}`
    )
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

export function composeNameDescriptionList(
  list: Array<{ name: string; description: string }>
) {
  const emoji = getEmoji("reply")
  return list
    .map((c) => `[**${c.name}**](${HOMEPAGE_URL})\n${emoji}${c.description}`)
    .join("\n\n")
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
    .setTitle(`${emojis.RED_FLAG} Work In Progress`)
    .setDescription(
      `The command is in maintenance. Stay tuned! ${getEmoji("touch")}`
    )

  return { embeds: [embed] }
}

// TODO: remove after slash command migration done
export function composeEmbedMessage(
  msg: Message | null | undefined,
  props: EmbedProperties
) {
  let { title, description = "" } = props
  const {
    color,
    thumbnail,
    footer = [],
    timestamp = null,
    image,
    author: _author = [],
    originalMsgAuthor,
    usage,
    examples,
    withoutFooter,
    includeCommandsList,
    actions,
    document,
  } = props
  const author = _author.map((a) => a ?? "").filter(Boolean)
  const commandObj = getCommandObject(commands, msg)
  const actionObj = getActionCommand(commands, msg)
  const isSpecificHelpCommand = specificHelpCommand(msg)

  if (includeCommandsList) {
    description += `\n\n${getCommandsList(
      getEmoji("reply" ?? "╰ "),
      actions ?? commandObj?.actions ?? {}
    )}`
  }

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

  // embed options
  if (!withoutFooter) {
    embed
      .setFooter(
        getEmbedFooter(
          authorTag ? [...footer, authorTag] : [...footer, "Mochi bot"]
        ),
        authorAvatarURL || undefined
      )
      .setTimestamp(timestamp ?? new Date())
  }
  if (description) embed.setDescription(description)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (author.length === 1) embed.setAuthor(author[0])
  if (author.length === 2) embed.setAuthor(author[0], author[1])

  // embed fields
  const aliases = (actionObj ?? commandObj)?.aliases
  if (isSpecificHelpCommand && aliases)
    embed.addFields({
      name: "\u200B",
      value: `**Alias**: ${aliases.map((a) => `\`${a}\``).join(COMMA)}.`,
    })
  if (usage) {
    embed.addFields({ name: "**Usage**", value: `\`\`\`${usage}\`\`\`` })
  }
  if (examples) {
    embed.addFields({ name: "**Examples**", value: `\`\`\`${examples}\`\`\`` })
  }
  if (document) {
    embed.addFields({
      name: "**Instructions**",
      value: `[**Gitbook**](${document})`,
    })
  }
  return embed
}

// TODO: remove after slash command migration done
function getCommandColor(commandObj: Command | null) {
  return embedsColors[commandObj?.colorType ?? "Command"]
}

export function getSuggestionEmbed(params: {
  title?: string
  description: string
  msg: Message
}) {
  const { title, description, msg } = params
  const embed = composeEmbedMessage(msg, {
    author: [title ?? "Hmm?", getEmojiURL(emojis["QUESTION"])],
    description,
    color: "#ffffff",
  })

  return embed
}

export function getSuggestionComponents(
  suggestions: Array<MessageSelectOptionData>
) {
  if (suggestions.length === 0) return
  const hasOneSuggestion = suggestions.length === 1
  const row = new MessageActionRow()
  if (hasOneSuggestion) {
    const button = new MessageButton()
      .setLabel("Yes")
      .setStyle("PRIMARY")
      .setCustomId(`suggestion-button-${suggestions[0].value}`)
    row.addComponents(button)
  } else {
    const select = new MessageSelectMenu()
      .setPlaceholder("Other options")
      .addOptions(suggestions)
      .setCustomId("suggestion-select")
    row.addComponents(select)
  }

  return row
}

// TODO: remove after slash command migration done
export function getSuccessEmbed(params: {
  title?: string
  description?: string
  thumbnail?: string
  msg?: Message
  image?: string
  originalMsgAuthor?: User
}) {
  const { title, description, thumbnail, msg, image, originalMsgAuthor } =
    params
  return composeEmbedMessage(msg, {
    author: [title ?? "Successful", getEmojiURL(emojis["APPROVE"])],
    description: description ?? "The operation finished successfully",
    image,
    thumbnail,
    color: msgColors.SUCCESS,
    originalMsgAuthor,
  })
}

// TODO: remove after slash command migration done
export function getErrorEmbed(params: {
  title?: string
  description?: string
  thumbnail?: string
  msg?: Message
  image?: string
  originalMsgAuthor?: User
}) {
  const { title, description, thumbnail, msg, image, originalMsgAuthor } =
    params
  return composeEmbedMessage(msg, {
    author: [title ?? "Command error", getEmojiURL(emojis["REVOKE"])],
    description:
      description ??
      "There was an error. Our team has been informed and is trying to fix the issue. Stay tuned.",
    image,
    thumbnail,
    color: msgColors.ERROR,
    originalMsgAuthor,
  })
}

export function getInvalidInputEmbed(msg: Message) {
  return getErrorEmbed({
    msg,
    title: "Invalid input",
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
    .setLabel("Previous")
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
      await message
        .edit({ embeds: [pages[page]], components: [row] })
        .catch(() => null)
    }
    if (i.customId === "BACKWARD_BTN") {
      page = page < pages.length - 1 ? page + 1 : 0
      await message
        .edit({ embeds: [pages[page]], components: [row] })
        .catch(() => null)
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
        label: "Previous",
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

export function listenForSuggestionAction(
  replyMsg: Message,
  authorId: string,
  onAction: (
    value: string,
    i: ButtonInteraction | SelectMenuInteraction
  ) => Promise<void>
) {
  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      if (i.user.id !== authorId) return
      const value = i.customId.split("-").pop()
      wrapError(i, async () => {
        await onAction(value ?? "", i)
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })

  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.SELECT_MENU,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      if (i.user.id !== authorId) return
      const value = i.values[0]
      wrapError(i, async () => {
        await onAction(value, i)
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}

export function listenForPaginateAction(
  replyMsg: Message,
  originalMsg: Message,
  render: (
    msg: Message,
    pageIdx: number
  ) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean
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
        messageOptions: { embeds, components, files },
      } = await render(originalMsg, page)

      const msgComponents = withMultipleComponents
        ? components
        : getPaginationRow(page, +totalPage)
      if (withAttachmentUpdate && files?.length) {
        await replyMsg.removeAttachments()
        await replyMsg
          .edit({
            embeds,
            components: msgComponents,
            files,
          })
          .catch(() => null)
      } else {
        await replyMsg
          .edit({
            embeds,
            components: msgComponents,
          })
          .catch(() => null)
      }
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}

export function listenForPaginateInteraction(
  interaction: CommandInteraction,
  render: (
    interaction: CommandInteraction,
    pageIdx: number
  ) => Promise<{ messageOptions: MessageOptions }>,
  withAttachmentUpdate?: boolean,
  withMultipleComponents?: boolean
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }

  interaction.channel
    ?.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(interaction.user.id),
    })
    .on("collect", async (i) => {
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const {
        messageOptions: { embeds, components, files },
      } = await render(interaction, page)

      const msgComponents = withMultipleComponents
        ? components
        : getPaginationRow(page, +totalPage)
      if (withAttachmentUpdate && files?.length) {
        await interaction
          .editReply({
            embeds,
            components: msgComponents,
            files,
          })
          .catch(() => null)
      } else {
        await interaction
          .editReply({
            embeds,
            components: msgComponents,
          })
          .catch(() => null)
      }
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })
}

export function composeDaysSelectMenu(
  customId: string,
  optValuePrefix: string,
  days: number[],
  defaultVal?: number
) {
  const getDropdownOptionDescription = (days: number) =>
    `${getDateStr(dayjs().subtract(days, "day").unix() * 1000)} - ${getDateStr(
      dayjs().unix() * 1000
    )}`
  const opt = (days: number): MessageSelectOptionData => ({
    label: `${days === 365 ? "1 year" : `${days} day${days > 1 ? "s" : ""}`}`,
    value: `${optValuePrefix}_${days}`,
    emoji: days > 1 ? "📆" : "🕒",
    description: getDropdownOptionDescription(days),
    default: days === (defaultVal ?? 7),
  })
  const selectRow = composeDiscordSelectionRow({
    customId,
    placeholder: "Make a selection",
    options: days.map((d) => opt(d)),
  })
  return selectRow
}

export function composeEmbedMessage2(
  interaction: CommandInteraction,
  props: EmbedProperties
) {
  const {
    title,
    description,
    color,
    thumbnail,
    footer = [],
    timestamp = null,
    image,
    author: _author = [],
    originalMsgAuthor,
    usage,
    examples,
    withoutFooter,
    // includeCommandsList,
    // actions,
  } = props
  const author = _author.map((a) => a ?? "").filter(Boolean)
  const commandObj = getSlashCommandObject(slashCommands, interaction)

  // if (includeCommandsList) {
  //   description += `\n\n${getCommandsList(
  //     getEmoji("reply" ?? "╰ "),
  //     actions ?? commandObj?.actions ?? {}
  //   )}`
  // }

  // title =
  //   (isSpecificHelpCommand ? (actionObj ?? commandObj)?.brief : title) ?? ""

  let authorTag = interaction.user.tag
  let authorAvatarURL = interaction.user.avatarURL()
  if (originalMsgAuthor) {
    authorTag = originalMsgAuthor.tag
    authorAvatarURL = originalMsgAuthor.avatarURL()
  }

  const embed = new MessageEmbed()
    .setTitle(title ?? "")
    .setColor((color ?? getSlashCommandColor(commandObj)) as ColorResolvable)

  // embed options
  if (!withoutFooter) {
    embed
      .setFooter(
        getEmbedFooter(
          authorTag ? [...footer, authorTag] : footer ?? ["Mochi bot"]
        ),
        authorAvatarURL || undefined
      )
      .setTimestamp(timestamp ?? new Date())
  }
  if (description) embed.setDescription(description)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (author.length === 1) embed.setAuthor(author[0])
  if (author.length === 2) embed.setAuthor(author[0], author[1])

  // embed fields
  if (usage) embed.addField("**Usage**", `\`\`\`${usage}\`\`\``)
  if (examples) embed.addField("**Examples**", `\`\`\`${examples}\`\`\``)
  return embed
}

function getSlashCommandColor(commandObj: SlashCommand | null) {
  return embedsColors[commandObj?.colorType ?? "Command"]
}

export function starboardEmbed(msg: Message) {
  const attachments = msg.attachments.map((a) => ({
    url: a.url,
    type: a.contentType?.split("/")[0] ?? "",
  }))
  const attachmentSize = attachments.length
  let embed: MessageEmbed
  if (attachmentSize) {
    const imageURL = attachments.find((a) => a.type === "image")?.url
    const messageContent = msg.content
      ? msg.content
      : "Message contains some attachments"
    embed = composeEmbedMessage(null, {
      author: [msg.author.username, msg.author.avatarURL() ?? ""],
      description: messageContent,
      originalMsgAuthor: msg.author,
      image: imageURL,
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  } else {
    const messageContent = msg.content ? msg.content : "Message has no content."
    embed = composeEmbedMessage(null, {
      author: [msg.author.username, msg.author.avatarURL() ?? ""],
      description: messageContent,
      originalMsgAuthor: msg.author,
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  }
  return embed
}
