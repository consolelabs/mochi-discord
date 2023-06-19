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

function addSoon(str: string) {
  return `${str} <:_:1119167625914748968>`
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
          .map(addSoon)
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
          .map(addSoon)
          .join("\n"),
        inline: true,
      },
      { name: "\u200b", value: "\u200b", inline: true },
      {
        name: `${getEmoji("ANIMATED_VAULT_KEY", true)} **DEVELOPER**`,
        value: [await getSlashCommand("update apikey")]
          .map(addBullet)
          .map(addSoon)
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
          name: `${getEmoji("HAMMER")} **SERVER**`,
          value: [
            `${await getSlashCommand("verify set")} for verification`,
            `${await getSlashCommand("welcome message")} for new members`,
          ]
            .map(addBullet)
            .join("\n"),
          inline: false,
        },
        {
          name: `${getEmoji("ANIMATED_VAULT", true)} **DAO**`,
          value: [
            `${await getSlashCommand(
              "proposal track"
            )} voting rounds on Snapshot.`,
            `${await getSlashCommand(
              "vault list"
            )} available DAOs within your guild.`,
            `${await getSlashCommand("vault treasurer add")} new members.`,
          ]
            .map(addBullet)
            .join("\n"),
          inline: false,
        },
        {
          name: `${getEmoji("WALLET_2")} **PAY**`,
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
          name: `**ROLE**`,
          value: [
            `${await getSlashCommand("nftrole list")} grant role base on nfts.`,
            `${await getSlashCommand(
              "tokenrole list"
            )} grant role base on tokens.`,
            `${await getSlashCommand(
              "defaultrole info"
            )} grant role for new members.`,
            `${await getSlashCommand("levelrole list")} grant role base on xp`,
            `${await getSlashCommand(
              "reactionrole list"
            )} grant role upon reaction`,
            `${await getSlashCommand("mixrole list")} advance role mix`,
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
          name: `${getEmoji("ANIMATED_CHART_INCREASE", true)} **TICKER**`,
          value: [`${await getSlashCommand("default ticker info")}`]
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
