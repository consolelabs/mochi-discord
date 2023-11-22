import webhook from "adapters/webhook"
import { MessageReaction, User, Message } from "discord.js"
import { logger } from "logger"
import { eventAsyncStore } from "utils/async-storages"
import { getReactionIdentifier } from "utils/commands"
import { wrapError } from "utils/wrap-error"
import { DiscordEvent } from "."

const handleMessageReactionAdd = async (
  reaction: MessageReaction,
  user: User,
  msg: Message,
) => {
  let user_roles: string[] = []
  await msg.guild?.members
    .fetch(user)
    .then((member) => {
      user_roles = member.roles.cache.map((r) => r.id)
    })
    .catch((e) => {
      logger.error(e)
    })
  let author_roles: string[] = []
  await msg.guild?.members
    .fetch(msg.author.id)
    .then((member) => {
      author_roles = member.roles.cache.map((r) => r.id)
    })
    .catch((e) => {
      logger.error(e)
    })

  const body = {
    guild_id: msg.guild?.id ?? "",
    channel_id: msg.channel.id,
    message_id: msg.id,
    reaction: getReactionIdentifier(
      reaction.emoji.id,
      reaction.emoji.name,
      reaction.emoji.identifier.toLowerCase(),
    ),
    reaction_count: reaction.count,
    user_id: user.id,
    author_id: msg.author.id,
    user_roles,
    author_roles,
  }

  await webhook.pushDiscordWebhook("messageReactionAdd", body)
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
                const metadata = {
                  sub_event_type: "messageReactionAdd",
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

                      await handleMessageReactionAdd(reaction, user, msg)
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
