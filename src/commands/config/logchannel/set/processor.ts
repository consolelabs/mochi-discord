import config from "adapters/config"
import { CommandInteraction } from "discord.js"

export async function setOffchainTip(
  i: CommandInteraction,
  channel_id: string
) {
  if (!i.guildId) return
  await config.setLogchannel(i.guildId, {
    channel_id,
    log_type: "tip",
  })
}

export async function setLogChannel(i: CommandInteraction, logChannel: string) {
  if (!i.guildId) return
  await config.updateGuild({ guildId: i.guildId, logChannel })
}

export async function setLevelMessageChannel(
  i: CommandInteraction,
  logChannel: string
) {
  if (!i.guildId) return
  await config.setLogchannel(i.guildId, {
    channel_id: logChannel,
    log_type: "level",
  })
}

export async function setGmGnMessageChannel(
  i: CommandInteraction,
  logChannel: string
) {
  if (!i.guildId) return
  await config.setLogchannel(i.guildId, {
    channel_id: logChannel,
    log_type: "gm",
  })
}
