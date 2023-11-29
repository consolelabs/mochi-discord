import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"

export default async function (i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const levelUpCfg = await config.getLogchannel(i.guildId, "level")
  if (!levelUpCfg.ok) {
    throw new APIError({
      msgOrInteraction: i,
      curl: levelUpCfg.curl,
      description: levelUpCfg.log,
      status: levelUpCfg.status ?? 500,
    })
  }

  const gmCfg = await config.getLogchannel(i.guildId, "gm")
  if (!gmCfg.ok) {
    throw new APIError({
      msgOrInteraction: i,
      curl: gmCfg.curl,
      description: gmCfg.log,
      status: gmCfg.status ?? 500,
    })
  }

  const tipCfg = await config.getLogchannel(i.guildId, "tip")
  if (!tipCfg.ok) {
    throw new APIError({
      msgOrInteraction: i,
      curl: tipCfg.curl,
      description: tipCfg.log,
      status: tipCfg.status ?? 500,
    })
  }

  const tipCfgData = tipCfg.data as { channel_id: string }[]
  const levelUpCfgData = levelUpCfg.data as { channel_id: string }[]
  const gmCfgData = gmCfg.data as { channel_id: string }[]

  return {
    Tipping: tipCfgData.map((tcd) => tcd.channel_id),
    "Level Up": levelUpCfgData.map((lucd) => lucd.channel_id),
    "GM/GN Message": gmCfgData.map((gmcd) => gmcd.channel_id),
  }
}
