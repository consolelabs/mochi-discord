import { registerFont } from "canvas"
import { MessageOptions, GuildMember } from "discord.js"
import { emojis, getEmojiURL, msgColors } from "./common"
import { composeEmbedMessage } from "./discordEmbed"

registerFont("src/assets/DelaGothicOne-Regular.ttf", {
  family: "Dela Gothic One",
})

export async function composeLevelUpMessage(
  author: GuildMember,
  level: number,
  xp: number
): Promise<MessageOptions> {
  const role =
    author.roles.highest.name !== "@everyone"
      ? author.roles.highest.name
      : "N/A"
  const description = `<@${author.user.id}> has leveled up **(${
    level - 1
  } - ${level})**\n\n**XP: **${xp}\n**Role: **${role}`
  return {
    embeds: [
      composeEmbedMessage(null, {
        color: msgColors.PROFILE,
        author: ["Level up!", getEmojiURL(emojis.SPARKLE)],
        description,
        thumbnail: author.displayAvatarURL({ format: "png" }),
        withoutFooter: true,
      }),
    ],
  }
}
