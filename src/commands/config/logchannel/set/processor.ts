import config from "adapters/config"
import defi from "adapters/defi"
import community from "adapters/community"
import { CommandInteraction } from "discord.js"

export async function setOffchainTip(
  i: CommandInteraction,
  channel_id: string
) {
  if (!i.guildId) return
  await defi.createConfigNofityTransaction({
    guild_id: i.guildId,
    channel_id,
    token: "all",
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
  await community.setLevelMessageConfig({
    guild_id: i.guildId,
    channel_id: logChannel,
    message: "Congratulation on leveling up",
  })
}

export async function setGmGnMessageChannel(
  i: CommandInteraction,
  logChannel: string
) {
  if (!i.guildId) return
  await config.updateGmConfig({
    guild_id: i.guildId,
    channel_id: logChannel,
  })
}
