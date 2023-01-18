import community from "adapters/community"
import { MessageEmbed } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"

export async function createNewYearEnvelop(
  authorId: string,
  command: string
): Promise<MessageEmbed> {
  const { data, ok } = await community.getUserEnvelopStreak(authorId)
  let description = `${getEmoji(
    "pumpeet"
  )} You have just received 1 lucky envelope.\n\n${getEmoji(
    "pointingright"
  )} The more command you use, the more envelope you get! Let's collect more envelopes to get Mochi's gift. ${getEmoji(
    "mooning"
  )}\n${getEmoji(
    "pointingright"
  )} The special gift will be revealed in our [Discord server](https://discord.com/channels/882287783169896468/886104451268620319). Join now!\n\n${getEmoji(
    "TROPHY"
  )} **Top 3 envelopes owners will get our special gift on 29/1.**`
  if (ok) {
    description = `${getEmoji(
      "pumpeet"
    )} Hey <@${authorId}>! You have just received 1 lucky envelope. \n\n${getEmoji(
      "STAR2"
    )} Total envelope: **${data.total_envelop + 1}** ${getEmoji(
      "STAR2"
    )}\n${getEmoji(
      "pointingright"
    )} The more command you use, the more envelope you get! Let's collect more envelopes to get Mochi's gift. ${getEmoji(
      "mooning"
    )}\n\n${getEmoji(
      "TROPHY"
    )} **Top 3 envelopes owners will get our special gift on 29/1.**`
  }
  await community.createUserEnvelop({
    user_id: authorId,
    command,
  })
  return composeEmbedMessage(null, {
    title: `${getEmoji("TOUCH")} Happy Lunar New Year`,
    color: "#fb0a06",
    description,
  })
}
