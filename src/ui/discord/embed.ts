import profile from "adapters/profile"
import { commands, slashCommands } from "commands"
import {
  ColorResolvable,
  CommandInteraction,
  Message,
  MessageEmbed,
  MessageOptions,
  MessageSelectOptionData,
  User,
} from "discord.js"
import { APIError } from "errors"
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
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  // removeDuplications,
  roundFloatNumber,
  TokenEmojiKey,
} from "utils/common"
import { COMMA, DEFAULT_COLLECTION_GITBOOK, DOT, PREFIX } from "utils/constants"

export const EMPTY_FIELD = {
  name: "\u200B",
  value: "\u200B",
  inline: true,
}

export function getMultipleResultEmbed({
  ambiguousResultText,
  multipleResultText,
}: {
  ambiguousResultText: string
  multipleResultText: string
}) {
  return composeEmbedMessage(null, {
    title: `${getEmoji("MAG")} Multiple results found`,
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
      "TOUCH"
    )}`,
  })
  return { embeds: [embed] }
}

export function enableDMMessage(prefixDesc = "", suffixDesc = "") {
  return composeEmbedMessage(null, {
    author: ["Chotto matte", getEmojiURL(emojis.ANIMATED_QUESTION_MARK)],
    description:
      prefixDesc +
      "Mochi couldn't DM you, please enable so Mochi can send you DMs in the future" +
      suffixDesc,
    image:
      "https://cdn.discordapp.com/attachments/1019524376527372288/1094879142358548500/E2y-ikbXIAkNmGc.png",
    color: msgColors.ACTIVITY,
  })
}

export function getSuggestionEmbed(params: {
  title?: string
  description: string
  msg: Message
}) {
  const { title, description, msg } = params
  const embed = composeEmbedMessage(msg, {
    author: [title ?? "Hmm?", getEmojiURL(emojis.ANIMATED_QUESTION_MARK)],
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
    author: [title ?? "Successful", getEmojiURL(emojiId ?? emojis["CHECK"])],
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
  color?: ColorResolvable
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
      `Our team is fixing the issue. Stay tuned ${getEmoji("NEKOSAD")}.`,
    image,
    thumbnail,
    color: params.color ?? msgColors.ERROR,
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
      description: `Mochi doesn't understand what command you are trying to use.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT"
      )} Perhaps you can reference \`${PREFIX}help\` for more info`,
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
      author: ["This command doesn't exist", getEmojiURL(getEmoji("HUH"))],
      description: `Are you trying to say \`${PREFIX}${result}\`?\n\n**Example**\nFor more specific action: \`${PREFIX}help ${result}\`\nOr try this: \`${PREFIX}${result} ${actionNoArg}\`\n`,
      document: DEFAULT_COLLECTION_GITBOOK,
    }
  }
}

export function composePartnerEmbedPimp() {
  return composeEmbedMessage(null, {
    title: `<:ad:1080392654229090304> MCLB`,
    color: msgColors.SUCCESS,
    description: `[$fBOMB](https://discord.gg/mclb), an omnichain high yield deflationary token. The bombs will always drop and the APRs are always explosive!`,
    thumbnail:
      "https://cdn.discordapp.com/attachments/994457507135234118/1080335263143829564/MCLB-token.png",
  })
}

export function composeInsufficientBalanceEmbed({
  current,
  required,
  symbol,
  author,
}: {
  current?: number
  required?: number
  symbol: TokenEmojiKey
  author?: User
}) {
  const tokenEmoji = getEmojiToken(symbol)
  return composeEmbedMessage(null, {
    author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
    description: `${author}, your balance is insufficient.\nYou can deposit more by using \`$deposit ${symbol}\``,
  }).addFields([
    ...(current !== undefined
      ? [
          {
            name: "Your balance",
            value: `${tokenEmoji} ${roundFloatNumber(current, 4)} ${symbol}`,
            inline: true,
          },
        ]
      : []),
    ...(required !== undefined
      ? [
          {
            name: "Required amount",
            value: `${tokenEmoji} ${roundFloatNumber(required, 4)} ${symbol}`,
            inline: true,
          },
        ]
      : []),
  ])
}

export async function composeMyWalletSelection(
  userId: string
): Promise<MessageSelectOptionData[]> {
  const pfRes = await profile.getByDiscord(userId)
  if (pfRes.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: "",
    })
  }
  // TODO: uncomment after we've implemented wallet connect in mochi profile
  // const wallets = removeDuplications(
  //   pfRes.associated_accounts
  //     ?.filter((a: any) => ["evm-chain", "solana-chain"].includes(a.platform))
  //     ?.map((w: any) => w.platform_identifier) ?? []
  // )
  return [
    { label: "Mochi wallet", value: `mochi_${userId}` },
    // ...wallets.map((w: any) => ({ label: w, value: w })),
  ]
}
