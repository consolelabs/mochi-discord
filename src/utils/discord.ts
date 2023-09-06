import { CommandInteraction, Message, MessageOptions, User } from "discord.js"
import _ from "lodash"
import { RunResult } from "types/common"
import { authorFilter, getAuthor } from "./common"
import { wrapError } from "./wrap-error"

export function isMessage(msgOrInteraction: Message | CommandInteraction) {
  if (msgOrInteraction instanceof Message) {
    return { message: msgOrInteraction as Message }
  }
  return { interaction: msgOrInteraction as CommandInteraction }
}

export async function reply(
  msgOrInteraction: Message | CommandInteraction,
  response: RunResult<MessageOptions>,
) {
  const author = getAuthor(msgOrInteraction)
  const { message, interaction } = isMessage(msgOrInteraction)
  const payload = getMessageReplyPayload(response)
  let reply: Message | null = null
  if (message) {
    reply = await message.reply(payload)
  } else if (interaction && !interaction.deferred && !interaction.replied) {
    reply = await interaction
      .reply({ ...payload, fetchReply: true })
      .then((d) => d as Message)
      .catch(() => null)
  } else if (interaction && (interaction.deferred || interaction.replied)) {
    reply = await interaction
      .editReply(payload)
      .then((d) => d as Message)
      .catch(() => null)
  }
  if (!reply) return

  // handle button/select-menu interactions
  collectComponentInteraction(reply, response, author)

  return reply
}

function collectComponentInteraction(
  msg: Message,
  runResult: RunResult<MessageOptions>,
  author: User,
) {
  const { buttonCollector, selectMenuCollector } = runResult
  // handle button interaction
  if (buttonCollector) {
    msg
      .createMessageComponentCollector({
        componentType: "BUTTON",
        filter: authorFilter(author.id),
        max: 1,
        ...buttonCollector.options,
      })
      .on("collect", async (i) => {
        wrapError(i, async () => {
          const response = await buttonCollector.handler(i)
          if (!response) return
          const payload = getMessageReplyPayload(response)
          const edited = await msg.edit(payload)
          collectComponentInteraction(edited, response, author)
        })
      })
  }

  // handle select menu interaction
  if (selectMenuCollector) {
    msg
      .createMessageComponentCollector({
        componentType: "SELECT_MENU",
        filter: authorFilter(author.id),
        ...selectMenuCollector.options,
      })
      .on("collect", async (i) => {
        wrapError(i, async () => {
          const response = await selectMenuCollector.handler(i)
          if (!response) return
          const payload = getMessageReplyPayload(response)
          const edited = await msg.edit(payload)
          collectComponentInteraction(edited, response, author)
        })
      })
  }
}

function getMessageReplyPayload(result: RunResult<MessageOptions>) {
  return _.omit(
    result.messageOptions,
    "tts",
    "nonce",
    "allowedMentions",
    "reply",
    "stickers",
    "flags",
  )
}
