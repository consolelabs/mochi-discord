import { Message, MessageEmbed, MessageReaction, User } from "discord.js"
import { DiscordEvent } from "."
import config from "adapters/config"
import webhook from "adapters/webhook"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getReactionIdentifier } from "utils/commands"
import { wrapError } from "utils/wrapError"

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
  if (res?.data?.repost_channel_id) {
    const { repost_channel_id: repostChannelId } = res.data
    const { channel_id, guild_id, message_id, reaction, reaction_count } = body

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
        }
      }
    }
  }
}

function starboardEmbed(msg: Message) {
  const attachments = msg.attachments.map((a) => ({
    url: a.url,
    type: a.contentType?.split("/")[0] ?? "",
  }))
  const attachmentSize = attachments.length
  let embed: MessageEmbed
  if (attachmentSize) {
    const imageURL = attachments.find((a) => a.type === "image")?.url
    const messageContent = msg.content
      ? msg.content
      : "Message contains some attachments"
    embed = composeEmbedMessage(null, {
      author: [msg.author.username, msg.author.avatarURL() ?? ""],
      description: messageContent,
      originalMsgAuthor: msg.author,
      image: imageURL,
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  } else {
    const messageContent = msg.content ? msg.content : "Message has no content."
    embed = composeEmbedMessage(null, {
      author: [msg.author.username, msg.author.avatarURL() ?? ""],
      description: messageContent,
      originalMsgAuthor: msg.author,
      withoutFooter: true,
      thumbnail: msg.guild?.iconURL(),
    }).setFields([{ name: "Source", value: `[Jump!](${msg.url})` }])
  }
  return embed
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
