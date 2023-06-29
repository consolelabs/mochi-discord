import { Guild } from "discord.js"
import config from "../../adapters/config"
import webhook from "adapters/webhook"
import { logger } from "logger"
import { wrapError } from "utils/wrap-error"
import { composeEmbedMessage } from "ui/discord/embed"
import { DiscordEvent } from "."
import { getEmoji, msgColors, thumbnails } from "utils/common"
import {
  DEFAULT_BOT_INVITE_URL,
  DOT,
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

async function introduceMochiToAdmin(guild: Guild) {
  if (guild.systemChannel) {
    const embed = composeEmbedMessage(null, {
      author: [`Hi moderators of ${guild}`, thumbnails.MOCHI],
      description: `Thank you for using Mochi Bot to build your community! Mochi is a Web3 Bot that empowers you to automate your server on Discord — so you can move forward, faster.`,
      color: msgColors.BLUE,
      thumbnail: guild.iconURL(),
    })

    embed.setFields(
      {
        name: `${getEmoji("CONFIG")} Start Here`,
        value: [
          `${DOT} ${await getSlashCommand(
            "setup"
          )} to let Mochi automatically bootstrap your server with all neccessary configs. You can always change this later.`,
          `${DOT} ${await getSlashCommand(
            "quest-init"
          )} to setup latest quests`,
          `${DOT} ${await getSlashCommand(
            "dao-init"
          )} creates DAO related configs`,
          `${DOT} ${await getSlashCommand(
            "integrate"
          )} integrate with any token (fungile or non-fungile) and get monitoring metris (buy/sell, txns, hodlers, etc...)`,
        ].join("\n"),
        inline: false,
      },
      {
        name: `${getEmoji("ANIMATED_STAR", true)} Where Mochi shines`,
        value: [
          `${DOT} DAO management`,
          `${DOT} Token ticker`,
          `${DOT} Crypto utilities (tip, swap, airdrop, etc...)`,
          `${DOT} Drive engagement`,
          `${DOT} Snipe earning opportunities`,
        ].join("\n"),
        inline: false,
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
        value: `[→ Visit our web](${HOMEPAGE_URL})`,
        inline: true,
      }
    )

    guild.systemChannel
      .send({
        embeds: [embed],
      })
      .catch(() => null)
  }
}
