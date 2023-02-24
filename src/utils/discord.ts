import { Message, TextBasedChannel } from "discord.js"

export async function askForUserInput(
  authorId: string,
  channel: TextBasedChannel,
  max?: number
) {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await channel.awaitMessages({
    max: max ?? 1,
    filter,
  })
  return collected.first()
}
