import community from "adapters/community"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { MessageActionRow, MessageSelectMenu } from "discord.js"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  EmojiKey,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { paginationButtons } from "utils/router"
import { ModelAirdropCampaign } from "types/api"

dayjs.extend(utc)

export enum ProfileCampaignStatus {
  Ignored = "ignored",
  Joined = "joined",
  Claimed = "claimed",
  NotEligible = "not_eligible",
}

const PAGE_SIZE = 5

export async function run(userId: string, keyword = "", page = 0) {
  let data = [] as ModelAirdropCampaign[]
  let total = 0
  const embed = composeEmbedMessage(null, {
    title: `Airdrop Campaigns`,
    description: "",
    thumbnail: getEmojiURL(emojis.CHEST),
    color: msgColors.YELLOW,
  })

  const { data: res, ok } = await community.getAirdropCampaign({
    page,
    keyword,
    size: PAGE_SIZE,
  })

  if (ok) {
    data = res.data as ModelAirdropCampaign[]
    total = res.metadata?.total || 0
  }

  const totalPage = Math.ceil(total / PAGE_SIZE)

  if (total === 0) {
    embed.setDescription(
      `Can't found any airdrop campaign with keyword **${keyword}**`
    )

    return {
      msgOpts: {
        embeds: [embed],
        components: [],
      },
      context: {
        keyword,
        page: 0,
      },
    }
  } else {
    embed.setDescription(
      `**${
        PAGE_SIZE * page + data.length
      }**/${total} matched ${keyword} airdrops.`
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
      keyword,
      page,
    },
  }
}
