import community from "adapters/community"
import { Message } from "discord.js"
import { APIError } from "errors"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { renderLeaderboard } from "./processor"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  let page = args.length > 1 ? +args[1] : 0
  page = Math.max(isNaN(page) ? 0 : page - 1, 0)
  const res = await community.getTopXPUsers(
    msg.guildId || "",
    msg.author.id,
    page,
    10
  )
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }

  const { author, leaderboard } = res.data
  const blank = getEmoji("blank")
  const embed = composeEmbedMessage(msg, {
    title: `${getEmoji("cup")} ${msg.guild?.name}'s Web3 rankings`,
    thumbnail: msg.guild?.iconURL(),
    description: `${blank}**Your rank:** #${author.guild_rank}\n${blank}**XP:** ${author.total_xp}\n\u200B`,
    image: "attachment://leaderboard.png",
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderLeaderboard(msg.guild, leaderboard)],
    },
  }
}
export default run
