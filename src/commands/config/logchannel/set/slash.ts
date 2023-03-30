import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { TextChannel } from "discord.js"
import { embedsColors, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { setLogChannel, setOffchainTip } from "./processor"

const slashCmd: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Setup what type of log goes to which channel")
      .addStringOption((option) =>
        option
          .setName("log_type")
          .setDescription("The log type that would be sent to the channel")
          .setChoices([
            ["Tip", "tip"],
            ["Level Up", "level_up"],
            ["Gm/Gn", "gm_gn"],
          ])
          .setRequired(true)
      )
      .addChannelOption((option) =>
        option
          .setName("log_channel")
          .setDescription("The channel that will receive the logs")
          .setRequired(true)
          .addChannelType(0)
      )

    return data
  },
  run: async function (i) {
    const logType = i.options.getString("log_type", true)
    const logChannel = i.options.getChannel("log_channel", true) as TextChannel

    const formatOutput = {
      activity: "",
      channel: logChannel,
    }

    switch (logType) {
      case "tip":
        formatOutput.activity = "Tipping"
        await setOffchainTip(i, logChannel.id)
        break
      case "level_up":
        formatOutput.activity = "Level Up"
        await setLogChannel(i, logChannel.id)
        break
      case "gm_gn":
        formatOutput.activity = "GM/GN message"
        await setLogChannel(i, logChannel.id)
        break
      default:
        break
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            color: embedsColors.Wallet,
            author: [
              "The log channel was successfully set",
              "https://cdn.discordapp.com/emojis/1077631110047080478.webp?size=240&quality=lossless",
            ],
            thumbnail:
              "https://media.discordapp.net/attachments/1052079279619457095/1090579158482038814/menu.png?width=322&height=320",
            description: `All ${formatOutput.activity} activities of **${
              i.guild?.name
            }** will be monitored in the\n${formatOutput.channel}\n\n${getEmoji(
              "pointingright"
            )} Setup or change config by running \`/config logchannel set\`\n${getEmoji(
              "pointingright"
            )} Use \`/config logchannel info\` to see more details`,
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
