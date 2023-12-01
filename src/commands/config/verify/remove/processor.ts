import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function runVerifyRemove(guildId: string | null) {
  if (!guildId) {
    throw new GuildIdNotFoundError({})
  }

  const infoRes = await community.getVerifyWalletChannel(guildId)

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
            description:
              "No verify channel to remove, to set one run `$verify set`",
          }),
        ],
      },
    }
  }

  const res = await community.deleteVerifyWalletChannel(guildId)
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
          title: "Channel removed",
          description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running ${await getSlashCommand(
            "config verify set",
          )}`,
        }),
      ],
    },
  }
}
