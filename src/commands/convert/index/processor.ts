import defi from "adapters/defi"
import { getEmoji, msgColors } from "utils/common"
import { CommandInteraction, Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError } from "errors"

export async function render(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  const amount = args[1]
  const from = args[2].toUpperCase()
  const to = args[3].toUpperCase()

  const { data, ok, curl, error, log } = await defi.convertToken({
    from,
    to,
    amount,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data) {
    return {
      messageOptions: {
        embed: composeEmbedMessage(null, {
          title: "Cannot conver token",
          description: `${getEmoji(
            "POINTINGRIGHT"
          )} This user does not have any activities yet`,
          color: msgColors.ERROR,
        }),
      },
    }
  }

  const blank = getEmoji("blank")
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CONVERSION")} Conversion${blank.repeat(7)}`,
    description: `**${amount} ${from.toUpperCase()} ≈ ${
      data.to.amount
    } ${to.toUpperCase()}**\n\n${from.toUpperCase()}/${to.toUpperCase()}: ${
      data.to.amount
    }`,
    color: msgColors.MOCHI,
  })
  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
