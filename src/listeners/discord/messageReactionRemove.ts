import webhook from "adapters/webhook"
import { Message } from "discord.js"
import config from "adapters/config"
import { starboardEmbed } from "ui/discord/embed"
import { eventAsyncStore } from "utils/async-storages"
import { getReactionIdentifier } from "utils/commands"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "."

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
  execute: async (_reaction, _user) => {
    _reaction
      .fetch()
      .then((reaction) => {
        _user
          .fetch()
          .then((user) => {
            reaction.message
              .fetch()
              .then(async (msg) => {
                const metadata = {
                  sub_event_type: "messageReactionRemove",
                  guild_id: msg.guildId ?? "DM",
                  discord_id: user.id,
                  channel_id: msg.channelId,
                  msg_id: msg.id,
                  reaction_id: reaction.emoji.toString(),
                }
                eventAsyncStore.run(
                  {
                    data: JSON.stringify(metadata),
                  },
                  () => {
                    wrapError(msg, async () => {
                      if (user.bot) return
                      if (!msg.guild) return

                      const body = {
                        guild_id: msg.guildId ?? "",
                        channel_id: msg.channelId,
                        message_id: msg.id,
                        reaction: getReactionIdentifier(
                          reaction.emoji.id,
                          reaction.emoji.name,
                          reaction.emoji.identifier.toLowerCase(),
                        ),
                        reaction_count: reaction.count,
                        user_id: user.id,
                      }

                      const res = await webhook.pushDiscordWebhook(
                        "messageReactionRemove",
                        body,
                      )
                      if (res?.ok) {
                        const data = {
                          ...body,
                          repost_channel_id: res?.data?.repost_channel_id,
                          repost_message_id: res?.data?.repost_message_id,
                        }
                        repostMessage(data, msg)
                      }
                    })
                  },
                )
              })
              .catch(() => null)
          })
          .catch(() => null)
      })
      .catch(() => null)
  },
}

export default event
