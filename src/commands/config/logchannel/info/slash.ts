import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { embedsColors, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
import get from "./processor"

const slashCmd: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("View logchannel config")

    return data
  },
  run: async function (i) {
    const config = await get(i)
    const isEmpty = Object.values(config).flat().length === 0
    const list = Object.entries(config)
      ?.map(
        (c) =>
          `\`${c[0]}\`\n${
            c[1].filter(Boolean).length === 0
              ? `${getEmoji("blank")}${getEmoji("reply")} No channel found`
              : c[1]
                  .filter(Boolean)
                  .map(
                    (channelId) =>
                      `${getEmoji("blank")}${getEmoji("reply")}<#${channelId}>`
                  )
                  .join("\n")
          }`
      )
      .join("\n\n")

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            color: embedsColors.Profile,
            author: [
              "Log Channel Info",
              "https://cdn.discordapp.com/emojis/1090477901725577287.webp?size=240&quality=lossless",
            ],
            thumbnail:
              "https://cdn.discordapp.com/attachments/1052079279619457095/1090587614450565140/logchannel_info.png",
            description: `Log channel is a place to keep all records of every user’s activity and interaction with Mochi bot.That way, we can better monitor and support guild members' activities from withdrawal, airdrop, role assignment, and many more!\n\n${
              isEmpty ? "`Not Set`" : list
            }\n\n${getEmoji(
              "ANIMATED_POINTING_RIGHT", true
            )} Setup or change config by running \`/config logchannel set\`\n${getEmoji(
              "ANIMATED_POINTING_RIGHT", true
            )} Use \`/config logchannel info\` to see more details\n[Read instructions](${HOMEPAGE_URL}) for a complete setup guide`,
          }),
        ],
      },
    }
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default slashCmd
