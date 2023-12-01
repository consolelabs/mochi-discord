import community from "adapters/community"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiToken, msgColors, TokenEmojiKey } from "utils/common"
import { APIError } from "errors"
import { CommandInteraction, Message } from "discord.js"
import { reply } from "utils/discord"

export async function handleNftStats(msg: Message | CommandInteraction) {
  const res = await community.getCollectionCount()
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }
  let description = ``
  const sortedStats = res.data.data?.sort(
    (a, b) => (b.count ?? 0) - (a.count ?? 0),
  )
  sortedStats?.forEach((v) => {
    description += `${getEmojiToken(
      (v.chain?.currency as TokenEmojiKey) ?? "",
    )} **${v.chain?.short_name?.toUpperCase() ?? "NA"}**: ${
      v.count
    } collections\n\n`
  })

  const response = {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Collections supported",
          description: description,
          color: msgColors.PINK,
        }),
      ],
    },
  }
  await reply(msg, response)
}
