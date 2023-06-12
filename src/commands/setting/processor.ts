import { MessageActionRow, MessageButton, User, MessageEmbed } from "discord.js"
import { getEmoji, thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export type PageType = "server" | "user"

export const defaultPageType = "server"

export function getSettingEmbed(user: User) {
  return composeEmbedMessage(null, {
    originalMsgAuthor: user,
  })
}

export const pagination = (selectedPage: PageType) => [
  new MessageActionRow().addComponents([
    new MessageButton({
      label: "Server",
      style: "SECONDARY",
      emoji: getEmoji("ANIMATED_BADGE_1", true),
      customId: "server",
      disabled: selectedPage === "server",
    }),
    new MessageButton({
      label: "User",
      style: "SECONDARY",
      emoji: getEmoji("MOCHI_CIRCLE"),
      customId: "user",
      disabled: selectedPage === "user",
    }),
  ]),
]

export async function renderSetting(embed: MessageEmbed, page: string) {
  if (page == "server") {
    embed.author = {
      name: "Server Setting",
      iconURL: thumbnails.MOCHI,
    }
    embed.description = `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Server related settings: DAO, PAY, WEB3\n\n`
    embed.addFields(
      {
        name: "DAO",
        value: [
          `${getEmoji("ANIMATED_CHAT", true)} ${await getSlashCommand(
            "welcome message"
          )} Config your welcome message to new member`,
          `📜 ${await getSlashCommand(
            "proposal track"
          )} Set up a tracker of proposal voting rounds on Snapshot.`,
          `${getEmoji("ANIMATED_OPEN_VAULT", true)} ${await getSlashCommand(
            "vault new"
          )} Set vault for guild.`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "Pay",
        value: [
          `${getEmoji("ANIMATED_COIN_1", true)} ${await getSlashCommand(
            "config currency"
          )} Config default currency for your server`,
          `${getEmoji("ANIMATED_COIN_2", true)} ${await getSlashCommand(
            "config tiprange"
          )} Config the amount range of USD that can be tipped`,
          `${getEmoji("ANIMATED_COIN_3", true)} ${await getSlashCommand(
            "moniker set"
          )} Config your moniker`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "Log",
        value: `<:_:1110865581617463346> ${await getSlashCommand(
          "config logchannel set"
        )} Config your log channel`,
        inline: false,
      },
      {
        name: "Ticker",
        value: `${getEmoji("ANIMATED_TOKEN_ADD", true)} ${await getSlashCommand(
          "default ticker"
        )} Config your default token for your server`,
        inline: false,
      }
    )
  } else if (page == "user") {
    embed.author = {
      name: "User Setting",
      iconURL: thumbnails.MOCHI,
    }
    embed.description = `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} Setting for user related features. Connect to social platform, like twitter, telegram.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )}This will be affected in all server\n\n`
    embed.addFields(
      {
        name: "Social",
        value: [
          `${getEmoji("TWITTER")} Twitter Connect Twitter account with Discord`,
          `${getEmoji("TELEGRAM")} ${await getSlashCommand(
            "telegram"
          )} Connect Telegram account with Discord`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "Wallet",
        value: [
          `${getEmoji("WALLET_1")} ${await getSlashCommand(
            "wallet add"
          )} Connect your wallet with discord`,
          `${getEmoji("BINANCE")} ${await getSlashCommand(
            "binance"
          )} Connect your Binance account with discord`,
        ].join("\n"),
        inline: false,
      }
    )
  }
}
