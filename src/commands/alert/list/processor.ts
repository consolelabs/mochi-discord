import defi from "adapters/defi"
import { CommandInteraction, Message, MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, paginate } from "utils/common"

export async function handleAlertList({
  msg,
  interaction,
}: {
  msg?: Message
  interaction?: CommandInteraction
}) {
  let userId: string
  if (msg) {
    userId = msg.author.id
  } else if (interaction) {
    userId = interaction.user.id
  } else {
    return null
  }

  const {
    ok,
    data,
    log,
    curl,
    status = 500,
    error,
  } = await defi.getAlertList(userId)
  if (!ok) {
    throw new APIError({ curl, description: log, status, error })
  }

  if (!data) {
    return []
  }

  let pages = paginate(data as [], 10)
  pages = pages.map((arr: any, idx: number): MessageEmbed => {
    let description = ""
    arr.forEach(
      (item: any) =>
        (description += `**${item.symbol}** - ${item.frequency.replaceAll(
          "_",
          " ",
        )}\n${getEmoji("REPLY")} When ${item.alert_type.replaceAll(
          "_",
          " ",
        )} **${
          ["change_is_over", "change_is_under"].includes(item?.alert_type)
            ? item.value + "%"
            : item.value
        }**\n`),
    )
    return composeEmbedMessage(null, {
      title: `${getEmoji("ANIMATED_CHART_INCREASE", true)} Alert list`,
      description,
      footer: [`Page ${idx + 1} / ${pages.length}`],
    })
  })
  return pages
}
