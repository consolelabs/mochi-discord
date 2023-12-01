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
import { TEST } from "env"
import { APIError } from "errors"
import { Command, EmbedProperties, SlashCommand } from "types/common"
import {
  getActionCommand,
  getCommandColor,
  getCommandObject,
  getCommandsList,
  getSlashCommand,
  getSlashCommandColor,
  getSlashCommandObject,
  specificHelpCommand,
} from "utils/commands"
import {
  TokenEmojiKey,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import {
  COMMA,
  DEFAULT_COLLECTION_GITBOOK,
  DOT,
  PREFIX,
  VERTICAL_BAR,
} from "utils/constants"
import { zip, merge } from "lodash"
import { getRandomTip } from "cache/tip-fact-cache"
import { profilingAsyncStore } from "utils/async-storages"

export function errorEmbed(
  title: string,
  description: string[],
  reason: string,
  extra: { emoji: string; label: string; text: string }[] = [],
) {
  const extras = [
    { emoji: getEmoji("CONFIG"), label: "Reason.", text: reason },
    ...extra,
  ]
  return composeEmbedMessage(null, {
    color: msgColors.GRAY,
    author: [title, getEmojiURL(emojis.REVOKE)],
    description: `${description
      .map((desc) => `${getEmoji("ANIMATED_POINTING_RIGHT", true)}${desc}`)
      .join("\n")}`,
  }).addFields({
    name: "Detail",
    value: formatDataTable(
      extras.map((e) => ({ text: e.label })),
      {
        cols: ["text"],
        rowAfterFormatter: (f, i) => `${extras[i].emoji}${f}${extras[i].text}`,
      },
    ).joined,
    inline: true,
  })
}

// const MAXIMUM_CHAR_COUNT_PER_LINE = 32

type Alignment = "left" | "center" | "right"
type Option<C> = {
  rowAfterFormatter?: (formatted: string, index: number) => string
  cols: C[]
  alignment?: Alignment[]
  separator?: string[]
  noWrap?: boolean
  dividerEvery?: number
}
type Data = Record<string, string | number>

export function formatDataTable<DT extends Data>(
  data: Array<DT>,
  options: Option<keyof DT>,
) {
  if (!data.length || !options.cols.length) return { segments: [], joined: "" }
  const segments = []
  const initialCols = Object.keys(data[0])
  const resolvedOptions = merge<
    Required<Option<keyof DT>>,
    Partial<Option<keyof DT>>
  >(
    {
      cols: [],
      alignment: [...Array(initialCols.length - 1).fill("left"), "right"],
      rowAfterFormatter: (str: string) => str,
      separator: Array(initialCols.length - 1).fill(VERTICAL_BAR),
      noWrap: false,
      dividerEvery: 0,
    },
    options,
  )
  const longestTextByColumns = new Map<keyof DT, number>()

  // find the longest text by columns to add proper padding to other cell in the same column
  for (const d of data) {
    Object.entries(d).forEach((e) => {
      if (!longestTextByColumns.has(e[0])) {
        longestTextByColumns.set(e[0], 0)
      }

      longestTextByColumns.set(
        e[0],
        Math.max(longestTextByColumns.get(e[0]) ?? 0, String(e[1]).length),
      )
    })
  }

  let lines: string[] = []
  for (const [i, d] of data.entries()) {
    let row = []

    for (const [colIdx, col] of resolvedOptions.cols.entries()) {
      let content = String(d[col] ?? "")

      const padding = " ".repeat(
        Math.max(
          (longestTextByColumns.get(col) ?? 0) - String(content).length,
          0,
        ),
      )
      const halfPadding = padding.slice(0, padding.length / 2)

      switch (resolvedOptions.alignment[colIdx]) {
        case "center":
          content = `${halfPadding}${content}${halfPadding}`
          break
        case "right":
          content = `${padding}${content}`
          break
        case "left":
        default:
          content = `${content}${padding}`
          break
      }

      row.push(content)
    }

    row = row.filter(Boolean)
    row = zip(row, resolvedOptions.separator.slice(0, row.length - 1)).flat()
    row = row.filter(Boolean)

    const line = resolvedOptions.rowAfterFormatter(
      `${resolvedOptions.noWrap ? "" : "`"}${row.join("")}${
        resolvedOptions.noWrap ? "" : "`"
      }`,
      i,
    )

    // truncate if line is longeer than mobile's maximum limit char count
    // if (line.length > MAXIMUM_CHAR_COUNT_PER_LINE) {
    //   const cellCount = row.length - resolvedOptions.separator.length
    //   const seperatorTotalWidth = resolvedOptions.separator.reduce(
    //     (acc, c) => (acc += c.length),
    //     0
    //   )
    //   const avgMaxCharPerCell = Math.floor(
    //     (MAXIMUM_CHAR_COUNT_PER_LINE - seperatorTotalWidth) / cellCount
    //   )
    //   for (let i = 0; i < row.length; i += 2) {
    //     const cell = row[i]
    //     if (!cell) continue
    //     if (cell.length > avgMaxCharPerCell) {
    //       row[i] = `${cell.slice(0, avgMaxCharPerCell - 3)}...`
    //     }
    //   }
    //
    //   line = resolvedOptions.rowAfterFormatter(
    //     `${resolvedOptions.noWrap ? "" : "`"}${row.join("")}${
    //       resolvedOptions.noWrap ? "" : "`"
    //     }`,
    //     i
    //   )
    // }

    if (
      i !== 0 &&
      resolvedOptions.dividerEvery &&
      i % resolvedOptions.dividerEvery === 0
    ) {
      lines.push("\u200b")
    }

    if ((lines.join("\n") + line).length > 1024) {
      segments.push([...lines])
      lines = [line]
    } else {
      lines.push(line)
    }

    if (i === data.length - 1) {
      segments.push([...lines])
    }
  }

  return {
    segments,
    joined: segments.map((s) => s.join("\n")).join("\n"),
  }
}

export const EMPTY_FIELD = {
  name: "\u200B",
  value: "\u200B",
  inline: true,
}

export function getMultipleResultEmbed({
  title = `${getEmoji("MAG")} Multiple results found`,
  description,
  ambiguousResultText,
  multipleResultText,
}: {
  title?: string
  description?: string
  ambiguousResultText: string
  multipleResultText: string
}) {
  return composeEmbedMessage(null, {
    title,
    description:
      description ||
      `Relevant results found for \`${ambiguousResultText}\`${
        multipleResultText
          ? `, select one of the following:\n${multipleResultText}`
          : ""
      }`,
  })
}

// TODO: remove after slash command migration done
export function composeEmbedMessage(
  msg: Message | null | undefined,
  props: EmbedProperties,
) {
  let { title, description = "", footer = [getRandomTip()] } = props
  const {
    color,
    thumbnail,
    timestamp = null,
    image,
    author: _author = [],
    originalMsgAuthor,
    usage,
    examples,
    includeCommandsList,
    actions,
    document,
    noFooter,
  } = props
  const author = _author.map((a) => a ?? "").filter(Boolean)
  const commandObj = getCommandObject(commands, msg)
  const actionObj = getActionCommand(commands, msg)
  const isSpecificHelpCommand = specificHelpCommand(msg)

  if (includeCommandsList) {
    description += `\n\n${getCommandsList(
      actions ?? commandObj?.actions ?? {},
    )}`
  }

  if (isSpecificHelpCommand) {
    title = (actionObj ?? commandObj)?.brief
  }
  title = title ?? ""

  let authorAvatarURL = msg?.author?.avatarURL()
  if (originalMsgAuthor) {
    authorAvatarURL = originalMsgAuthor.avatarURL()
  }

  const embed = new MessageEmbed()
    .setTitle(title)
    .setColor((color ?? getCommandColor(commandObj)) as ColorResolvable)

  // embed options
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

  // to avoid the timestamp test fail
  if (TEST) {
    embed.setTimestamp(null)
  }

  // profiling
  const stop = performance.now()
  const start = profilingAsyncStore.getStore() ?? 0
  const timeInSeconds = Number((stop - start) / 1000).toFixed(3)

  if (noFooter === true) return embed
  if (!footer.length) footer = [getRandomTip()]
  embed
    .setFooter({
      text: getEmbedFooter([
        ...footer,
        ...(start ? [`Took ${timeInSeconds}s`] : []),
      ]),
      iconURL: authorAvatarURL || getEmojiURL(emojis.MOCHI_CIRCLE),
    })
    .setTimestamp(timestamp ?? new Date())

  return embed
}

export function composeEmbedMessage2(
  interaction: CommandInteraction,
  props: EmbedProperties,
) {
  const {
    title,
    description,
    color,
    thumbnail,
    timestamp = null,
    image,
    author: _author = [],
    originalMsgAuthor,
    usage,
    examples,
    // includeCommandsList,
    // actions,
  } = props
  let { footer = [getRandomTip()] } = props
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

  let authorAvatarURL = interaction.user.avatarURL()
  if (originalMsgAuthor) {
    authorAvatarURL = originalMsgAuthor.avatarURL()
  }

  const embed = new MessageEmbed()
    .setTitle(title ?? "")
    .setColor((color ?? getSlashCommandColor(commandObj)) as ColorResolvable)

  // profiling
  const stop = performance.now()
  const start = profilingAsyncStore.getStore() ?? 0
  const timeInSeconds = Number((stop - start) / 1000).toFixed(3)

  // embed options
  if (!footer.length) footer = [getRandomTip()]
  embed
    .setFooter({
      text: getEmbedFooter([
        ...footer,
        ...(start ? [`Took ${timeInSeconds}s`] : []),
      ]),
      iconURL: authorAvatarURL || getEmojiURL(emojis.MOCHI_CIRCLE),
    })
    .setTimestamp(timestamp ?? new Date())
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
      "TOUCH",
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
  description: string
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
    description,
    image,
    thumbnail,
    color: description ? params.color ?? msgColors.GRAY : msgColors.ERROR,
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
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  } else {
    const messageContent = msg.content ? msg.content : "Message has no content."
    embed = composeEmbedMessage(null, {
      author: [msg.author.username, msg.author.avatarURL() ?? ""],
      description: messageContent,
      originalMsgAuthor: msg.author,
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  }
  return embed
}

/**
 * Attempt to find slash equivalent version then redirect user to slash version,
 * if not found then continue to
 * find the closest match to the command key
 * If not found then reply with help message
 */
export async function getCommandSuggestion(
  fuzzySet: FuzzySet,
  userInput: string,
  commands: Record<string, Command>,
  slashCommands: Record<string, SlashCommand>,
): Promise<EmbedProperties | null> {
  const slashCmd = slashCommands[userInput]
  if (slashCmd && (await getSlashCommand(userInput))) {
    return {
      author: [
        "Mochi is moving to slash commands!",
        getEmojiURL(emojis.MOCHI_CIRCLE),
      ],
      description: `Your command was moved to ${await getSlashCommand(
        userInput,
      )}\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
      )} All existing commands are being migrated to their slash version, Mochi team appreciates for your understanding.`,
    }
  }

  const results = fuzzySet.get(userInput, null, 0.5)

  if (!results || results.length == 0) {
    return {
      author: ["Mochi is confused", getEmojiURL(emojis.MOCHI_CIRCLE)],
      description: `Mochi doesn't understand what command you are trying to use.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
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
      author: ["This command doesn't exist", getEmojiURL(emojis.HUH)],
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
    description: `${author}, your balance is insufficient.\nYou can deposit more by using </deposit:1063362961198030868>`,
  }).addFields([
    ...(current !== undefined
      ? [
          {
            name: "Your balance",
            value: `${tokenEmoji} ${roundFloatNumber(current, 10)} ${symbol}`,
            inline: true,
          },
        ]
      : []),
    ...(required
      ? [
          {
            name: "Required amount",
            value: `${tokenEmoji} ${roundFloatNumber(required, 10)} ${symbol}`,
            inline: true,
          },
        ]
      : []),
  ])
}

export async function composeMyWalletSelection(
  userId: string,
): Promise<MessageSelectOptionData[]> {
  const pfRes = await profile.getByDiscord(userId)
  if (pfRes.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: "",
      status: pfRes.status ?? 500,
      error: pfRes.error,
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
