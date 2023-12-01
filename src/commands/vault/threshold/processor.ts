import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError } from "errors"
import { getEmoji, msgColors } from "utils/common"
import { getSlashCommand } from "utils/commands"

export async function runCreateThreshold({
  i,
  guildId,
}: {
  i: CommandInteraction
  guildId?: string | null
}) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: i })
  }

  const name = i.options.getString("name", true)
  const threshold = i.options.getString("threshold", true)
  const {
    data,
    ok,
    status = 500,
    curl,
    error,
    log,
  } = await config.createVaultConfigThreshold({
    guild_id: guildId,
    name,
    threshold,
  })
  if (!ok) {
    if (status == 404) {
      throw new InternalError({
        msgOrInteraction: i,
        title: "Command error",
        description: error,
      })
    }
    throw new APIError({ curl, error, description: log, status })
  }

  const description = `**${
    data.name
  }** has been configured vault threshold of \`${threshold}%\` for approval\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true,
  )} Set or change vault threshold by run ${await getSlashCommand(
    "vault config threshold",
  )}`

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CHECK")} Vault threshold successfully changed${getEmoji(
      "BLANK",
    ).repeat(5)}`,
    description: description,
    color: msgColors.BLUE,
    thumbnail:
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090906036464005240/image.png",
  })

  return { messageOptions: { embeds: [embed] } }
}
