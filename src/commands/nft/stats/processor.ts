import community from "adapters/community"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { APIError } from "errors"
import { CommandInteraction, Message } from "discord.js"

export async function handleNftStats(msg: Message | CommandInteraction) {
  const res = await community.getCollectionCount()
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }
  let description = ``
  const sortedStats = res.data.data?.sort(
    (a, b) => (b.count ?? 0) - (a.count ?? 0)
  )
  sortedStats?.forEach((v) => {
    description += `${getEmoji(v.chain?.currency ?? "")} **${
      v.chain?.short_name?.toUpperCase() ?? "NA"
    }**: ${v.count} collections\n\n`
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Collections supported",
          description: description,
        }),
      ],
    },
  }
}
