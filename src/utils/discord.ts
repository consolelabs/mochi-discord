import { Message, MessageOptions } from "discord.js"

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
