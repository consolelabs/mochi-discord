import config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function runTipRangeRemove(guildId: string | null) {
  if (!guildId) {
    throw new GuildIdNotFoundError({})
  }

  const infoRes = await config.getTipRangeConfig(guildId)

  if (!infoRes.ok) {
    throw new APIError({
      curl: infoRes.curl,
      description: infoRes.log,
      status: infoRes.status ?? 500,
      error: infoRes.error,
    })
  }

  if (!infoRes.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config found",
            description: `No tip range to remove, to set one run ${await getSlashCommand(
              "config tiprange set",
            )}`,
          }),
        ],
      },
    }
  }

  const res = await config.deleteTipRangeConfig(guildId)
  if (!res.ok) {
    throw new APIError({
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Tip range",
          description: `Min and max tip removed`,
        }),
      ],
    },
  }
}
