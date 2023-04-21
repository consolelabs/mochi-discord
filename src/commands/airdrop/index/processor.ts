import defi from "adapters/defi"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  SelectMenuInteraction,
} from "discord.js"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import NodeCache from "node-cache"
import parse from "parse-duration"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  TokenEmojiKey,
  defaultEmojis,
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
} from "utils/common"
import { APPROX } from "utils/constants"
import { isTokenSupported, parseMoniker } from "utils/tip-bot"
import mochiPay from "../../../adapters/mochi-pay"
import { APIError } from "../../../errors"
import { InsufficientBalanceError } from "../../../errors/insufficient-balance"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { convertString } from "../../../utils/convert"
import { formatDigit, isNaturalNumber } from "../../../utils/defi"
import { reply } from "../../../utils/discord"
import { getProfileIdByDiscord } from "../../../utils/profile"

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const airdropCache = new NodeCache({
  stdTTL: 180,
  checkperiod: 1,
  useClones: false,
})

function composeAirdropButtons(
  authorId: string,
  amount: number,
  formattedUsd: string,
  cryptocurrency: string,
  chainId: string,
  duration: number,
  maxEntries: number
) {
  const formattedAmount = formatDigit(amount.toString(), 18)
  return new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm_airdrop-${authorId}-${formattedAmount}-${formattedUsd}-${cryptocurrency}-${chainId}-${duration}-${maxEntries}`,
      emoji: getEmoji("CHECK"),
      style: "SUCCESS",
      label: "Confirm",
    }),
    new MessageButton({
      customId: `cancel_airdrop-${authorId}`,
      emoji: getEmoji("REVOKE"),
      style: "DANGER",
      label: "Cancel",
    })
  )
}
export async function cancelAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()
  const infos = interaction.customId.split("-")
  const [authorId] = infos.slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  await msg.edit({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Airdrop canceled",
        description: "Your airdrop was successfully canceled.",
      }),
    ],
    components: [],
  })
}

export async function confirmAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()

  const infos = interaction.customId.split("-")
  const [authorId, amount, amountInUSD, token, chainId, duration, maxEntries] =
    infos.slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  const tokenEmoji = getEmojiToken(token as TokenEmojiKey)
  const endTime = dayjs()
    .add(+duration, "second")
    .toDate()
  const originalAuthor = await msg.guild?.members.fetch(authorId)
  const airdropEmbed = composeEmbedMessage(msg, {
    author: ["An airdrop appears", getEmojiURL(emojis.ANIMATED_COIN_3)],
    description: `<@${authorId}> left an airdrop of ${tokenEmoji} **${amount} ${token}** (${APPROX} $${formatDigit(
      amountInUSD,
      4
    )})${
      +maxEntries !== 0
        ? ` for  ${maxEntries} ${+maxEntries > 1 ? "people" : "person"}`
        : ""
    }.`,
    footer: ["Ends"],
    timestamp: endTime,
    originalMsgAuthor: originalAuthor?.user,
    color: msgColors.BLUE,
  })

  const reply = await msg.edit({
    embeds: [airdropEmbed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          customId: `enter_airdrop-${authorId}-${duration}-${maxEntries}`,
          label: "Enter airdrop",
          style: "SECONDARY",
          emoji: getEmoji("ANIMATED_PARTY_POPPER", true),
        })
      ),
    ],
  })
  const cacheKey = `airdrop-${reply.id}`
  airdropCache.set(cacheKey, [], +duration)

  await checkExpiredAirdrop(
    reply as Message,
    cacheKey,
    authorId,
    amount,
    amountInUSD,
    token as TokenEmojiKey,
    chainId,
    duration,
    +maxEntries
  )
}

async function checkExpiredAirdrop(
  msg: Message,
  cacheKey: string,
  authorId: string,
  amountStr: string,
  usdAmount: string,
  token: TokenEmojiKey,
  chainId: string,
  duration: string,
  maxEntries: number
) {
  const amount = +amountStr
  airdropCache.on("expired", async (key, participants: string[]) => {
    if (key === cacheKey) {
      airdropCache.del(key)
      if (maxEntries > 0) {
        participants = participants.slice(0, maxEntries)
      }
      const tokenEmoji = getEmojiToken(token)
      const description = `<@${authorId}>'s airdrop of ${tokenEmoji} **${amount} ${token}** (${APPROX} $${formatDigit(
        usdAmount,
        4
      )}) ${
        !participants?.length
          ? `has not been collected by anyone ${getEmoji(
              "ANIMATED_SHRUGGING",
              true
            )}.`
          : `has been collected by ${participants.join(",")}!`
      }`

      const originalAuthor = await msg.guild?.members.fetch(authorId)

      if (participants.length > 0 && msg.guildId) {
        const req: any = {
          sender: authorId,
          recipients: participants.map((p) => parseDiscordToken(p).value),
          guildId: msg.guildId,
          channelId: msg.channelId,
          amount,
          token,
          chainId,
          each: false,
          all: false,
          transferType: "airdrop",
          fullCommand: msg.content,
          duration: +duration,
          amountString: amountStr,
        }
        const { ok, data, curl, log } = await defi.offchainDiscordTransfer(req)
        if (!ok) {
          throw new APIError({ msgOrInteraction: msg, description: log, curl })
        }
        if (!originalAuthor) return
        participants.forEach(async (p) => {
          const { value } = parseDiscordToken(p)
          const user = await msg.guild?.members.fetch(value)
          user
            ?.send({
              embeds: [
                composeEmbedMessage(null, {
                  author: [
                    `You have joined ${
                      originalAuthor.nickname || originalAuthor.user.username
                    }'s airdrop`,
                    getEmojiURL(emojis.ANIMATED_COIN_3),
                  ],
                  description: `You have received ${APPROX} ${getEmoji(
                    token
                  )} ${formatDigit(
                    data.amount_each.toString()
                  )} ${token} from ${originalAuthor}'s airdrop! Let's claim it by using </withdraw:1062577077708136503>. ${getEmoji(
                    "ANIMATED_WITHDRAW",
                    true
                  )}`,
                  color: msgColors.ACTIVITY,
                }),
              ],
            })
            .catch(() => null)
        })
      }

      originalAuthor
        ?.send({
          embeds: [
            composeEmbedMessage(null, {
              author: ["The airdrop has ended!", getEmojiURL(emojis.AIRDROP)],
              description: `\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} You have airdropped ${getEmoji(
                token
              )} ${amount} ${token} for ${participants.length} users at ${
                msg.channel
              }\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true
              )} Let's check your </balance:1062577077708136500> and make another </airdrop:1062577077708136504>!`,
            }),
          ],
        })
        .catch(() => null)
      msg.edit({
        embeds: [
          composeEmbedMessage(msg, {
            author: ["An airdrop appears", getEmojiURL(emojis.ANIMATED_COIN_3)],
            footer: [`${participants.length} users joined, ended`],
            description,
            originalMsgAuthor: originalAuthor?.user,
          }),
        ],
        components: [],
      })
    }
  })
}

