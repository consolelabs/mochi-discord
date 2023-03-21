import defi from "adapters/defi"
import { getEmoji, msgColors } from "utils/common"
import { MessageEmbed } from "discord.js"
import { CommandInteraction, Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError } from "errors"

export async function render(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  const amount = args[1]
  const from = args[2]
  const to = args[3]

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
  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("CONVERSION")} Conversion${blank.repeat(7)}`)
    .setDescription(
      `**${amount} ${from.toUpperCase()} ≈ ${
        data.to.amount
      } ${to.toUpperCase()}**`
    )
    .setColor(msgColors.MOCHI)
    .setFooter({
      text: `${data.from.name} convert to ${data.to.name}`,
    })
  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
