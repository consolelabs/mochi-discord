import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"

export default async function (i: CommandInteraction) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }
  const { ok, data, error } = await config.getListGuildDefaultTicker(i.guildId)
  if (!ok) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Cannot get default ticker",
      description: error,
    })
  }

  return data
}
