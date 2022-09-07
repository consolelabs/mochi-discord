import { SlashCommandBuilder } from "@discordjs/builders"
import { GuildMember } from "discord.js"
import { SlashCommand } from "types/common"
import { getEmoji, hasAdministrator } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"

function buildProgressBar(progress: number, scale = 1) {
  const list = new Array(Math.ceil(10 * scale)).fill(
    getEmoji("progress_empty_2")
  )
  const filled = list.map((empty, index) => {
    if (index < Math.floor(progress * scale)) {
      return getEmoji("progress_2")
    }
    return empty
  })
  // trim 2 ends
  filled[0] = getEmoji("progress_1")
  filled[filled.length - 1] = getEmoji("progress_empty_3")
  return filled.join("")
}

const command: SlashCommand = {
  name: "vote",
  category: "Community",
  help: async () => {
    return {}
  },
  colorType: "Server",
  prepare: () => {
    return new SlashCommandBuilder()
      .setDescription("Display voting streaks and links to vote")
      .setName("vote")
  },
  run: async function (i) {
    // TODO(tuand): remove this when release prod
    if (!i.member || !hasAdministrator(i.member as GuildMember)) return null

    const embed = composeEmbedMessage(null, {
      title: "Call for Mochians!",
      description:
        "Every 12 hours, help vote Mochi Bot raise to the top.\nYou get rewards, Mochi is happy, it's a win-win.\n\u200b",
      color: "#47ffc2",
      thumbnail:
        "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
    })
    embed.setFields([
      {
        name: `${getEmoji("like")} Vote Available`,
        value:
          "[Click here to vote on top.gg](https://top.gg/bot/963123183131709480/vote)\n\u200b",
        inline: true,
      },
      {
        name: `${getEmoji("like")} Vote Available`,
        value:
          "[Click here to vote on discordbotlist.com](https://discordbotlist.com/bots/mochi-bot/upvote)\n\u200b",
        inline: true,
      },
      {
        name: `${getEmoji("exp")} Reward`,
        value: `Every \`4\` votes, \`+20\` to all factions exp\n\u200b`,
        inline: true,
      },
      {
        name: "Recurring Vote Progress",
        value: `\`01/04\` ${buildProgressBar(2.5)}`,
        inline: false,
      },
      {
        name: `${getEmoji("like")} Voting Streak Buff: \`Tier 0\``,
        value: `${[
          getEmoji("approve"),
          ...new Array(9).fill(getEmoji("approve_grey")),
        ].join(" ")}`,
        inline: false,
      },
    ])

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
}

export default command
