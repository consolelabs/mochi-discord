import Discord from "discord.js"
import handleCommand from "../commands"
import {
  ENV,
  API_SERVER_HOST,
  PREFIX,
  ADMIN_PREFIX,
  HIT_AND_BLOW_CHANNEL_ID,
  LOG_CHANNEL_ID,
  SECONDARY_PREFIX,
} from "../env"
import { Event } from "."
import fetch from "node-fetch"
import { logger } from "../logger"
import { handleGuess } from "commands/hit-and-blow"
import UserActionManager from "utils/UserActionManager"
import { NekoBotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"

const paintSwapFieldAddressReg = /0x[a-fA-F0-9]+\)$/g

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Discord.Message) => {
    if (message.channel.id === LOG_CHANNEL_ID) return
    try {
      const messageContent = message.content.toLowerCase()
      // restrict channels

      // NEKO mint price
      // prod
      let deniedChannels = ["882287783169896474", "892647979163455498"]
      let allowChannel = ["896654487962419210"]

      // dev
      if (ENV === "dev") {
        deniedChannels = ["895659000996200511", "897405804284633108"]
        allowChannel = ["896308716440289290"]
      }

      if (
        deniedChannels.includes(message.channelId) &&
        messageContent.includes(".nft neko")
      ) {
        message.channel.send(
          `sur! we bot are not allowed to live here, can you move it to <#${allowChannel}>`
        )
        return
      }

      const isGmMessage =
        messageContent === "gm" ||
        messageContent === "gn" ||
        messageContent === "<:gm:930840080761880626>" ||
        (message.stickers.get("928509218171006986") &&
          message.stickers.get("928509218171006986").name === ":gm")

      // ---------------------------
      // p! command
      // ---------------------------
      // handle command
      if (!message.author.bot) {
        if (message.channel.type !== "DM") {
          if (
            messageContent.startsWith(PREFIX) ||
            messageContent.startsWith(ADMIN_PREFIX) ||
            messageContent.startsWith(SECONDARY_PREFIX) ||
            isGmMessage
          ) {
            const key = `${message.author.id}_${message.guildId}_${message.channelId}`
            // disable previous command choice handler before executing new command
            CommandChoiceManager.remove(key)
            await handleCommand(message)
          } else if (message.channel.id === HIT_AND_BLOW_CHANNEL_ID) {
            await handleGuess(message)
          }
          return
        } else if (messageContent.startsWith(`${PREFIX}deposit`)) {
          await handleCommand(message)
        } else {
          // DM messages
          UserActionManager.handle(message.author.id, message)
        }
      }

      // Usecase: watch sale twitter
      // TODO: env
      // TODO: move to module
      let nekoSalesChannel = "896657885487042610"
      if (ENV === "dev") {
        nekoSalesChannel = "898517819870822410"
      }

      if (
        message.channelId === nekoSalesChannel &&
        message.embeds.length !== 0 &&
        (message.embeds[0].title.includes("Cyber Neko") ||
          message.embeds[0].title.includes("Pod Town OG Card"))
      ) {
        const url = message.embeds[0].url

        const buyerMatch = message.embeds[0].fields[3].value.match(
          paintSwapFieldAddressReg
        )[0]

        const buyerAddr = buyerMatch.substring(0, buyerMatch.length - 1)

        const sellerMatch = message.embeds[0].fields[4].value.match(
          paintSwapFieldAddressReg
        )[0]

        const sellerAddr = sellerMatch.substring(0, sellerMatch.length - 1)

        const body = JSON.stringify({
          seller_address: sellerAddr,
          buyer_address: buyerAddr,
          paintswap_url: url,
        })
        logger.info(`new neko-sales message: ${body}`)
        await fetch(API_SERVER_HOST + "/api/v1/twitter/neko-sale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: body,
        })
      }
    } catch (e: any) {
      const error = e as NekoBotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"messageCreate">
