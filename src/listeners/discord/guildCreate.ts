import Discord from "discord.js"
import config from "../../adapters/config"
import webhook from "adapters/webhook"
import { logger } from "logger"
import { wrapError } from "utils/wrap-error"
import { composeEmbedMessage } from "ui/discord/embed"
import { DiscordEvent } from "."
import { getEmoji, thumbnails } from "utils/common"
import {
  DEFAULT_BOT_INVITE_URL,
  HOMEPAGE_URL,
  MOCHI_SERVER_INVITE_URL,
} from "utils/constants"
import { getSlashCommand } from "utils/commands"
import { eventAsyncStore } from "utils/async-storages"

const event: DiscordEvent<"guildCreate"> = {
  name: "guildCreate",
  once: false,
  execute: async (guild) => {
    logger.info(
      `Joined guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    )

    const metadata = {
      sub_event_type: "guildCreate",
      guild_id: guild.id,
    }
    eventAsyncStore.run(
      {
        data: JSON.stringify(metadata),
      },
      async () => {
        await wrapError(metadata, async () => {
          await config.createGuild(guild.id, guild.name)
          await webhook.pushDiscordWebhook("guildCreate", {
            guild_id: guild.id,
          })
          await introduceMochiToAdmin(guild)
        })
      }
    )
  },
}

export default event

async function introduceMochiToAdmin(guild: Discord.Guild) {
  if (guild.systemChannel) {
    const embed = composeEmbedMessage(null, {
      author: ["mochi.gg", thumbnails.MOCHI],
      title: `Hi ${guild.name} has joined Mochi!`,
      description: `Thank you for using Mochi Bot to build your community! Mochi is a Web3 Bot that empowers you to automate your server on Discord — so you can move forward, faster\nYou might just be staring at an empty server. Discord is all about community, but the community doesn’t just appear out of thin air; you have to build it. Mochi gives you some tips to start the optimal community. `,
      color: `0xFCD3C1`,
      thumbnail: thumbnails.ROCKET,
    })
    embed.setFields(
      {
        name: "Start Here",
        value: `${getEmoji("CONFIG")} Run ${await getSlashCommand(
          "admin"
        )} to display some tips for building your server\n${getEmoji(
          "ANIMATED_QUESTION_MARK",
          true
        )} Run </help:1062577076722466889> to explore all commands`,
      },
      {
        name: "Features",
        value: [
          [getEmoji("WEB"), "DAO Management"],
          [getEmoji("NFT2"), "NFTs"],
        ]
          .map((v) => `${v[0]} ${v[1]}`)
          .join("\n"),
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: "\u200b",
        value: [
          [getEmoji("SWAP_ROUTE"), "Crypto Utilities"],
          [getEmoji("TREASURER"), "Social"],
        ]
          .map((v) => `${v[0]} ${v[1]}`)
          .join("\n"),
        inline: true,
      },
      {
        name: "\u200b",
        value: `[→ Join our server](${MOCHI_SERVER_INVITE_URL})`,
        inline: true,
      },
      {
        name: "\u200b",
        value: `[→ Invite the bot](${DEFAULT_BOT_INVITE_URL})`,
        inline: true,
      },
      {
        name: "\u200b",
        value: `[→ Visite our web](${HOMEPAGE_URL})`,
        inline: true,
      }
    )
    await guild.systemChannel
      .send({
        embeds: [embed],
      })
      .catch(() => null)
  }
}
