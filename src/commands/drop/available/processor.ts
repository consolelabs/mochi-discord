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
  capitalizeFirst,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { paginationButtons } from "utils/router"
import { getProfileIdByDiscord } from "utils/profile"
import { ModelAirdropCampaign, ModelProfileAirdropCampaign } from "types/api"
import { AirdropCampaignStatus } from ".."

dayjs.extend(utc)

export enum ProfileCampaignStatus {
  Ignored = "ignored",
  Joined = "joined",
  Claimed = "claimed",
  NotEligible = "not_eligible",
}

const renderAirdropCampaignDetail = (campaign: ModelAirdropCampaign) => {
  const embed = composeEmbedMessage(null, {
    title: `\`#${campaign.id}\` ${campaign.title}`,
    color: msgColors.PINK,
    description: campaign.detail,
  })
  return {
    // update global state to use in other function
    context: {
      campaignId: campaign.id,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`What will you do to this airdrop?`)
            .setCustomId("set_airdrop_status")
            .addOptions(
              Object.values(ProfileCampaignStatus).map((status) => ({
                label: capitalizeFirst(status.split("_").join(" ")),
                value: status,
                default: campaign.profile_campaign_status === status,
              }))
            )
        ),
      ],
    },
  }
}

export async function airdropDetail(i: SelectMenuInteraction) {
  let data: ModelAirdropCampaign | null = null
  const profileId = await getProfileIdByDiscord(i.user.id)
  const [earnId] = i.values
  const embed = composeEmbedMessage(null, {
    title: `Airdrop campaign not found`,
    color: msgColors.PINK,
    description: `Can't get airdrop campaign id ${earnId}`,
  })
  const { data: res, ok } = await community.getAirdropCampaignById(earnId, {
    profileId,
  })

  if (ok) {
    data = res as ModelAirdropCampaign
    return renderAirdropCampaignDetail(data)
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: [],
    },
  }
}

export async function setAirdropStatus(i: SelectMenuInteraction, ctx: any) {
  const profileId = await getProfileIdByDiscord(i.user.id)
  const [status] = i.values
  const { ok } = await community.upsertUserAirdropCampaign(profileId, {
    airdropCampaignId: parseInt(ctx.campaignId),
    status,
  })

  if (ok) {
    const { data: res, ok: getOk } = await community.getAirdropCampaignById(
      ctx.campaignId,
      { profileId }
    )
    if (getOk) {
      const data = res as ModelAirdropCampaign
      return renderAirdropCampaignDetail(data)
    }
  }

  return {
    msgOpts: {
      embeds: [],
      components: [],
    },
  }
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
  keyword = "",
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
          keyword,
          size: PAGE_SIZE,
        })

  if (ok) {
    data =
      status === AirdropCampaignStatus.Ignored
        ? (res.data.map(
            (i: ModelProfileAirdropCampaign) => i.airdrop_campaign
          ) as ModelAirdropCampaign[])
        : (res.data as ModelAirdropCampaign[])
    total = res.metadata?.total || 0
  }

  const totalPage = Math.ceil(total / PAGE_SIZE)

  if (total === 0) {
    const description = [
      `Can't found any **${status}** airdrop campaign`,
      keyword ? ` with keyword **${keyword}**` : "",
    ].join("")

    embed.setDescription(description)

    return {
      msgOpts: {
        embeds: [embed],
        components: renderStatusTabs(status),
      },
      context: {
        keyword,
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
                label: `#${campaign.id}. ${campaign.title}`,
                value: campaign.id?.toString() || "0",
              }))
            )
        ),
        ...paginationButtons(page, totalPage),
      ],
    },
    context: {
      page,
      keyword,
    },
  }
}
