import {
  Message,
  MessageActionRow,
  MessageButton,
  TextChannel,
} from "discord.js"
import { composeEmbedMessage } from "utils/discord-embed"
import { logger } from "../../logger"

export async function sendVerifyMessage(
  message: Message,
  channelString: string
) {
  logger.info("[send-verify-message] sending message")

  const verifyMessageRow = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("verify")
      .setLabel("Verify")
      .setStyle("PRIMARY")
  )

  const channelId = channelString.split("<#")[1].split(">")[0]
  const targetChannel = message.guild.channels.cache.get(
    channelId
  ) as TextChannel

  if (!targetChannel) {
    logger.info("[send-verify-message] target channel not found")
    message.channel.send("target channel not found")
    return
  }

  targetChannel.send({
    embeds: [
      composeEmbedMessage(message, {
        title: "🤖 Verification required",
        description: `Verify your wallet. This is a read-only connection. Do not share your private keys. We will never ask for your seed phrase. We will never DM you.`,
      }),
    ],
    components: [verifyMessageRow],
  })
}