export async function enterAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
  const infos = interaction.customId.split("-")
  const [authorId, durationStr, maxEntries] = infos.slice(1)
  const duration = Number(durationStr)
  if (authorId === interaction.user.id) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ERROR} Airdrop error`,
          description: "Users cannot enter their own airdrops!",
        }),
      ],
      fetchReply: true,
    })
    return
  }

  const participant = `<@${interaction.user.id}>`
  const cacheKey = `airdrop-${msg.id}`
  const participants: string[] = airdropCache.get(cacheKey) ?? []
  if (participants.includes(participant)) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ERROR} Could not enter airdrop`,
          description: "You are already waiting for this airdrop.",
        }),
      ],
    })
    return
  } else {
    participants.push(participant)
    await interaction.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(msg, {
          title: `${getEmoji("CHECK")} Entered airdrop`,
          description: `You will receive your reward ${
            Number.isNaN(duration)
              ? `shortly`
              : `${dayjs.duration(duration, "seconds").humanize(true)}.`
          }`,
          footer: ["You will only receive this notification once"],
          color: msgColors.SUCCESS,
        }),
      ],
    })
    if (participants.length === +maxEntries) {
      airdropCache.emit("expired", cacheKey, participants)
    }
  }
}

export async function handleAirdrop(i: CommandInteraction, args: string[]) {
  const payload = await getAirdropPayload(i, args)
  if (!payload) return
  const { amount, token, all } = payload

  // get sender balances
  const senderPid = await getProfileIdByDiscord(i.user.id)
  const { data, ok, curl, log } = await mochiPay.getBalances({
    profileId: senderPid,
    token,
  })
  if (!ok) {
    throw new APIError({ curl, description: log, msgOrInteraction: i })
  }

  const balances = data.filter((b: any) => b.amount !== "0")

  // no balance -> reject
  if (!balances.length) {
    throw new InsufficientBalanceError({
      msgOrInteraction: i,
      params: { current: 0, required: amount, symbol: token as TokenEmojiKey },
    })
  }

  // only one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const decimal = balance.token?.decimal ?? 0
    const current = convertString(balance.amount, decimal)
    if (current < amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction: i,
        params: { current, required: amount, symbol: token as TokenEmojiKey },
      })
    }
    payload.chain_id = balance.token?.chain?.chain_id
    if (all) payload.amount = current
    if (!isNaturalNumber(payload.amount * Math.pow(10, decimal))) {
      throw new DiscordWalletTransferError({
        message: i,
        error: ` ${token} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
      })
    }
    payload.token_price = balance.token?.price
    payload.amount_string = formatDigit(payload.amount.toString(), decimal)
    // const result = await executeTip(msgOrInteraction, payload, balance.token)
    // await reply(msgOrInteraction, result)
    const output = await showConfirmation(i, payload)
    await reply(i, output)
    return
  }

  // found multiple tokens balance with given symbol -> ask for selection
  await selectTokenToAirdrop(i, balances, payload, all)
  return
}

async function selectTokenToAirdrop(
  ci: CommandInteraction,
  balances: any,
  payload: any,
  all?: boolean
) {
  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `airdrop-select-token`,
    placeholder: "Select a token",
    options: balances.map((b: any) => {
      const chain = b.token?.chain?.name
      return {
        label: `${b.token.name} ${chain ? `(${chain})` : ""}`,
        value: b.token.chain.chain_id,
      }
    }),
  })

  // embed
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: ci.user,
    author: ["Multiple results found", getEmojiURL(emojis.MAG)],
    description: `You have \`${
      payload.token
    }\` balance on multiple chains: ${balances
      .map((b: any) => {
        return `\`${b.token?.chain?.name}\``
      })
      .filter((s: any) => Boolean(s))
      .join(", ")}.\nPlease select one of the following`,
  })

  // select-menu handler
  const suggestionHandler = async (i: SelectMenuInteraction) => {
    await i.deferUpdate()
    payload.chain_id = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chain_id === b.token?.chain?.chain_id
    )
    const decimal = balance?.token?.decimal ?? 0
    const current = convertString(balance?.amount, decimal) ?? 0
    if (current < payload.amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction: i,
        params: {
          current,
          required: payload.amount,
          symbol: payload.token,
        },
      })
    }
    if (all) payload.amount = current
    if (!isNaturalNumber(payload.amount * Math.pow(10, decimal))) {
      throw new DiscordWalletTransferError({
        message: i,
        error: ` ${payload.token} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
      })
    }
    payload.token_price = balance.token?.price
    payload.amount_string = formatDigit(payload.amount.toString(), decimal)
    return await showConfirmation(ci, payload)
  }

  // reply
  reply(ci, {
    messageOptions: { embeds: [embed], components: [selectRow] },
    selectMenuCollector: { handler: suggestionHandler },
  })
}

