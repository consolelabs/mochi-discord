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
import { getProfileIdByDiscord } from "utils/profile"
import { ModelAirdropCampaign } from "types/api"

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

export async function setAirdropStatus(i: SelectMenuInteraction) {
  const [status] = i.values
  const statusData = AIRDROP_DETAIL_STATUSES.find((d) => d.value === status)
  const description = statusData?.label || "Description"

  const embed = composeEmbedMessage(null, {
    title: statusData?.label || `Status is changed to ${statusData?.value}`,
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

const PAGE_SIZE = 5

const renderStatusTabs = (status: AirdropCampaignStatus) => {
  return [
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
  ]
}

export async function run(
  userId: string,
  status = AirdropCampaignStatus.Live,
  page = 0
) {
  let data = [] as ModelAirdropCampaign[]
  let total = 0
  const embed = composeEmbedMessage(null, {
    title: `Airdrop Campaigns`,
    description: "",
    thumbnail: getEmojiURL(emojis.CHEST),
    color: msgColors.YELLOW,
  })

  const profileId = await getProfileIdByDiscord(userId)

  const { data: res, ok } =
    status === AirdropCampaignStatus.Ignored
      ? await community.getAirdropCampaignByUser(profileId, {
          status,
          page,
          size: PAGE_SIZE,
        })
      : await community.getAirdropCampaign({
          status,
          page,
          size: PAGE_SIZE,
        })

  if (ok) {
    data = res.data as ModelAirdropCampaign[]
    total = res.metadata?.total || 0
  }

  const totalPage = Math.ceil(total / PAGE_SIZE)

  if (total === 0) {
    embed.setDescription(`Can't found any ${status} airdrop campaign`)

    return {
      msgOpts: {
        embeds: [embed],
        components: renderStatusTabs(status),
      },
      context: {
        page: 0,
      },
    }
  } else {
    embed.setDescription(
      `**${PAGE_SIZE * page + data.length}**/${total} ${status} airdrops.`
    )

    embed.fields = data.map((d: any) => {
      return {
        name: `\`#${d.id}\` ${d.title}`,
        value: `Deadline: **${d.deadline || "TBD"}**`,
        inline: false,
      }
    })
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        ...renderStatusTabs(status),
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`📦 View airdrop detail`)
            .setCustomId("view_airdrop_detail")
            .addOptions(
              data.map((campaign: ModelAirdropCampaign, i) => ({
                emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                label: campaign.title || "No Title",
                value: campaign.id?.toString() || "0",
              }))
            )
        ),
        ...paginationButtons(page, totalPage),
      ],
    },
    context: {
      page,
    },
  }
}
