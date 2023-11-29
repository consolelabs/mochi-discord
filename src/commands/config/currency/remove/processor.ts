import config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function runCurrencyRemove(guildId: string | null) {
  if (!guildId) {
    throw new GuildIdNotFoundError({})
  }

  const infoRes = await config.getDefaultCurrency(guildId)

  if (!infoRes.ok) {
    throw new APIError({
      curl: infoRes.curl,
      description: infoRes.log,
      status: infoRes.status ?? 500,
    })
  }

  if (!infoRes.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config found",
            description: `No default currency to remove, to set one run ${await getSlashCommand(
              "config currency set",
            )}`,
          }),
        ],
      },
    }
  }

  const res = await config.deleteDefaultCurrency(guildId)
  if (!res.ok) {
    throw new APIError({
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
    })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Currency removed",
          description: `Default currency removed`,
        }),
      ],
    },
  }
}