function showConfirmation(i: CommandInteraction, payload: any) {
  const tokenEmoji = getEmojiToken(payload.token as TokenEmojiKey)
  const usdAmount = payload.token_price * payload.amount
  const formattedUsd = formatDigit(usdAmount.toString(), 4)
  const amountDescription = `${tokenEmoji} **${formatDigit(
    payload.amount.toString()
  )} ${payload.token}** (${APPROX} $${formattedUsd})`

  const describeRunTime = (duration = 0) => {
    const hours = Math.floor(duration / 3600)
    const mins = Math.floor((duration - hours * 3600) / 60)
    const secs = duration % 60
    return `${hours === 0 ? "" : `${hours}h`}${
      hours === 0 && mins === 0 ? "" : `${mins}m`
    }${secs === 0 ? "" : `${secs}s`}`
  }
  const confirmEmbed = composeEmbedMessage(null, {
    title: `${getEmoji("AIRDROP")} Confirm airdrop`,
    description: `Are you sure you want to spend ${amountDescription} on this airdrop?`,
    color: msgColors.BLUE,
  }).addFields([
    {
      name: "Total reward",
      value: amountDescription,
      inline: true,
    },
    {
      name: "Run time",
      value: `${describeRunTime(payload.duration)}`,
      inline: true,
    },
    {
      name: "Max entries",
      value: `${
        payload.opts?.maxEntries === 0 ? "-" : payload.opts?.maxEntries
      }`,
      inline: true,
    },
  ])
  return {
    messageOptions: {
      embeds: [confirmEmbed],
      components: [
        composeAirdropButtons(
          i.user.id,
          payload.amount,
          formattedUsd,
          payload.token,
          payload.chain_id,
          payload.duration ?? 0,
          payload.opts?.maxEntries ?? 0
        ),
      ],
    },
  }
}

