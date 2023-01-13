import {
  Message,
  MessageReaction,
  User,
  ChannelLogsQueryOptions,
} from "discord.js"
import { DiscordEvent } from "."
import config from "adapters/config"
import webhook from "adapters/webhook"
import { composeEmbedMessage, starboardEmbed } from "discord/embed/ui"
import { getReactionIdentifier } from "utils/commands"
import { wrapError } from "utils/wrap-error"

const handleRepostableMessageTracking = async (
  reaction: MessageReaction,
  user: User,
  msg: Message
) => {
  const body = {
    guild_id: msg.guild?.id ?? "",
    channel_id: msg.channel.id,
    message_id: msg.id,
    reaction: getReactionIdentifier(
      reaction.emoji.id,
      reaction.emoji.name,
      reaction.emoji.identifier.toLowerCase()
    ),
    reaction_count: reaction.count,
    user_id: user.id,
  }

  const res = await webhook.pushDiscordWebhook("messageReactionAdd", body)

  if (res?.data.reaction_type === "conversation") {
    // loop through all channels in current guild to identify which channel contains conversation has origin_start_message_id
    const channel = msg.guild?.channels.cache.find(
      (c) =>
        c.type == "GUILD_TEXT" &&
        c.messages.cache.has(res.data.origin_start_message_id)
    )

    if (channel && channel.isText()) {
      const startId = res.data.origin_start_message_id - 1
      const options: ChannelLogsQueryOptions = {
        after: startId.toString(),
        before: res.data.origin_stop_message_id,
      }

      const rawConversation = await channel.messages.fetch(options)

      // although ChannelLogsQueryOptions has before and after message id but the data is not correct 100%
      // i need to get the start id and stop id out, then get msg which start id < is < stop id
      const conversationArr: Message[] = []
      for (msg of rawConversation.values()) {
        conversationArr.push(msg)
      }

      const startMsg = conversationArr.filter(
        (m) => m.id === res.data.origin_start_message_id
      )

      const stopMsg = conversationArr.filter(
        (m) => m.id === res.data.origin_stop_message_id
      )

      const converstion = conversationArr
        .filter((m) => {
          return m.id >= startMsg[0].id && m.id <= stopMsg[0].id
        })
        .reverse()

      let conversationMsg = ``
      for (const msg of converstion.values()) {
        conversationMsg += `${msg.author.username}: ${msg.content}\n`
      }

      // send conversation to sb channel
      const repostChannel = msg.guild?.channels.cache.find(
        (c) => c.id === res?.data.repost_channel_id
      )
      if (repostChannel && repostChannel.isText()) {
        await repostChannel.send({
          embeds: [
            composeEmbedMessage(null, {
              description: conversationMsg,
            }),
          ],
        })
      }
    }
  } else {
    if (res?.data?.repost_channel_id) {
      const { repost_channel_id: repostChannelId } = res.data
      const { channel_id, guild_id, message_id, reaction, reaction_count } =
        body

      const channel = msg.guild?.channels.cache.find(
        (c) => c.id === repostChannelId
      )

      const embed = starboardEmbed(msg)
      if (channel) {
        if (channel.isText()) {
          // if repost message not exist, create one and store to db
          if (!res?.data.repost_message_id) {
            const sentMsg = await channel.send({
              embeds: [embed],
              content: `**${reaction} ${reaction_count}** <#${channel_id}>`,
            })

            config.editMessageRepost({
              guild_id,
              origin_message_id: message_id,
              origin_channel_id: channel_id,
              repost_channel_id: repostChannelId,
              repost_message_id: sentMsg.id,
            })
          } else {
            channel.messages
              .fetch(`${res?.data.repost_message_id}`)
              .then((msg) => {
                msg
                  .edit({
                    embeds: [embed],
                    content: `**${reaction} ${reaction_count}** <#${channel_id}>`,
                  })
                  .catch(() => null)
              })
              .catch(() => null)
          }
        }
      }
    }
  }
}

const event: DiscordEvent<"messageReactionAdd"> = {
  name: "messageReactionAdd",
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
                wrapError(msg, async () => {
                  if (user.bot) return
                  if (!msg.guild) return

                  await handleRepostableMessageTracking(
                    reaction,
                    user,
                    msg
                  ).catch(() => null)
                })
              })
              .catch(() => null)
          })
          .catch(() => null)
      })
      .catch(() => null)
  },
}

export default event
