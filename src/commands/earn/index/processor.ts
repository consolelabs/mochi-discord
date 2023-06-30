import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { MessageActionRow, MessageButton, User } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { getEmoji, msgColors, thumbnails, capitalizeFirst } from "utils/common"
import community from "adapters/community"
import { getProfileIdByDiscord } from "utils/profile"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

export enum EarnView {
  Airdrop = "airdrop",
  Quest = "quest",
}

export async function run(user: User, view: EarnView = EarnView.Airdrop) {
  const embed = composeEmbedMessage(null, {
    author: ["Welcome to Mochi!", thumbnails.MOCHI],
    image,
    originalMsgAuthor: user,
    color: msgColors.BLUE,
  })

  const profileId = await getProfileIdByDiscord(user.id)

  if (view === EarnView.Airdrop) {
    const res = await community.getAirdropCampaignStats({ profileId })
    if (res.ok) {
      embed.setDescription("This is your airdrop campaign dashboard")

      const data = res.data as { status: string; count: number }[]

      embed.addFields(
        data.map((statusCount) => ({
          name: capitalizeFirst(statusCount.status),
          value: statusCount.count.toString(),
          inline: true,
        }))
      )

      embed.addFields({
        name: "\u200b\nGetting Started",
        value: [
          `<:_:1110865581617463346> ${await getSlashCommand("drop available")}`,
          `<:_:1093577916434104350> ${await getSlashCommand("drop claimable")}`,
          `<:_:1093577916434104350> ${await getSlashCommand("drop search")}`,
        ].join("\n"),
        inline: false,
      })
    }
  } else {
    embed.setDescription(view)
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "Airdrop",
            style: "SECONDARY",
            customId: "VIEW_AIRDROP_DASHBOARD",
            emoji: getEmoji("NFT2"),
            disabled: view === EarnView.Airdrop,
          }),
          new MessageButton({
            label: "Quest",
            style: "SECONDARY",
            customId: "VIEW_QUEST_DASHBOARD",
            emoji: getEmoji("MOCHI_CIRCLE"),
            disabled: view === EarnView.Quest,
          })
        ),
      ],
    },
  }
}
