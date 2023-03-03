import { CommandInteraction } from "discord.js"
import { getEmoji } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { renderLeaderboard } from "./processor"
import community from "adapters/community"

const run = async (interaction: CommandInteraction) => {
  if (!interaction.guildId) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `This command must be run in a Guild`,
          }),
        ],
      },
    }
  }

  const pageStr = interaction.options.getString("page")
  let page = pageStr ? +pageStr : 0
  page = Math.max(isNaN(page) ? 0 : page - 1, 0)

  const res = await community.getTopXPUsers(
    interaction.guildId,
    interaction.user.id,
    page,
    10
  )
  if (!res.ok || !res.data.leaderboard || !res.data.leaderboard.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: interaction.guild?.name ?? "Ranking",
            description: "No ranking data found",
            originalMsgAuthor: interaction?.user,
          }),
        ],
      },
    }

  const { author, leaderboard } = res.data
  const blank = getEmoji("blank")
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("cup")} ${interaction.guild?.name}'s Web3 rankings`,
    thumbnail: interaction.guild?.iconURL(),
    description: `${blank}**Your rank:** #${author.guild_rank}\n${blank}**XP:** ${author.total_xp}\n\u200B`,
    image: "attachment://leaderboard.png",
    originalMsgAuthor: interaction?.user,
    color: "#FCD3C1",
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderLeaderboard(interaction.guild, leaderboard)],
    },
  }
}
export default run
