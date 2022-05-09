import { Command } from "types/common"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton
} from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import {
  defaultEmojis,
  getEmoji,
  roundFloatNumber,
  thumbnails
} from "utils/common"
import { getCommandArguments } from "utils/commands"
import Defi from "adapters/defi"
import NodeCache from "node-cache"
import dayjs from "dayjs"
import { DiscordWalletTransferRequest } from "types/defi"
import { composeEmbedMessage } from "utils/discordEmbed"

const airdropCache = new NodeCache({
  stdTTL: 180,
  checkperiod: 1,
  useClones: false
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
      label: "Confirm"
    }),
    new MessageButton({
      customId: `cancel_airdrop`,
      emoji: "❌",
      style: "SECONDARY",
      label: "Cancel"
    })
  )
}

export async function confirmAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()

  const infos = interaction.customId.split("-")
  const [
    authorId,
    amount,
    amountInUSD,
    cryptocurrency,
    duration,
    maxEntries
  ] = infos.slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  const tokenEmoji = getEmoji(cryptocurrency)
  const endTime = dayjs()
    .add(+duration, "second")
    .toDate()
  const originalAuthor = await msg.guild.members.fetch(authorId)
  const airdropEmbed = composeEmbedMessage(msg, {
    title: `${defaultEmojis.AIRPLANE} An airdrop appears`,
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
    originalMsgAuthor: originalAuthor?.user
  })

  const reply = await msg.edit({
    embeds: [airdropEmbed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton({
          customId: `enter_airdrop-${authorId}-${duration}-${maxEntries}`,
          label: "Enter airdrop",
          style: "PRIMARY",
          emoji: "🎉"
        })
      )
    ]
  })
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
    cryptocurrency
  )
}

async function checkExpiredAirdrop(
  msg: Message,
  cacheKey: string,
  description: string,
  authorId: string,
  amount: number,
  cryptocurrency: string
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

      if (participants.length > 0) {
        const req: DiscordWalletTransferRequest = {
          sender: authorId,
          recipients: participants.map(p =>
            p
              .replace("<@!", "")
              .replace("<@", "")
              .replace(">", "")
          ),
          amount,
          cryptocurrency,
          guildId: msg.guildId,
          channelId: msg.channelId,
          token: null
        }
        await Defi.discordWalletTransfer(JSON.stringify(req), msg)
      }

      const originalAuthor = await msg.guild.members.fetch(authorId)
      msg.edit({
        embeds: [
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.AIRPLANE} An airdrop appears`,
            footer: [`${participants.length} users joined, ended`],
            description,
            originalMsgAuthor: originalAuthor?.user
          })
        ],
        components: []
      })
    }
  })
}

export async function enterAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
  const infos = interaction.customId.split("-")
  const [authorId, duration, maxEntries] = infos.slice(1)
  if (authorId === interaction.user.id) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ERROR} Could not enter airdrop`,
          description: "You cannot enter your own airdrops."
        })
      ],
      fetchReply: true
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
          description: "You are already waiting for this airdrop."
        })
      ]
    })
    return
  } else {
    participants.push(participant)
    await interaction.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.CHECK} Entered airdrop`,
          description: `You will receive your reward in ${duration}s.`,
          footer: ["You will only receive this notification once"]
        })
      ]
    })
    if (participants.length === +maxEntries)
      airdropCache.emit("expired", cacheKey, participants)
  }
}

const command: Command = {
  id: "airdrop",
  command: "airdrop",
  brief: "Leave a packet of coins for anyone to pick up",
  category: "Defi",
  run: async function(msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const payload = await Defi.getTransferPayload(msg, args)
    // check balance
    const data = await Defi.discordWalletBalances(msg.guildId, msg.author.id)
    const currentBal = data.balances[payload.cryptocurrency.toUpperCase()]
    if (currentBal < payload.amount && !payload.all) {
      return {
        messageOptions: {
          embeds: [
            Defi.composeInsufficientBalanceEmbed(
              msg,
              currentBal,
              payload.amount,
              payload.cryptocurrency
            )
          ]
        }
      }
    }
    if (payload.all) payload.amount = currentBal

    // ---------------
    const tokenEmoji = getEmoji(payload.cryptocurrency)
    const coin = await Defi.getCoin(msg, payload.token.coin_gecko_id)
    const currentPrice = roundFloatNumber(coin.market_data.current_price["usd"])
    const amountDescription = `${tokenEmoji} **${roundFloatNumber(
      payload.amount,
      4
    )} ${payload.cryptocurrency}** (\u2248 $${roundFloatNumber(
      currentPrice * payload.amount,
      4
    )})`

    const describeRunTime = (duration: number) => {
      const hours = Math.floor(duration / 3600)
      const mins = Math.floor((duration - hours * 3600) / 60)
      const secs = duration % 60
      return `${hours === 0 ? "" : `${hours}h`}${
        hours === 0 && mins === 0 ? "" : `${mins}m`
      }${secs === 0 ? "" : `${secs}s`}`
    }
    const confirmEmbed = composeEmbedMessage(msg, {
      title: `${defaultEmojis.AIRPLANE} Confirm airdrop`,
      description: `Are you sure you want to spend ${amountDescription} on this airdrop?`
    }).addFields([
      {
        name: "Total reward",
        value: amountDescription,
        inline: true
      },
      {
        name: "Run time",
        value: `${describeRunTime(payload.opts?.duration)}`,
        inline: true
      },
      {
        name: "Max entries",
        value: `${
          payload.opts?.maxEntries === 0 ? "-" : payload.opts?.maxEntries
        }`,
        inline: true
      }
    ])

    return {
      messageOptions: {
        embeds: [confirmEmbed],
        components: [
          composeAirdropButtons(
            msg.author.id,
            payload.amount,
            currentPrice * payload.amount,
            payload.cryptocurrency,
            payload.opts?.duration,
            payload.opts?.maxEntries
          )
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}airdrop <amount> <token> [in <duration>] [for <max entries>]`,
        examples: `${PREFIX}airdrop 10 ftm\n${PREFIX}airdrop 10 ftm in 5m\n${PREFIX}airdrop 10 ftm in 5m for 6`,
        footer: [DEFI_DEFAULT_FOOTER]
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["drop"]
}

export default command
