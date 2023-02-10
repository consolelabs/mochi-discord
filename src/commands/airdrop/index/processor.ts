import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import {
  defaultEmojis,
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
} from "utils/common"
import { getCommandObject, parseDiscordToken } from "utils/commands"
import Defi from "adapters/defi"
import NodeCache from "node-cache"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import { OffchainTipBotTransferRequest } from "types/defi"
import { composeEmbedMessage } from "ui/discord/embed"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InternalError } from "errors"
import { ResponseMonikerConfigData } from "types/api"
import { commands } from "commands"
import { parseMonikerinCmd, tipTokenIsSupported } from "utils/tip-bot"
import parse from "parse-duration"

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
      emoji: "✅",
      style: "PRIMARY",
      label: "Confirm",
    }),
    new MessageButton({
      customId: `cancel_airdrop-${authorId}`,
      emoji: getEmoji("revoke"),
      style: "SECONDARY",
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
  const [authorId, amount, amountInUSD, cryptocurrency, duration, maxEntries] =
    infos.slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  const tokenEmoji = getEmoji(cryptocurrency)
  const endTime = dayjs()
    .add(+duration, "second")
    .toDate()
  const originalAuthor = await msg.guild?.members.fetch(authorId)
  const airdropEmbed = composeEmbedMessage(msg, {
    author: ["An airdrop appears", getEmojiURL(emojis.WALLET)],
    description: `<@${authorId}> left an airdrop of ${tokenEmoji} **${amount} ${cryptocurrency}** (\u2248 $${roundFloatNumber(
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
  })

  const reply = await msg
    .edit({
      embeds: [airdropEmbed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            customId: `enter_airdrop-${authorId}-${duration}-${maxEntries}`,
            label: "Enter airdrop",
            style: "PRIMARY",
            emoji: "🎉",
          })
        ),
      ],
    })
    .catch(() => null)
  if (!reply) return
  const cacheKey = `airdrop-${reply.id}`
  airdropCache.set(cacheKey, [], +duration)

  // check airdrop expired
  const description = `<@${authorId}>'s airdrop of ${tokenEmoji} **${amount} ${cryptocurrency}** (\u2248 $${roundFloatNumber(
    +amountInUSD,
    4
  )}) `
  await checkExpiredAirdrop(
    reply as Message,
    cacheKey,
    description,
    authorId,
    +amount,
    cryptocurrency,
    duration,
    +maxEntries
  )
}

async function checkExpiredAirdrop(
  msg: Message,
  cacheKey: string,
  description: string,
  authorId: string,
  amount: number,
  cryptocurrency: string,
  duration: string,
  maxEntries: number
) {
  const getParticipantsStr = (list: string[]) =>
    list
      .slice(0, list.length - 1)
      .join(", ")
      .concat(list.length === 1 ? list[0] : ` and ${list[list.length - 1]}`)

  airdropCache.on("expired", async (key, participants: string[]) => {
    if (key === cacheKey) {
      description +=
        participants.length === 0
          ? "has not been collected by anyone :person_shrugging:."
          : `has been collected by ${getParticipantsStr(participants)}!`

      if (participants.length > 0 && msg.guildId) {
        const req: OffchainTipBotTransferRequest = {
          sender: authorId,
          recipients: participants
            .map((p) => parseDiscordToken(p).value)
            .slice(0, maxEntries),
          guildId: msg.guildId,
          channelId: msg.channelId,
          amount,
          token: cryptocurrency,
          each: false,
          all: false,
          transferType: "airdrop",
          fullCommand: msg.content,
          duration: +duration,
        }
        await Defi.offchainDiscordTransfer(req)
      }

      const originalAuthor = await msg.guild?.members.fetch(authorId)
      msg
        .edit({
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
        .catch(() => null)
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
          title: `${defaultEmojis.CHECK} Entered airdrop`,
          description: `You will receive your reward ${
            Number.isNaN(duration)
              ? `shortly`
              : `in ${dayjs.duration(duration, "seconds").humanize(true)}.`
          }`,
          footer: ["You will only receive this notification once"],
        }),
      ],
    })
    if (participants.length === +maxEntries) {
      airdropCache.emit("expired", cacheKey, participants)
      airdropCache.del(cacheKey)
    }
  }
}

export async function handleAirdrop(
  msgOrInteraction: Message | CommandInteraction,
  payload: OffchainTipBotTransferRequest,
  data: Record<string, any>
) {
  const userId =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.author.id
      : msgOrInteraction.user.id
  // get balance and price in usd
  let currentBal = 0
  let currentPrice = 0
  data?.forEach((bal: any) => {
    if (payload.token === bal.symbol) {
      currentBal = bal.balances
      currentPrice = bal.rate_in_usd
    }
  })
  if (currentBal < payload.amount && !payload.all) {
    return {
      messageOptions: {
        embeds: [
          Defi.composeInsufficientBalanceEmbed(
            msgOrInteraction,
            currentBal,
            payload.amount,
            payload.token
          ),
        ],
      },
    }
  }
  if (payload.all) payload.amount = currentBal

  const tokenEmoji = getEmoji(payload.token)
  const amountDescription = `${tokenEmoji} **${roundFloatNumber(
    payload.amount,
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(
    currentPrice * payload.amount,
    4
  )})`

  const describeRunTime = (duration = 0) => {
    const hours = Math.floor(duration / 3600)
    const mins = Math.floor((duration - hours * 3600) / 60)
    const secs = duration % 60
    return `${hours === 0 ? "" : `${hours}h`}${
      hours === 0 && mins === 0 ? "" : `${mins}m`
    }${secs === 0 ? "" : `${secs}s`}`
  }
  const confirmEmbed = composeEmbedMessage(null, {
    title: `${defaultEmojis.AIRPLANE} Confirm airdrop`,
    description: `Are you sure you want to spend ${amountDescription} on this airdrop?`,
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
          userId,
          payload.amount,
          currentPrice * payload.amount,
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
  }

  const maxEntriesReg = /for\s+\d+/
  const maxEntriesIdx = content.search(maxEntriesReg)
  if (maxEntriesIdx !== -1) {
    options.maxEntries = +content
      .substring(maxEntriesIdx)
      .replace(/for\s+/, "")
      .split(" ")
  }
  return options
}

export async function getAirdropPayload(
  msg: Message | CommandInteraction,
  args: string[]
): Promise<OffchainTipBotTransferRequest> {
  let type
  let sender
  if (msg instanceof Message) {
    const commandObject = getCommandObject(commands, msg)
    type = commandObject?.command
    sender = msg.author.id
  } else {
    type = msg.commandName
    sender = msg.user.id
  }
  const guildId = msg.guildId ?? "DM"
  const { newArgs, moniker } = await parseMonikerinCmd(args, guildId)
  if (![3, 5, 7].includes(newArgs.length)) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "Invalid airdrop command",
    })
  }
  // airdrop 1 ftm in 1m for 1
  const amountArg = newArgs[1]
  const recipients: string[] = []
  const cryptocurrency = newArgs[2].toUpperCase()

  if (!moniker && !(await tipTokenIsSupported(cryptocurrency))) {
    throw new InternalError({
      message: msg,
      title: "Unsupported token",
      description: `**${cryptocurrency.toUpperCase()}** hasn't been supported.\n${getEmoji(
        "POINTINGRIGHT"
      )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
        "POINTINGRIGHT"
      )} To add your token, run \`$token add\`.`,
    })
  }
  // validate airdrop amount
  let amount = parseFloat(amountArg)
  if (
    (isNaN(amount) || amount <= 0) &&
    !["all", "a", "an"].includes(amountArg)
  ) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  if (amountArg === "a" || amountArg === "an") {
    amount = 1
  }
  if (moniker) {
    amount *= (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }

  const options = getAirdropOptions(newArgs)
  return {
    sender,
    recipients,
    guildId,
    channelId: msg.channelId,
    amount,
    all: amountArg === "all",
    each: false,
    fullCommand: args.join(" ").trim(),
    duration: options.duration,
    token: cryptocurrency,
    transferType: type ?? "",
    opts: options,
  }
}
