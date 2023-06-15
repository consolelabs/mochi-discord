import community from "adapters/community"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  EmojiKey,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { paginationButtons } from "utils/router"
import { chunk } from "lodash"
dayjs.extend(utc)

const AIRDROP_DETAIL_STATUSES = [
  { label: "Ignore", value: "ignored" },
  { label: "Join", value: "joined" },
  { label: "Claim", value: "claimed" },
  { label: "Not Eligible", value: "not_eligible" },
]

const DATA = [
  {
    id: 1,
    title: "1 slot WL PEKACHU INU",
    deadline: "22-06-2023",
    status: "live",
  },
  {
    id: 2,
    title: "Airdrop - Tabi (Part 02) - Chain BSC",
    deadline: "22-06-2023",
    status: "ended",
  },
  {
    id: 3,
    title: "Update - Airdrop - Libra Incentix - Chain BSC",
    deadline: "22-06-2023",
    status: "ended",
  },
  {
    id: 4,
    title: "Update - Airdrop - Fantasize - Chain ETH",
    deadline: "22-06-2023",
    status: "claimed",
  },
  {
    id: 5,
    title: "Airdrop - Position Exchange - Chain BSC",
    deadline: "22-06-2023",
    status: "live",
  },
]

export async function airdropDetail(i: SelectMenuInteraction) {
  const [earnId] = i.values
  const data = DATA.find((d) => d.id.toString() === earnId)
  const description = `
        🎁Reward: Get free claim #NFT Citizenship Pass

        🎖Winner: All users I Deadline: N/A

        🗞News: CoinDesk, Binance Labs,...

        🔹Register #web ➡️ click here

        - Connect Metamask wallet

        - Claim NFT & update soon,...

        -------------------------------------------------------------------------
        ✅️Telegram ✅️Facebook ✅️Twitter ✅️Linktree`

  const embed = composeEmbedMessage(null, {
    title: data?.title || `Can't get earn detail id ${earnId}`,
    color: msgColors.PINK,
    description,
  })

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`What will you do to this airdrop?`)
            .setCustomId("set_airdrop_status")
            .addOptions(
              AIRDROP_DETAIL_STATUSES.map((status) => ({
                label: status.label,
                value: status.value,
              }))
            )
        ),
      ],
    },
  }
}

export async function setCampaignStatus(i: SelectMenuInteraction) {
  const [status] = i.values
  const statusData = AIRDROP_DETAIL_STATUSES.find((d) => d.value === status)
  const description = statusData?.label || "Description"

  const embed = composeEmbedMessage(null, {
    title: statusData?.label || `Can't get earn detail id ${statusData?.value}`,
    color: msgColors.PINK,
    description,
  })

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`What will you do to this airdrop?`)
            .setCustomId("set_airdrop_status")
            .addOptions(
              AIRDROP_DETAIL_STATUSES.map((status) => ({
                label: status.label,
                value: status.value,
              }))
            )
        ),
      ],
    },
  }
}

export enum AirdropCampaignStatus {
  Live = "live",
  Ended = "ended",
  Ignored = "ignored",
}

const PAGE_SIZE = 2

export async function run(
  userId: string,
  status = AirdropCampaignStatus.Live,
  page = 0
) {
  const embed = composeEmbedMessage(null, {
    title: `${status} Airdrop Campaigns`,
    description: "",
    thumbnail: getEmojiURL(emojis.CHEST),
    color: msgColors.YELLOW,
  })

  const filteredData = DATA.filter((d) => d.status === status) || []
  const paginated = chunk(filteredData, PAGE_SIZE)
  const data = paginated[page]

  if (filteredData.length === 0) {
    embed.setDescription(`Can't found any ${status} airdrop campaign`)
  } else {
    embed.setDescription(
      `${[
        `**${PAGE_SIZE * page + filteredData.length}**/${
          DATA.length
        } new airdrops you can join.`,
      ].join("\n")}`
    )

    embed.fields = data.map((d: any) => {
      return {
        name: `\`#${d.id}\` ${d.title}`,
        value: `Deadline: **${d.deadline}**`,
        inline: false,
      }
    })
  }

  const res = await community.getListQuest(userId)
  if (res.ok) {
    // TODO: uncomment when using rendering real data
    // data = res.data as any[]
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            style: "SECONDARY",
            label: "Live",
            customId: "view_live",
            disabled: status === AirdropCampaignStatus.Live,
          }),
          new MessageButton({
            style: "SECONDARY",
            label: "Ended",
            customId: "view_ended",
            disabled: status === AirdropCampaignStatus.Ended,
          }),
          new MessageButton({
            style: "SECONDARY",
            label: "Ignored",
            customId: "view_ignored",
            disabled: status === AirdropCampaignStatus.Ignored,
          })
        ),
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`📦 View airdrop detail`)
            .setCustomId("view_airdrop_detail")
            .addOptions(
              DATA.map((data, i) => ({
                emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                label: data.title,
                value: data.id.toString(),
              }))
            )
        ),
        ...paginationButtons(page, paginated.length),
      ],
    },
    context: {
      page,
    },
  }
}
