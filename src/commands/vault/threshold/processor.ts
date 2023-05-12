import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"
import { getErrorEmbed } from "ui/discord/embed"
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

  const member = i.member as GuildMember
  if (!hasAdministrator(member)) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "You don't have permission to do this!",
          }),
        ],
      },
    }
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
        title: "Create config threshold request failed",
        description: error,
      })
    }
    throw new APIError({ curl, error, description: log })
  }

  const description = `**${
    data.name
  }** has been configured vault threshold of \`${
    data.threshold
  }%\` for approval\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} Set or change vault threshold by run </vault config threshold:${await getSlashCommand(
    "vault"
  )}>`
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
