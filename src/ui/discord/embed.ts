import { commands, slashCommands } from "commands"
import {
  ColorResolvable,
  CommandInteraction,
  Message,
  MessageEmbed,
  MessageOptions,
  User,
} from "discord.js"
import { Command, EmbedProperties } from "types/common"
import {
  getActionCommand,
  getCommandColor,
  getCommandObject,
  getCommandsList,
  getSlashCommandColor,
  getSlashCommandObject,
  specificHelpCommand,
} from "utils/commands"
import {
  defaultEmojis,
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
} from "utils/common"
import { COMMA, DEFAULT_COLLECTION_GITBOOK, DOT, PREFIX } from "utils/constants"

export const EMPTY_FIELD = {
  name: "\u200B",
  value: "\u200B",
  inline: true,
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
    description: `Relevant results found for \`${ambiguousResultText}\`${
      multipleResultText ? `: ${multipleResultText}` : ""
    }.\nPlease select one of the following`,
  })
}

// TODO: remove after slash command migration done
export function composeEmbedMessage(
  msg: Message | null | undefined,
  props: EmbedProperties
) {
  let { title, description = "", footer = [] } = props
  const {
    color,
    thumbnail,
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
      actions ?? commandObj?.actions ?? {}
    )}`
  }

  if (isSpecificHelpCommand) {
    title = (actionObj ?? commandObj)?.brief
  } else if (!footer.length) {
    footer = ["Type /feedback to report"]
  }
  title = title ?? ""

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
      .setFooter({
        text: getEmbedFooter(
          authorTag ? [...footer, authorTag] : [...footer, "Mochi bot"]
        ),
        iconURL: authorAvatarURL || undefined,
      })
      .setTimestamp(timestamp ?? new Date())
  }
  if (description) embed.setDescription(description)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (author.length === 1) embed.setAuthor({ name: author[0] })
  if (author.length === 2) {
    embed.setAuthor({ name: author[0], iconURL: author[1] })
  }

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

export function composeEmbedMessage2(
  interaction: CommandInteraction,
  props: EmbedProperties
) {
  const {
    title,
    description,
    color,
    thumbnail,
    footer = ["Type /feedback to report"],
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
      .setFooter({
        text: getEmbedFooter(
          authorTag ? [...footer, authorTag] : footer ?? ["Mochi bot"]
        ),
        iconURL: authorAvatarURL || undefined,
      })
      .setTimestamp(timestamp ?? new Date())
  }
  if (description) embed.setDescription(description)
  if (thumbnail) embed.setThumbnail(thumbnail)
  if (image) embed.setImage(image)
  if (author.length === 1) embed.setAuthor({ name: author[0] })
  if (author.length === 2) {
    embed.setAuthor({ name: author[0], iconURL: author[1] })
  }

  // embed fields
  if (usage) embed.addField("**Usage**", `\`\`\`${usage}\`\`\``)
  if (examples) embed.addField("**Examples**", `\`\`\`${examples}\`\`\``)
  return embed
}

export async function workInProgress(): Promise<MessageOptions> {
  const embed = composeEmbedMessage(null, {
    color: "#F4BE5B",
    thumbnail:
      "https://cdn.discordapp.com/emojis/916737804002799699.png?size=240",
    title: `${emojis.RED_FLAG} Work In Progress`,
    description: `The command is in maintenance. Stay tuned! ${getEmoji(
      "touch"
    )}`,
  })
  return { embeds: [embed] }
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

export function getEmbedFooter(texts: string[]): string {
  return texts.join(` ${DOT} `)
}

// TODO: remove after slash command migration done
export function getSuccessEmbed(params: {
  title?: string
  description?: string
  thumbnail?: string
  msg?: Message
  image?: string
  originalMsgAuthor?: User
  emojiId?: string
}) {
  const {
    title,
    description,
    thumbnail,
    msg,
    image,
    originalMsgAuthor,
    emojiId,
  } = params
  return composeEmbedMessage(msg, {
    author: [title ?? "Successful", getEmojiURL(emojiId ?? emojis["APPROVE"])],
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
  emojiUrl?: string
}) {
  const {
    title,
    description,
    thumbnail,
    msg,
    image,
    originalMsgAuthor,
    emojiUrl,
  } = params
  return composeEmbedMessage(msg, {
    author: [
      title ?? "Command error",
      emojiUrl ?? getEmojiURL(emojis["REVOKE"]),
    ],
    description:
      description ??
      `Our team is fixing the issue. Stay tuned ${getEmoji("nekosad")}.`,
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

/**
 * Find the closest match to the command key
 * If not found then reply with help message
 */
export function getCommandSuggestion(
  fuzzySet: FuzzySet,
  userInput: string,
  commands: Record<string, Command>
): EmbedProperties | null {
  const results = fuzzySet.get(userInput, null, 0.5)

  if (!results || results.length == 0) {
    return {
      title: "Mochi is confused",
      description: `Mochi doesn't understand what command you are trying to use.\n:point_right: Perhaps you can reference \`${PREFIX}help\` for more info`,
    }
  } else {
    const result = results[0][1]
    const cmd = commands[result]
    const act = cmd.actions
    if (!act) return null
    const actions = Object.keys(act)
    let actionNoArg = "help"
    for (const i in actions) {
      if (act[actions[i]].minArguments == 2) {
        actionNoArg = actions[i]
        break
      }
    }
    return {
      author: ["This command doesn't exist", getEmojiURL(getEmoji("huh"))],
      description: `Are you trying to say \`${PREFIX}${result}\`?\n\n**Example**\nFor more specific action: \`${PREFIX}help ${result}\`\nOr try this: \`${PREFIX}${result} ${actionNoArg}\`\n`,
      document: DEFAULT_COLLECTION_GITBOOK,
    }
  }
}

export function composePartnerEmbedPimp() {
  return composeEmbedMessage(null, {
    title: `${getEmoji("defi")} Faygo Bottle`,
    description: `Earn a [Juggalos](https://paintswap.finance/marketplace/fantom/collections/pod-town-juggalos) yourself to gain full citizenship of Pod Town Metaverse! Be a productive citizen now, have a faygo!`,
    thumbnail:
      "https://s3.us-west-2.amazonaws.com/secure.notion-static.com/029efa8c-67d7-4ccd-a968-b8af9db933ad/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230214%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230214T033900Z&X-Amz-Expires=86400&X-Amz-Signature=436d62c30a894775985dc39baf6fcf08747b288d02c1a4e6515dd4c4d369866f&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject",
  })
}
