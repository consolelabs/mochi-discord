import { ChannelType, ThreadAutoArchiveDuration } from "discord-api-types/v9"
import {
  ButtonInteraction,
  DiscordAPIError,
  Message,
  TextChannel,
  ThreadChannel,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { CommandError } from "errors"
import humanId from "human-id"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import {
  renderTradeRequest,
  renderTrade,
  session,
  SessionData,
  UserB,
} from "./utils"
import type { SetRequired } from "type-fest"

type BeginSessionParams = {
  channel: TextChannel
  userAid: string
  userB?: SetRequired<Partial<UserB>, "id" | "tag">
  requestId: string
}

async function handleBeginSession(params: BeginSessionParams) {
  const { userB, channel, userAid, requestId } = params

  if (!userB?.id || !userB?.tag) return
  const userData = session.get(userAid)
  if (!userData) return
  const { userA, tradeRequests } = userData
  const request = tradeRequests.get(requestId)
  if (!request) return
  const { wantItems, offerItems } = request

  const tradeId = humanId({ capitalize: false, separator: "-" })
  let thread: ThreadChannel
  try {
    // try to create a private thread
    thread = await channel.threads.create({
      name: tradeId,
      type: ChannelType.GuildPrivateThread,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    })
  } catch (e: any) {
    if (e instanceof DiscordAPIError) {
      // nitro level too low -> create public thread
      if (e.code === 20035) {
        thread = await channel.threads.create({
          name: tradeId,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        })
      } else {
        return false
      }
    } else {
      return false
    }
  }

  const data: SessionData = {
    threadId: thread.id,
    state: "trading",
    offerItems: new Set(offerItems),
    wantItems: new Set(wantItems),
    userB: {
      ...userB,
      confirmed: false,
      cancelled: false,
    },
  }

  userData.tradingDeals.set(tradeId, data)

  const ui = renderTrade({ userData, tradeId })

  const confirmMsg = await thread.send(ui)

  await thread.members.add(userA.id)
  await thread.members.add(userB.id)

  await thread.send(
    `> <@${userB.id}>, <@${userA.id}>, click confirm once you're done with your transaction.`
  )

  const collector = confirmMsg.createMessageComponentCollector({
    filter: (i) =>
      i.customId === "trade-confirm" || i.customId === "trade-cancel",
    componentType: MessageComponentTypes.BUTTON,
    time: 1800000,
  })

  collector.on("collect", async (i) => {
    await i.deferUpdate()
    const isConfirm = i.customId === "trade-confirm"
    const isCancel = i.customId === "trade-cancel"
    const data = userData.tradingDeals.get(tradeId)
    if (!data) return

    const newData: SessionData = {
      ...data,
      userB: {
        ...data.userB,
        confirmed:
          data.userB?.confirmed || (isConfirm && i.user.id === data.userB?.id),
        cancelled:
          data.userB?.cancelled || (isCancel && i.user.id === data.userB?.id),
      },
      state: "done",
    }

    userData.userA = {
      ...userA,
      confirmed: userA.confirmed || (isConfirm && i.user.id === userA.id),
      cancelled: userA.cancelled || (isCancel && i.user.id === userA.id),
    }
    userData.tradingDeals.set(tradeId, newData)

    const ui = renderTrade({ userData, tradeId })

    await i.editReply(ui)

    if (
      (userData.userA.confirmed && newData.userB.confirmed) ||
      userData.userA.cancelled ||
      newData.userB?.cancelled
    ) {
      await thread.setLocked(true)
      await thread.setArchived(true)
    }
  })
}

export async function handleButtonOffer(i: ButtonInteraction) {
  await i.deferUpdate()
  const msg = i.message as Message
  if (msg.channel.type === "GUILD_TEXT") {
    const [, userAid, requestId] = i.customId.split("_")
    const member = await i.guild?.members.fetch(userAid).catch(() => null)
    if (!member) return
    const channel = msg.channel

    await handleBeginSession({
      channel,
      userAid,
      requestId,
      userB: {
        id: i.user.id,
        tag: i.user.tag,
      },
    })
  }
}

const command: Command = {
  id: "trade",
  brief: "Trade NFTs with other user",
  command: "trade",
  run: async (msg: Message) => {
    if (msg.channel.isThread()) {
      throw new CommandError({
        message: msg,
        description: "Trade request must be in a text channel",
      })
    }

    const args = getCommandArguments(msg)
    const offerItems = new Set((args[1] ?? "").split(","))
    const wantItems = new Set((args[2] ?? "").split(","))

    const userA = msg.author

    const userData = session.get(userA.id)
    const request = {
      offerItems,
      wantItems,
    }

    const requestId = humanId({ capitalize: false, separator: "-" })
    if (!userData) {
      session.set(userA.id, {
        userA: {
          id: userA.id,
          tag: userA.tag,
          avatar: userA.avatarURL(),
          confirmed: false,
          cancelled: false,
        },
        tradeRequests: new Map([[requestId, request]]),
        tradingDeals: new Map(),
      })
    } else {
      userData.tradeRequests.set(requestId, request)
    }

    const ui = renderTradeRequest({ user: msg.author, requestId, request })

    return {
      messageOptions: ui,
    }
  },
  colorType: "Defi",
  getHelpMessage: async () => {
    return { content: "" }
  },
  canRunWithoutAction: true,
  category: "Community",
  experimental: true,
  minArguments: 2,
}

export default command
