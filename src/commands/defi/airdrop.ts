import { Command } from "types/common"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { AIRDROP_GITBOOK, DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import { GuildIdNotFoundError, APIError } from "errors"
import {
  defaultEmojis,
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
  tripodEmojis,
} from "utils/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import Defi from "adapters/defi"
import NodeCache from "node-cache"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import { OffchainTipBotTransferRequest } from "types/defi"
import { composeEmbedMessage, getExitButton } from "utils/discordEmbed"

dayjs.extend(duration)
dayjs.extend(relativeTime)

const airdropCache = new NodeCache({
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
    getExitButton(authorId, "Cancel")
  )
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
    duration
  )
}

async function checkExpiredAirdrop(
  msg: Message,
  cacheKey: string,
  description: string,
  authorId: string,
  amount: number,
  cryptocurrency: string,
  duration: string
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
          recipients: participants.map((p) => parseDiscordToken(p).value),
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
          title: `${defaultEmojis.ERROR} Could not enter airdrop`,
          description: "You cannot enter your own airdrops.",
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

const command: Command = {
  id: "airdrop",
  command: "airdrop",
  brief: "Token airdrop offchain",
  category: "Defi",
  run: async function (msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const payload = await Defi.getAirdropPayload(msg, args)
    // check balance
    const {
      ok,
      data = [],
      log,
      curl,
    } = await Defi.offchainGetUserBalances({
      userId: payload.sender,
    })
    if (!ok) {
      throw new APIError({ message: msg, curl: curl, description: log })
    }
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
              msg,
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
    const confirmEmbed = composeEmbedMessage(msg, {
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
            msg.author.id,
            payload.amount,
            currentPrice * payload.amount,
            payload.token,
            payload.duration ?? 0,
            payload.opts?.maxEntries ?? 0
          ),
        ],
      },
    }
  },
  featured: {
    title: `<:_:${tripodEmojis.AIRDROPPER}> Airdrop`,
    description:
      "Airdrop tokens for a specified number of users to collect in a given amount of time",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}airdrop <amount> <token> [in <duration>] [for <max entries>]`,
        examples: `${PREFIX}airdrop 10 ftm\n${PREFIX}airdrop 10 ftm in 5m\n${PREFIX}airdrop 10 ftm in 5m for 6`,
        document: AIRDROP_GITBOOK,
        description:
          "Airdrop offchain tokens for a specified number of users to collect in a given amount of time",
        footer: [DEFI_DEFAULT_FOOTER],
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["drop"],
  colorType: "Defi",
  minArguments: 3,
}

export default command
