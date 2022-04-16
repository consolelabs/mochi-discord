import { Command } from "types/common"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import {
  defaultEmojis,
  getCommandArguments,
  getEmoji,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import Social from "modules/social"
import NodeCache from "node-cache"
import dayjs from "dayjs"
import { DiscordWalletTransferRequest } from "types/social"
import { composeEmbedMessage } from "utils/discord-embed"

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
    new MessageButton({
      customId: `cancel_airdrop`,
      emoji: "❌",
      style: "SECONDARY",
      label: "Cancel",
    })
  )
}

export async function confirmAirdrop(
  interaction: ButtonInteraction,
  msg: Message
) {
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
  const airdropEmbed = composeEmbedMessage(msg, {
    title: `${defaultEmojis.AIRPLANE} An airdrop appears`,
    description: `<@${authorId}> left an airdrop of ${tokenEmoji} **${amount} ${cryptocurrency}** (\u2248 $${amountInUSD})${
      +maxEntries !== 0
        ? ` for  ${maxEntries} ${+maxEntries > 1 ? "people" : "person"}`
        : ""
    }.`,
    footer: ["Ends"],
    timestamp: endTime,
  })
  await msg.delete().catch(() => {})
  const reply = await interaction.reply({
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
    fetchReply: true,
  })
  const cacheKey = `airdrop-${reply.id}`
  airdropCache.set(cacheKey, [], +duration)

  // check airdrop expired
  const description = `<@${authorId}>'s airdrop of ${tokenEmoji} **${amount} ${cryptocurrency}** (\u2248 $${amountInUSD}) `
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
          fromDiscordId: authorId,
          toDiscordIds: participants.map((p) =>
            p.replace("<@!", "").replace("<@", "").replace(">", "")
          ),
          amount,
          cryptocurrency,
          guildId: msg.guildId,
          channelId: msg.channelId,
        }
        await Social.discordWalletTransfer(JSON.stringify(req), msg)
      }

      msg.edit({
        embeds: [
          composeEmbedMessage(msg, {
            title: `${defaultEmojis.AIRPLANE} An airdrop appears`,
            footer: [`${participants.length} users joined, ended`],
            description,
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
  const [authorId, duration, maxEntries] = infos.slice(1)
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
          description: `You will receive your reward in ${duration}s.`,
          footer: ["You will only receive this notification once"],
        }),
      ],
    })
    if (participants.length === +maxEntries)
      airdropCache.emit("expired", cacheKey, participants)
  }
}

const command: Command = {
  id: "airdrop",
  command: "airdrop",
  name: "Airdrop",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const payload = await Social.getAirdropPayload(msg, args)
    // check balance
    const data = await Social.discordWalletBalances(msg.author.id)
    const currentBal = data.balances[payload.cryptocurrency.toUpperCase()]
    if (currentBal < payload.amount && !payload.all) {
      return {
        messageOptions: {
          embeds: [
            Social.composeInsufficientBalanceEmbed(
              msg,
              currentBal,
              payload.amount,
              payload.cryptocurrency
            ),
          ],
        },
      }
    }
    if (payload.all) payload.amount = currentBal

    // ---------------
    const tokenEmoji = getEmoji(payload.cryptocurrency)
    const currentPrice = roundFloatNumber(
      await Social.getCoinPrice(msg, payload.cryptocurrency)
    )
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
      description: `Are you sure you want to spend ${amountDescription} on this airdrop?`,
    }).addFields([
      {
        name: "Total reward",
        value: amountDescription,
        inline: true,
      },
      {
        name: "Run time",
        value: `${describeRunTime(payload.opts?.duration)}`,
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
            payload.cryptocurrency,
            payload.opts?.duration,
            payload.opts?.maxEntries
          ),
        ],
      },
      replyOnOriginal: true,
    }
  },
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      thumbnail: thumbnails.TIP,
      description: "Leave a packet of coins for anyone to pick up",
      footer: [DEFI_DEFAULT_FOOTER],
    })
      .addField(
        "_Usage_",
        `\`${PREFIX}airdrop <amount> <token> [in <duration>] [for <max entries>]\``
      )
      .addField(
        "_Examples_",
        `\`\`\`${PREFIX}airdrop 10 ftm\n${PREFIX}airdrop 10 ftm in 5m\n${PREFIX}airdrop 10 ftm in 5m for 6\`\`\``
      )
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["drop", "air"],
}

export default command
