import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"

export async function set(i: CommandInteraction, symbol: string) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const { ok: getOk, data: currentData } = await config.getDefaultCurrency(
    i.guildId,
  )

  let was
  if (getOk) {
    was = {
      symbol:
        currentData != null ? currentData.tip_bot_token?.token_symbol : "",
      name: currentData != null ? currentData.tip_bot_token?.token_name : "",
    }
  }

  const {
    ok: setOk,
    curl: setCurl,
    log: setLog,
    status = 500,
    error,
  } = await config.setDefaultCurrency({ symbol, guild_id: i.guildId })

  if (!setOk) {
    throw new APIError({
      msgOrInteraction: i,
      curl: setCurl,
      description: setLog,
      status,
      error,
    })
  }

  const { ok: newOk, data: newData } = await config.getDefaultCurrency(
    i.guildId,
  )

  let now
  if (newOk) {
    now = {
      symbol: newData.tip_bot_token?.token_symbol,
      name: newData.tip_bot_token?.token_name,
    }
  }

  return {
    was,
    now,
  }
}
