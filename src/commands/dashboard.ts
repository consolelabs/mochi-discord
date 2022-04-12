import { Command } from "commands"
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} from "discord.js"
import {
  getHeader,
  workInProgress,
  composeSimpleSelection,
  getEmbedFooter,
  getEmoji,
} from "utils/discord"

const command: Command = {
  id: "dashboard",
  command: "dashboard",
  name: "Dashboard",
  category: "Profile",
  run: async function (msg) {
    const embed = new MessageEmbed()
      .setTitle("Dashboard")
      .setDescription(
        `Access to your portfolio, transaction history and many more!${composeSimpleSelection(
          ["View your portfolio", "View your transaction history"]
        )}`
      )
      .setFooter(
        getEmbedFooter(["Type a number to chose", "Type exit to close"]),
        msg.author.avatarURL()
      )
      .setTimestamp()
    const selectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("dashboard_select_menu")
        .setPlaceholder("Make a selection")
        .addOptions([
          {
            emoji: getEmoji("num_1"),
            label: "View your portfolio",
            value: "view_portfolio",
          },
          {
            emoji: getEmoji("num_2"),
            label: "View transaction history",
            value: "view_tx",
          },
        ])
    )
    const exitRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("exit")
        .setStyle("DANGER")
        .setEmoji(getEmoji("exit"))
        .setLabel("Exit")
    )

    return {
      messageOptions: {
        content: getHeader("View your investment!", msg.author),
        embeds: [embed],
        components: [selectRow, exitRow],
      },
    }
  },
  experimental: true,
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  alias: ["dash"],
}

export default command
