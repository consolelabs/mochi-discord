import { CommandInteraction, Message, MessageOptions, User } from "discord.js"
import _ from "lodash"
import { RunResult } from "types/common"
import { authorFilter, getAuthor } from "./common"
import { wrapError } from "./wrap-error"

export async function awaitMessage({
  msg,
  authorId,
  timeout,
  timeoutResponse,
}: {
  msg: Message
  authorId: string
  timeout?: number // in ms
  timeoutResponse?: MessageOptions
}) {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await msg.channel.awaitMessages({
    filter,
    max: 1,
    time: timeout || 30000,
  })
  const first = collected.first()
  const content = first?.content.trim() ?? ""
  if (timeoutResponse && !content) {
    await msg.edit({
      embeds: timeoutResponse.embeds,
      components: timeoutResponse.components,
    })
  }
  return { content, first }
}

export function isMessage(msgOrInteraction: Message | CommandInteraction) {
  if (msgOrInteraction instanceof Message) {
    return { message: msgOrInteraction as Message }
  }
  return { interaction: msgOrInteraction as CommandInteraction }
}

export async function reply(
  msgOrInteraction: Message | CommandInteraction,
  response: RunResult<MessageOptions>
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
  author: User
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
    "flags"
  )
}
