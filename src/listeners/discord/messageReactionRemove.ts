import { DiscordEvent } from "."
import { Message } from "discord.js"
import { starboardEmbed } from "ui/discord/embed"
import config from "adapters/config"

async function repostMessage(data: any, msg: Message) {
  if (data?.repost_channel_id) {
    const channel = msg.guild?.channels.cache.find(
      (c) => c.id === data.repost_channel_id,
    )

    const embed = starboardEmbed(msg)
    if (channel) {
      if (channel.isText()) {
        // if repost message not exist, create one and store to db
        if (!data.repost_message_id) {
          const sentMsg = await channel.send({
            embeds: [embed],
            content: `**${data.reaction} ${data.reaction_count}** <#${data.channel_id}>`,
          })

          config.editMessageRepost({
            guild_id: data.guild_id,
            origin_message_id: data.message_id,
            origin_channel_id: data.channel_id,
            repost_channel_id: data.repost_channel_id,
            repost_message_id: sentMsg.id,
          })
        } else {
          channel.messages.fetch(`${data.repost_message_id}`).then((msg) => {
            msg
              .edit({
                embeds: [embed],
                content: `**${data.reaction} ${data.reaction_count}** <#${data.channel_id}>`,
              })
              .catch(() => null)
          })
        }
      }
    }
  }
}

const event: DiscordEvent<"messageReactionRemove"> = {
  name: "messageReactionRemove",
  once: false,
  execute: async () => {},
}

export default event
