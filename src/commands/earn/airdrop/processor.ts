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

const DATA = [
  {
    id: 1,
    title: "1 slot WL PEKACHU INU",
    deadline: "22-06-2023",
  },
  {
    id: 2,
    title: "Airdrop - Tabi (Part 02) - Chain BSC",
    deadline: "22-06-2023",
  },
  {
    id: 3,
    title: "Update - Airdrop - Libra Incentix - Chain BSC",
    deadline: "22-06-2023",
  },
  {
    id: 4,
    title: "Update - Airdrop - Fantasize - Chain ETH",
    deadline: "22-06-2023",
  },
  {
    id: 5,
    title: "Airdrop - Position Exchange - Chain BSC",
    deadline: "22-06-2023",
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
    title: data?.title || `Can get earn detail id ${earnId}`,
    color: msgColors.PINK,
    description,
  })

  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Done")
          .setEmoji(getEmoji("CHECK"))
          .setCustomId("mark_done"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Skip")
          .setEmoji(getEmoji("NEXT_PAGE"))
          .setCustomId("mark_skip"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Favorite")
          .setEmoji(getEmoji("ANIMATED_STAR"))
          .setCustomId("mark_favoriate")
      ),
    ],
  }
}

export enum AirdropCampaignStatus {
  New = "new",
  Done = "done",
  Skipped = "skipped",
}

const PAGE_SIZE = 2

export async function run(
  userId: string,
  status = AirdropCampaignStatus.New,
  page = 0
) {
  const paginated = chunk(DATA, PAGE_SIZE)
  const data = paginated[page]
  const res = await community.getListQuest(userId)
  if (res.ok) {
    // TODO: uncomment when using rendering real data
    // data = res.data as any[]
  }

  const embed = composeEmbedMessage(null, {
    title: "New Airdrops",
    description: `${[`**5**/100 new airdrops you can join.`].join("\n")}`,
    thumbnail: getEmojiURL(emojis.CHEST),
    color: msgColors.YELLOW,
  })

  embed.fields = data.map((d: any, i: number) => {
    return {
      name: `\`#000${i + 1}\` ${d.title}`,
      value: `Deadline: **${d.deadline}**`,
      inline: false,
    }
  })

  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder(`📦 View airdrop detail`)
          .setCustomId(`view_airdrop/${status}`)
          .addOptions(
            DATA.map((data, i) => ({
              emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
              label: data.title,
              value: data.id.toString(),
            }))
          )
      ),
      ...paginationButtons(`page/${status}`, page, paginated.length),
    ],
  }
}
