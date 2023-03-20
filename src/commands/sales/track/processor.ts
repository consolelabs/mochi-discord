import community from "adapters/community"
import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_SALES,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { SendActivityMsg } from "utils/activity"

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
  // send activity
  const channel = msg!.guild!.channels.cache.has(channelId)
    ? msg!.guild!.channels.cache.get(channelId)
    : await msg!.guild!.channels.fetch(channelId)
  const isTextCommand = msg instanceof Message
  const userId = isTextCommand ? msg.author.id : msg.user.id
  const dataProfile = await profile.getByDiscord(userId)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  const kafkaMsg: KafkaQueueActivityDataCommand = {
    platform: "discord",
    activity: {
      profile_id: dataProfile.id,
      status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      platform: MOCHI_APP_SERVICE,
      action: MOCHI_ACTION_SALES,
      content: {
        username: "",
        amount: "",
        token: "",
        server_name: "",
        number_of_user: "",
        role_name: "",
        channel_name: channel!.name,
        token_name: "",
        moniker_name: "",
        address: "",
      },
    },
  }
  SendActivityMsg(kafkaMsg)

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Sales Tracker", getEmojiURL(emojis.LEADERBOARD)],
          description: `NFT sales information will be updated in <#${channelId}>.`,
          color: msgColors.PINK,
        }),
      ],
    },
  }
}
