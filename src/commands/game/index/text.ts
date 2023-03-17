import { Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  getDetailEmbedOptions,
  getListComponents,
  getListEmbedOptions,
} from "./processor"

export function handleList(data: Array<any>, msg: Message) {
  return {
    messageOptions: {
      embeds: [composeEmbedMessage(msg, getListEmbedOptions(data))],
      components: getListComponents(),
    },
  }
}

export function handleDetail(data: Record<string, any>, msg: Message) {
  return {
    messageOptions: {
      embeds: [composeEmbedMessage(msg, getDetailEmbedOptions(data))],
    },
  }
}
