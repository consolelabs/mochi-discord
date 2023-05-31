import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { MessageEmbed } from "discord.js"
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

  const { data, ok, status, curl, error, log } =
    await config.createVaultConfigThreshold({
      guild_id: guildId,
      name: i.options.getString("name", true),
      threshold: i.options.getString("value", true),
    })
  if (!ok) {
    if (status == 404) {
      throw new InternalError({
        msgOrInteraction: i,
        title: "Command error",
        description: error,
      })
    }
    throw new APIError({ curl, error, description: log })
  }

  const description = `**${
    data.name
  }** has been configured vault threshold of \`${i.options.getString(
    "value",
    true
  )}%\` for approval\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} Set or change vault threshold by run ${await getSlashCommand(
    "vault config threshold"
  )}`
  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji("CHECK")} Vault threshold successfully changed${getEmoji(
        "BLANK"
      ).repeat(5)}`
    )
    .setDescription(description)
    .setColor(msgColors.BLUE)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090906036464005240/image.png"
    )

  return { messageOptions: { embeds: [embed] } }
}
