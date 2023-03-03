import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { list } from "../processor"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { EmbedProperties } from "types/common"

export async function process(msg: OriginalMessage) {
  const isTextCommand = msg instanceof Message

  if (!msg.guildId || !msg.guild) {
    throw new GuildIdNotFoundError({})
  }

  const res = await config.getConfigMixRoleList({ guild_id: msg.guildId })
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }

  const { title, description, fields } = list(res)
  const properties: EmbedProperties = {
    title: title,
    description,
    color: "#FCD3C1",
  }
  let embed = isTextCommand
    ? composeEmbedMessage(msg, properties)
    : composeEmbedMessage2(msg as CommandInteraction, properties)
  embed = embed.addFields(fields)

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
