import { DiscordEvent } from "."
import webhook from "adapters/webhook"
import { getReactionIdentifier } from "utils/commands"
import { wrapError } from "utils/wrapError"

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
                      reaction.emoji.identifier.toLowerCase()
                    ),
                    reaction_count: reaction.count,
                    user_id: user.id,
                  }

                  await webhook
                    .pushDiscordWebhook("messageReactionRemove", body)
                    .catch(() => null)
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
