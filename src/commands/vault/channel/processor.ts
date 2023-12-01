import config from "adapters/config"
import { CommandInteraction, GuildMember } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { APIError } from "errors"
import { getEmoji, hasAdministrator, msgColors } from "utils/common"
import { getErrorEmbed, composeEmbedMessage } from "ui/discord/embed"

export async function runCreateChannel({
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

  const channel = i.options.getChannel("channel")
  if (!channel) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid channel. Please choose another one!",
          }),
        ],
      },
    }
  }

  const {
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await config.createVaultConfigChannel({
    guild_id: guildId,
    channel_id: channel.id,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CHECK")} Vault log successfully created${getEmoji(
      "BLANK",
    ).repeat(5)}`,
    description: `All the requests will be posted in the <#${channel.id}>`,
    color: msgColors.BLUE,
  })

  return { messageOptions: { embeds: [embed] } }
}
