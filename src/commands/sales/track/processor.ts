import community from "adapters/community"
import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { emojis, getEmojiURL } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"

export async function handleSalesTrack(
  msg: Message | CommandInteraction,
  addr: string | null,
  platform: string | null,
  guildId: string,
  channelId: string | null
) {
  const supportedChains = await config.getAllChains()
  const chain = supportedChains.map((chain: { currency: string }) => {
    return chain.currency.toUpperCase()
  })
  if (!platform || !chain.includes(platform.toUpperCase())) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description:
              "The chain hasn't been supported. Take a look at our supported chain by `$token list`",
          }),
        ],
      },
    }
  }
  if (!channelId || !addr)
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `${
              !channelId ? "Channel" : !addr ? "Address" : "Platform"
            } not found`,
          }),
        ],
      },
    }
  const res = await community.createSalesTracker(
    addr,
    platform,
    guildId,
    channelId
  )
  if (!res.ok) {
    if (
      res.error.includes("invalid contract address") ||
      res.error.includes("Collection has not been added")
    ) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid address",
        description:
          "The NFT collection address is invalid. Please check again.",
      })
    }
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Sales Tracker", getEmojiURL(emojis.LEADERBOARD)],
          description: `NFT sales information will be updated in <#${channelId}>.`,
        }),
      ],
    },
  }
}
