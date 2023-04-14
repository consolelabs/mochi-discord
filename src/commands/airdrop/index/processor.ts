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
} from "discord.js"
import { InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import NodeCache from "node-cache"
import parse from "parse-duration"
import { ResponseMonikerConfigData } from "types/api"
import { OffchainTipBotTransferRequest } from "types/defi"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  defaultEmojis,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  isValidAmount,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import { validateBalance } from "utils/defi"
import { parseMonikerinCmd, isTokenSupported } from "utils/tip-bot"
import * as processor from "./processor"

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
  amountInUSD: number,
  cryptocurrency: string,
  duration: number,
  maxEntries: number
) {
  return new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm_airdrop-${authorId}-${amount}-${amountInUSD}-${cryptocurrency}-${duration}-${maxEntries}`,
      emoji: getEmoji("APPROVE"),
      style: "SUCCESS",
      label: "Confirm",
    }),
    new MessageButton({
      customId: `cancel_airdrop-${authorId}`,
      emoji: getEmoji("revoke"),
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
  const [authorId, amount, amountInUSD, token, duration, maxEntries] =
    infos.slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  const tokenEmoji = getEmoji(token)
  const endTime = dayjs()
    .add(+duration, "second")
    .toDate()
  const originalAuthor = await msg.guild?.members.fetch(authorId)
  const airdropEmbed = composeEmbedMessage(msg, {
    author: ["An airdrop appears", getEmojiURL(emojis.WALLET)],
    description: `<@${authorId}> left an airdrop of ${tokenEmoji} **${amount} ${token}** (\u2248 $${roundFloatNumber(
      +amountInUSD,
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
          emoji: "🎉",
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
    +amount,
    +amountInUSD,
    token,
    duration,
    +maxEntries
  )
}

async function checkExpiredAirdrop(
  msg: Message,
  cacheKey: string,
  authorId: string,
  amount: number,
  usdAmount: number,
  token: string,
  duration: string,
  maxEntries: number
) {
  airdropCache.on("expired", async (key, participants: string[]) => {
    if (key === cacheKey) {
      airdropCache.del(key)
      if (maxEntries > 0) {
        participants = participants.slice(0, maxEntries)
      }
      const tokenEmoji = getEmoji(token)
      const description = `<@${authorId}>'s airdrop of ${tokenEmoji} **${amount} ${token}** (\u2248 $${roundFloatNumber(
        +usdAmount,
        4
      )}) ${
        !participants?.length
          ? "has not been collected by anyone :person_shrugging:."
          : `has been collected by ${participants.join(",")}!`
      }`

      if (participants.length > 0 && msg.guildId) {
        const req: OffchainTipBotTransferRequest = {
          sender: authorId,
          recipients: participants.map((p) => parseDiscordToken(p).value),
          guildId: msg.guildId,
          channelId: msg.channelId,
          amount,
          token: token,
          each: false,
          all: false,
          transferType: "airdrop",
          fullCommand: msg.content,
          duration: +duration,
        }
        await defi.offchainDiscordTransfer(req)
      }

      const originalAuthor = await msg.guild?.members.fetch(authorId)
      msg.edit({
        embeds: [
          composeEmbedMessage(msg, {
            author: ["An airdrop appears", getEmojiURL(emojis.WALLET)],
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
          title: `${getEmoji("APPROVE")} Entered airdrop`,
          description: `You will receive your reward ${
            Number.isNaN(duration)
              ? `shortly`
              : `in ${dayjs.duration(duration, "seconds").humanize(true)}.`
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

export async function handleAirdrop(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  const payload = await processor.getAirdropPayload(msgOrInteraction, args)
  const { amount, token, all } = payload
  const { balance, usdBalance } = await validateBalance({
    msgOrInteraction,
    token,
    amount,
    all,
  })
  if (all) payload.amount = balance
  const tokenEmoji = getEmoji(payload.token)
  const usdAmount = usdBalance * payload.amount
  const amountDescription = `${tokenEmoji} **${roundFloatNumber(
    payload.amount,
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(usdAmount, 4)})`

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
  const author = getAuthor(msgOrInteraction)
  return {
    messageOptions: {
      embeds: [confirmEmbed],
      components: [
        composeAirdropButtons(
          author.id,
          payload.amount,
          usdAmount,
          payload.token,
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

  const content = args.join(" ").trim()

  const durationReg = /in\s+\d+[hms]/
  const durationIdx = content.search(durationReg)
  if (durationIdx !== -1) {
    const timeStr = content
      .substring(durationIdx)
      .replace(/in\s+/, "")
      .split(" ")[0]
    options.duration = parse(timeStr) / 1000
    if (options.duration > 3600) {
      options.duration = 3600
    }
  }
  // catch error duration invalid, exp: $airdrop 1 ftm in a
  if (content.includes("in") && durationIdx === -1) {
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
  msg: Message | CommandInteraction,
  args: string[]
): Promise<OffchainTipBotTransferRequest> {
  const author = getAuthor(msg)
  const guildId = msg.guildId ?? "DM"
  if (![3, 5, 7].includes(args.length)) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msg,
      error: "Invalid number of airdrop arguments",
    })
  }
  const { newArgs, moniker } = await parseMonikerinCmd(args, guildId)
  // airdrop 1 ftm in 1m for 1
  const amountArg = newArgs[1]
  const recipients: string[] = []
  const token = newArgs[2].toUpperCase()
  const tokenSupported = await isTokenSupported(token)
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  if (!moniker && !tokenSupported) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Unsupported token",
      description: `**${token}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright}.`,
    })
  }
  // validate airdrop amount
  const validAmount = isValidAmount({
    arg: amountArg,
    exceptions: ["all", "a", "an"],
  })
  if (!validAmount) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msg,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  let amount = parseFloat(amountArg)
  if (["a", "an"].includes(amountArg)) amount = 1
  if (moniker) {
    amount *= (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }

  const opts = getAirdropOptions(newArgs)
  // check valid duration
  if (opts.duration === 0) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msg,
      error: "The duration is invalid. Please insert a valid duration.",
    })
  }

  // check valid entries
  if (opts.maxEntries === -1) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msg,
      error:
        "The max entries number is invalid. Please insert a positive number.",
    })
  }
  return {
    sender: author.id,
    recipients,
    guildId,
    channelId: msg.channelId,
    amount,
    all: equalIgnoreCase(amountArg, "all"),
    each: false,
    fullCommand: args.join(" ").trim(),
    duration: opts.duration,
    token,
    transferType: "airdrop",
    opts,
  }
}
