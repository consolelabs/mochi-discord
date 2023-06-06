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

export const pagination = () => [
  new MessageActionRow().addComponents([
    new MessageButton({
      label: "Server",
      style: "SECONDARY",
      emoji: getEmoji("MOCHI_CIRCLE"),
      customId: "server",
    }),
    new MessageButton({
      label: "User",
      style: "SECONDARY",
      emoji: getEmoji("MOCHI_CIRCLE"),
      customId: "user",
    }),
  ]),
]

export async function renderSetting(embed: MessageEmbed, page: string) {
  if (page == "server") {
    embed.author = {
      name: "Welcome to Server Setting!",
      iconURL: thumbnails.MOCHI,
    }
    embed.addFields(
      {
        name: "Dao",
        value: `<:_:1110865581617463346> ${await getSlashCommand(
          "welcome message"
        )} Config your welcome message to new member`,
        inline: false,
      },
      {
        name: "Pay",
        value: [
          `<:_:1110865581617463346> ${await getSlashCommand(
            "config currency"
          )} Config default currency for your server`,
          `<:_:1093577916434104350> ${await getSlashCommand(
            "config tiprange"
          )} Config the amount range of USD that can be tipped`,
          `<a:_:902558994437144646> ${await getSlashCommand(
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
        value: `<:_:1110865581617463346> ${await getSlashCommand(
          "default ticker"
        )} Config your default token for your server`,
        inline: false,
      }
    )
  } else if (page == "user") {
    embed.author = {
      name: "Welcome to User Setting!",
      iconURL: thumbnails.MOCHI,
    }
    embed.addFields(
      {
        name: "Social",
        value: [
          `<:_:1110865581617463346> Twitter Connect Twitter account with Discord`,
          `<:_:1093577916434104350> ${await getSlashCommand(
            "telegram"
          )} Connect Telegram account with Discord`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "Wallet",
        value: `<:_:1110865581617463346> ${await getSlashCommand(
          "wallet add"
        )} Connect your wallet with discord`,
        inline: false,
      }
    )
  }
}