function getAirdropOptions(args: string[]) {
  const options: { duration: number; maxEntries: number } = {
    duration: 180, // in secs
    maxEntries: 0,
  }

  // unitless case -> default to minute
  if (args[3] === "in" && !Number.isNaN(Number(args[4].replace(/in\s+/, "")))) {
    args[4] = `${args[4]}m`
  }

  const content = args.join(" ").trim()
  const forIndex = args.findIndex((v) => equalIgnoreCase(v, "for"))

  // need to isolate in order to avoid parsing the "..for.." clause
  const contentWithoutFor = args
    .slice(0, forIndex === -1 ? undefined : forIndex)
    .join(" ")
    .trim()

  const durationReg =
    /in\s*(\s*\d+\s?(?:hour(s)?|minute(s)?|second(s)?|hr(s)?|min(s)?|sec(s)?|h|m|s))+/
  const durationIdx = contentWithoutFor.search(durationReg)
  if (durationIdx !== -1) {
    const timeStr = contentWithoutFor
      .substring(durationIdx)
      .replace(/in\s+/, "")

    options.duration = parse(timeStr) / 1000
    if (options.duration > 3600) {
      options.duration = 3600
    }
  }
  // catch error duration invalid, exp: $airdrop 1 ftm in a
  if (contentWithoutFor.includes("in") && durationIdx === -1) {
    options.duration = 0
  }

  const maxEntriesReg = /for\s+\d+/
  const maxEntriesIdx = content.search(maxEntriesReg)
  if (maxEntriesIdx !== -1) {
    const entries = +content
      .substring(maxEntriesIdx)
      .replace(/for\s+/, "")
      .split(" ")[0]
    options.maxEntries = entries === 0 ? -1 : entries
  }

  if (content.includes("for") && [0, -1].includes(maxEntriesIdx)) {
    options.maxEntries = -1
  }
  return options
}

export async function getAirdropPayload(
  i: CommandInteraction,
  args: string[]
): Promise<any> {
  const guildId = i.guildId ?? "DM"
  if (![3, 5, 7].includes(args.length)) {
    throw new DiscordWalletTransferError({
      discordId: i.user.id,
      message: i,
      error: "Invalid number of airdrop arguments",
    })
  }

  const amountArg = args[1]
  const unit = args[2].toUpperCase()

  // get amount
  const { amount: parsedAmount, all } = await parseAmount(i, amountArg)
  // check if unit is a valid token ...
  const isToken = await isTokenSupported(unit)
  let moniker
  // if not then it could be a moniker
  if (!isToken) {
    moniker = await parseMoniker(unit, i.guildId ?? "")
  }
  const amount = parsedAmount * (moniker?.moniker?.amount ?? 1)
  const token = (moniker?.moniker?.token?.token_symbol ?? unit).toUpperCase()

  // if unit is not either a token or a moniker -> reject
  if (!moniker && !isToken) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    const errorEmbed = getErrorEmbed({
      title: "Unsupported token",
      description: `**${token}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
    i.editReply({ embeds: [errorEmbed] })
    return null
  }

  // get valid optional arguments (duration & max entries)
  const opts = getAirdropOptions(args)
  if (opts.duration === 0) {
    i.editReply({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Invalid duration", getEmojiURL(emojis.REVOKE)],
          description: "The duration must be a number and lower than 1 hour",
          color: msgColors.GRAY,
        }),
      ],
    })
    return null
  }

  // check valid entries
  if (opts.maxEntries === -1) {
    i.editReply({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Invalid entries", getEmojiURL(emojis.REVOKE)],
          color: msgColors.GRAY,
        }),
      ],
    })
    return null
  }
  return {
    sender: i.user.id,
    recipients: [] as string[],
    guildId,
    channelId: i.channelId,
    amount,
    all,
    each: false,
    fullCommand: args.join(" ").trim(),
    duration: opts.duration,
    token,
    transferType: "airdrop",
    opts,
  }
}

async function parseAmount(
  i: CommandInteraction,
  amountArg: string
): Promise<{ all: boolean; amount: number }> {
  const result = {
    all: false,
    amount: parseFloat(amountArg),
  }
  switch (true) {
    // a, an = 1
    case ["a", "an"].includes(amountArg.toLowerCase()):
      result.amount = 1
      break

    // tip all, let BE calculate amount
    case equalIgnoreCase("all", amountArg):
      result.amount = 0
      result.all = true
      break

    // invalid amount
    case isNaN(result.amount) || result.amount <= 0:
      throw new DiscordWalletTransferError({
        discordId: i.user.id,
        message: i,
        error: "The amount is invalid. Please insert a natural number.",
      })
  }

  return result
}
