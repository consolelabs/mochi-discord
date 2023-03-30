import config from "adapters/config"
import defi from "adapters/defi"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"

export default async function (i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const guildCfg = await config.getGuild(i.guildId)
  if (!guildCfg) {
    throw new Error(`Guild ${i.guildId} not found`)
  }

  const tipCfg = await defi.getListConfigNofityTransaction({
    guild_id: i.guildId,
  })

  if (!tipCfg.ok) {
    throw new APIError({
      msgOrInteraction: i,
      curl: tipCfg.curl,
      description: tipCfg.log,
    })
  }

  const tipCfgData = tipCfg.data as { channel_id: string }[]

  return {
    Tipping: tipCfgData.map((tcd) => tcd.channel_id),
    "Level Up": [guildCfg.log_channel],
    "GM/GN Message": [guildCfg.log_channel],
  }
}
