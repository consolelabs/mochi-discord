import { ChannelType, ThreadAutoArchiveDuration } from "discord-api-types/v9"
import { DiscordAPIError, Message, ThreadChannel } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { CommandError } from "errors"
import humanId from "human-id"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { renderUI, session, SessionData } from "./utils"

export async function handleReplyTradeOffer(msg: Message): Promise<boolean> {
  const args = getCommandArguments(msg)
  if (msg.reference && args[0] === "offer") {
    const botMsg = await msg.fetchReference()
    if (botMsg.reference) {
      const offerMsg = await botMsg.fetchReference()
      const nonce = String(botMsg.nonce)
      if (nonce.startsWith("trade_")) {
        if (msg.channel.type === "GUILD_TEXT") {
          const channel = msg.channel
          const nonceParts = nonce.split("_")
          const userId = offerMsg?.author.id
          const userTag = offerMsg?.author.tag
          const tradeId = nonceParts[1]
          if (!userId || !userTag || !tradeId) return false
          const userData = session.get(userId)
          const offerItems = userData?.offeringItemsId.get(tradeId)
          if (!userData || !offerItems) return false

          let sessionData = userData.threads.get(tradeId)
          if (!sessionData) return false

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
              }
            }
            return false
          }

          const data: SessionData = {
            threadId: thread.id,
            state: "trading",
            userA: {
              ...sessionData?.userA,
              id: userId,
              tag: userTag,
              avatar: offerMsg.author.avatarURL(),
              offerItems,
              confirmed: false,
              cancelled: false,
            },
            userB: {
              id: msg.author.id,
              tag: msg.author.tag,
              offerItems:
                offerItems.size > 0
                  ? new Set(offerItems)
                  : new Set((args[1] ?? "").split(",")),
              confirmed: false,
              cancelled: false,
            },
          }

          userData.threads.set(tradeId, data)

          const ui = renderUI(userId, tradeId)

          const confirmMsg = await thread.send(ui)

          await thread.members.add(userId)
          await thread.members.add(msg.author.id)

          await thread.send(
            `${msg.author}, <@${userId}>, click confirm once you're done with your transaction.`
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

            userData.threads.set(tradeId, {
              ...data,
              userA: {
                ...data.userA,
                confirmed: isConfirm && i.user.id === data.userA.id,
                cancelled: isCancel && i.user.id === data.userA.id,
              },
              userB: {
                ...data.userB,
                confirmed: isConfirm && i.user.id === data.userB?.id,
                cancelled: isCancel && i.user.id === data.userB?.id,
              },
              state: "done",
            })

            const ui = renderUI(userId, tradeId)

            await i.editReply(ui)

            sessionData = userData.threads.get(tradeId)
            if (i.customId === "trade-confirm") {
              if (
                (sessionData?.userA.confirmed &&
                  sessionData?.userB?.confirmed) ||
                sessionData?.userA.cancelled ||
                sessionData?.userB?.cancelled
              ) {
                await thread.setLocked(true)
                await thread.setArchived(true)
              }
            }
          })
        }

        return true
      }
    }
  }
  return false
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
    if (
      Array.from(offerItems.values()).some((i) =>
        session.get(userA.id)?.offeringItemsId?.has(i)
      )
    ) {
      throw new CommandError({
        message: msg,
        description: "Item already in offer list",
      })
    }

    const tradeId = humanId({
      capitalize: false,
      separator: "-",
      adjectiveCount: 0,
    })
    const userData = session.get(userA.id)
    if (!userData) {
      session.set(userA.id, {
        threads: new Map<string, SessionData>([
          [
            tradeId,
            {
              threadId: "",
              userA: {
                id: msg.author.id,
                tag: msg.author.tag,
                avatar: msg.author.avatarURL(),
                offerItems,
                wantItems,
                confirmed: false,
                cancelled: false,
              },
              state: "waiting",
            },
          ],
        ]),
        offeringItemsId: new Map([[tradeId, new Set(offerItems)]]),
      })
    } else {
      userData.threads.set(tradeId, {
        threadId: "",
        userA: {
          id: msg.author.id,
          tag: msg.author.tag,
          avatar: msg.author.avatarURL(),
          offerItems,
          wantItems,
          confirmed: false,
          cancelled: false,
        },
        state: "waiting",
      })
      userData.offeringItemsId.set(tradeId, new Set(offerItems))
    }

    const ui = renderUI(msg.author.id, tradeId)

    return {
      messageOptions: {
        ...ui,
        nonce: `trade_${tradeId}`,
      },
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
