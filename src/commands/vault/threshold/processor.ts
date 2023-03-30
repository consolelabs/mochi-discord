import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"
import { getErrorEmbed } from "ui/discord/embed"

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

  const { data, ok, curl, error, log } =
    await config.createVaultConfigThreshold({
      guild_id: guildId,
      name: i.options.getString("name", true),
      threshold: i.options.getString("value", true),
    })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  const description = `**${
    data.name
  }** has been configured vault threshold of \`${
    data.threshold
  }%\` for approval\n${getEmoji(
    "POINTINGRIGHT"
  )} Set or change vault threshold by run \`/vault config threshold\``
  const embed = new MessageEmbed()
    .setTitle(
      `${getEmoji(
        "APPROVE_VAULT"
      )} Vault threshold successfully changed${getEmoji("BLANK").repeat(5)}`
    )
    .setDescription(description)
    .setColor(msgColors.GREEN)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1090195482506174474/1090906036464005240/image.png"
    )

  return { messageOptions: { embeds: [embed] } }
}
