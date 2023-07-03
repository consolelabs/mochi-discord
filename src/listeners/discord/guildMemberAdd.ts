import { DiscordEvent } from "."
import Discord from "discord.js"
import config from "adapters/config"
import { logger } from "logger"
import client from "index"
import { getEmoji, roundFloatNumber } from "utils/common"
import { wrapError } from "utils/wrap-error"
import { createBEGuildMember } from "types/webhook"
import webhook from "adapters/webhook"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { eventAsyncStore } from "utils/async-storages"
import { getSlashCommand } from "utils/commands"

const event: DiscordEvent<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  once: false,
  execute: (member) => {
    const metadata = {
      sub_event_type: "guildMemberAdd",
      guild_id: member.guild.id,
      discord_id: member.user.id,
    }

    eventAsyncStore.run(
      {
        data: JSON.stringify(metadata),
      },
      async () => {
        await wrapError(metadata, async () => {
          await setUserDefaultRoles(member)

          await welcomeNewMember(member)

          await webhook.pushDiscordWebhook(
            "guildMemberAdd",
            createBEGuildMember(member)
          )
        })
      }
    )
  },
}

export default event

async function setUserDefaultRoles(member: Discord.GuildMember) {
  const { ok, data } = await config.getCurrentDefaultRole(member.guild.id)
  if (ok && data.role_id) {
    await member.roles.add(data.role_id)
  }
}

export async function welcomeNewMember(member: Discord.GuildMember) {
  const welcomeChannel = await config.getCurrentWelcomeConfig(member.guild.id)
  if (!welcomeChannel.ok || !welcomeChannel.data) return

  const configData = welcomeChannel.data
  if (!configData.channel_id || !configData.guild_id) {
    logger.warn(
      `[guildMemberAdd/${member.guild.id}] - welcome channel configs invalid`
    )
    return
  }

  // channel id returned but cannot find in guild
  const chan = await client.channels
    .fetch(configData.channel_id)
    .catch(() => null)
  if (!chan) {
    const guild = await config.getGuild(member.guild.id)
    if (!guild) {
      logger.warn(
        `[guildMemberAdd/${member.guild.id}] - failed to get guild data`
      )
      return
    }

    const logChannel = member.guild.channels.cache.find(
      (channel) => channel.id === guild?.log_channel_id
    )
    if (logChannel?.isText()) {
      logChannel.send({
        embeds: [
          getErrorEmbed({
            description: "Welcome channel not found",
          }),
        ],
      })
    }
    return
  }

  const welcomeEmbed = async (dmEnabled = true, isDM = false) =>
    composeEmbedMessage(null, {
      author: [`Hello ${member.user.username}!`, member.guild.iconURL()],
      description: [
        `<:_:1101450535346913360> Welcome to **${member.guild}** community.`,
        ...(isDM || !dmEnabled
          ? [
              `This server is powered by ${getEmoji(
                "MOCHI_CIRCLE"
              )} Mochi Bot which grants you access to crypto utilities such as:`,
            ]
          : []),
        ...(isDM || !dmEnabled
          ? [
              `${getEmoji("CHART")} ${await getSlashCommand(
                "ticker"
              )} Token chart data`,
              `${getEmoji("SWAP_ROUTE")} ${await getSlashCommand(
                "swap"
              )} Swap tokens without leaving Discord`,
              `${getEmoji("CASH")} ${await getSlashCommand(
                "wlv"
              )} Token watchlist`,

              `...and much more!`,
            ]
          : []),
        getEmoji("LINE").repeat(10),
        `${getEmoji("ANIMATED_POINTING_RIGHT", true)} To get started:`,
        `${getEmoji("NUM_1")} Run ${await getSlashCommand(
          "profile"
        )} in guild will get you setup with wallets and stuff.`,
        `${getEmoji("NUM_2")} Run ${await getSlashCommand(
          "balance"
        )} to see the newly created wallets.`,
        ...(!isDM
          ? [
              `${getEmoji("NUM_3")} Explore more cmds: ${await getSlashCommand(
                "tip"
              )}, ${await getSlashCommand("swap")}, ${await getSlashCommand(
                "watchlist view"
              )}, etc...`,
            ]
          : []),
      ].join("\n"),
      thumbnail: member.guild.iconURL(),
      footer: ["/profile to get started"],
      image:
        "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png",
    })

  if (chan.isText()) {
    if (configData.welcome_message) {
      const welcomeMsg = configData.welcome_message
        .replaceAll("$name", `<@${member.id}>`)
        .replaceAll("@name", `<@${member.id}>`)
        .replaceAll(`\\n`, "\n")
      chan.send({ content: welcomeMsg })
    } else {
      let dmEnabled = true

      await member
        .send({
          embeds: [await welcomeEmbed(true, true)],
        })
        .catch(() => (dmEnabled = false))

      chan.send({ embeds: [await welcomeEmbed(dmEnabled, false)] })
    }
  }
}

export const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("ANIMATED_CHART_INCREASE", true)
      : change === 0
      ? ""
      : getEmoji("ANIMATED_CHART_DECREASE", true)
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}
