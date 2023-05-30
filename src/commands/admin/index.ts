import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmojiURL, msgColors, thumbnails } from "utils/common"
import { DOT, HOMEPAGE_URL } from "utils/constants"

const slashCmd: SlashCommand = {
  name: "admin",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("admin")
      .setDescription("Setup your server")
  },
  onlyAdministrator: true,
  run: async function () {
    const embed = composeEmbedMessage(null, {
      author: ["Setup your server", getEmojiURL(emojis.HAMMER)],
      title: "How can you build a Web3 Discord community?",
      thumbnail: thumbnails.ROCKET,
      color: msgColors.MOCHI,
    })
    embed.setFields(
      {
        name: "Step 1 - Create channels",
        value: [
          `Setup a welcome message to explanin rules and clear up any questions: ${await getSlashCommand(
            "welcome set"
          )}`,
          `Config channel to track member activity: ${await getSlashCommand(
            "config logchannel"
          )}`,
          `Forward any Tweet that contains a user-specified keyword from Twitter to a channel: [\`$poe\`](${HOMEPAGE_URL})`,
          `Setup well-rated posts along with a channel to share these contents automatically: [\`$starboard\`](${HOMEPAGE_URL})`,
          `Setup a vault for the server: ${await getSlashCommand("vault new")}`,
        ]
          .map((b) => `${DOT} ${b}`)
          .join("\n"),
        inline: false,
      },
      {
        name: "Step 2 - Set roles",
        value: [
          `Setup default role for your newcomers: ${await getSlashCommand(
            "defaultrole info"
          )}`,
          `Set different roles for members when reaching a certain level: ${await getSlashCommand(
            "levelrole list"
          )}`,
          `Make reaction roles that allow members to obtain or relinquish a role by reacting: ${await getSlashCommand(
            "reactionrole list"
          )}`,
          `Receive a special role based on the ownership of NFT: ${await getSlashCommand(
            "nftrole list"
          )}`,
          `Assign a specific role through the number of tokens members hold: ${await getSlashCommand(
            "tokenrole list"
          )}`,
          `Combine different conditions to assign role for users: ${await getSlashCommand(
            "mixrole list"
          )}`,
          `Reward their contribution by giving them roles other members don't have: ${await getSlashCommand(
            "xprole list"
          )}`,
        ]
          .map((b) => `${DOT} ${b}`)
          .join("\n"),
        inline: false,
      },
      {
        name: "Step 3 - Manage members",
        value: [
          `Customize level-up message: [\`$levelupmessage\`](${HOMEPAGE_URL})`,
          `Give kudo to outstanding members: ${await getSlashCommand(
            "top"
          )} to show leaderboard, then ${await getSlashCommand("tip")} them`,
        ]
          .map((b) => `${DOT} ${b}`)
          .join("\n"),
        inline: false,
      },
      {
        name: "Step 4 - Give member perks",
        value: [
          `Config GM channel for some fun engagement: ${await getSlashCommand(
            "gm set"
          )}`,
          `DAO voting grants community members a say in community development: use [\`$proposal set\`](${HOMEPAGE_URL})`,
          `List daily quests to get more XP: ${await getSlashCommand(
            "quest daily"
          )}`,
          `Admin can send XP to any users as a way to reward: ${await getSlashCommand(
            "sendxp"
          )}`,
        ]
          .map((b) => `${DOT} ${b}`)
          .join("\n"),
        inline: false,
      },
      {
        name: "Step 5 - Integrate crypto wallet",
        value: [
          `Grant holder access by crypto wallet: ${await getSlashCommand(
            "verify set"
          )}`,
          `Quick catch-up on NFT marketplace: ${await getSlashCommand(
            "sales track"
          )}`,
          `Track crypto and NFT: ${await getSlashCommand(
            "ticker"
          )}, ${await getSlashCommand(
            "watchlist"
          )}, [\`$nft\`](${HOMEPAGE_URL}),`,
          `Send and receive token: ${await getSlashCommand(
            "tip"
          )}, ${await getSlashCommand("deposit")}, ${await getSlashCommand(
            "withdraw"
          )}, ${await getSlashCommand("balances")}, ${await getSlashCommand(
            "airdrop"
          )}`,
          `Config moniker to tip or airdrop: ${await getSlashCommand(
            "moniker set"
          )}`,
        ]
          .map((b) => `${DOT} ${b}`)
          .join("\n"),
        inline: false,
      },
      {
        name: "\u200b",
        value: `Only Administrators can use these commands. If you want others to use these commands, make them administrators. Run the command to build a community with Mochi now!\n\nType ${await getSlashCommand(
          "help"
        )} to explore all features or read our instructions on Gitbook\n[→ Read instructions](https://mochibot.gitbook.io)`,
        inline: false,
      }
    )
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export default { slashCmd }
