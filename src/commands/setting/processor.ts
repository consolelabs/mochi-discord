import { MessageActionRow, MessageButton } from "discord.js"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { getSlashCommand } from "utils/commands"
import { composeEmbedMessage } from "ui/discord/embed"

export enum SettingTab {
  User = "user",
  Server = "server",
}

function addBullet(str: string) {
  return `▪︎ ${str}`
}

const pagination = (currentTab: SettingTab) =>
  new MessageActionRow().addComponents([
    new MessageButton({
      label: "User",
      style: "SECONDARY",
      emoji: getEmoji("MOCHI_CIRCLE"),
      customId: "view_user_setting",
      disabled: currentTab === SettingTab.User,
    }),
    new MessageButton({
      label: "Server",
      style: "SECONDARY",
      emoji: getEmoji("ANIMATED_BADGE_1", true),
      customId: "view_server_setting",
      disabled: currentTab === SettingTab.Server,
    }),
  ])

export async function renderSetting(tab: SettingTab = SettingTab.User) {
  const embed = composeEmbedMessage(null, {})
  if (tab === SettingTab.User) {
    embed.setDescription(
      [
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Profile includes your Mochi ID and email.`,
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Connections contain your social accounts and CEX/DEXes.`,
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Developer holds the api key for Mochi API`,
      ].join("\n") + "\n\u200b"
    )
    embed.setAuthor({
      name: "User setting",
      iconURL: getEmojiURL(emojis.MOCHI_CIRCLE),
    })
    embed.addFields(
      {
        name: `:identification_card: **PROFILE**`,
        value: [
          await getSlashCommand("update profile"),
          await getSlashCommand("update email"),
        ]
          .map(addBullet)
          .join("\n"),
        inline: true,
      },
      {
        name: `:link: **CONNECTIONS**`,
        value: [
          await getSlashCommand("update binance"),
          await getSlashCommand("update coinbase"),
          await getSlashCommand("update twitter"),
          await getSlashCommand("update telegram"),
        ]
          .map(addBullet)
          .join("\n"),
        inline: true,
      },
      { name: "\u200b", value: "\u200b", inline: true },
      {
        name: `${getEmoji("ANIMATED_VAULT_KEY", true)} **DEVELOPER**`,
        value: [await getSlashCommand("update apikey")]
          .map(addBullet)
          .join("\n"),
        inline: true,
      }
    )
  } else {
    embed.setDescription(
      [
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Default commands are used incase of duplication symbols/tickers.`,
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} DAO will assit you in running your own DAOs.`,
        `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Pay will affect all monetary commands.`,
      ].join("\n") + "\n\u200b"
    )
    embed
      .setAuthor({
        name: "Server setting",
        iconURL: getEmojiURL(emojis.MOCHI_CIRCLE),
      })
      .addFields(
        {
          name: `${getEmoji("ANIMATED_VAULT", true)} **DAO**`,
          value: [
            `${await getSlashCommand("welcome message")} for new members`,
            `${await getSlashCommand(
              "proposal track"
            )} voting rounds on Snapshot.`,
            `${await getSlashCommand("vault new")} for guild.`,
          ]
            .map(addBullet)
            .join("\n"),
          inline: false,
        },
        {
          name: `${getEmoji("ANIMATED_MONEY", true)} **PAY**`,
          value: [
            `${await getSlashCommand("config currency")}`,
            `${await getSlashCommand("config tiprange")} amount in USD`,
            `${await getSlashCommand(
              "moniker set"
            )} \`beer\`, \`pizza\`, etc...`,
          ]
            .map(addBullet)
            .join("\n"),
          inline: false,
        },
        {
          name: `${getEmoji("PROPOSAL")} **LOG**`,
          value: [
            `${await getSlashCommand(
              "config logchannel set"
            )} for all activities`,
          ]
            .map(addBullet)
            .join("\n"),
          inline: true,
        },
        {
          name: `${getEmoji("CHART")} **TICKER**`,
          value: [`${await getSlashCommand("default ticker")}`]
            .map(addBullet)
            .join("\n"),
          inline: true,
        }
      )
  }
  return {
    msgOpts: {
      embeds: [embed],
      components: [pagination(tab)],
    },
  }
}
