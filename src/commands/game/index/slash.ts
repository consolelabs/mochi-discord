import { CommandInteraction } from "discord.js"
import { composeEmbedMessage2 } from "ui/discord/embed"
import {
  getDetailEmbedOptions,
  getListComponents,
  getListEmbedOptions,
} from "./processor"

export function handleList(data: Array<any>, interaction: CommandInteraction) {
  return {
    messageOptions: {
      embeds: [composeEmbedMessage2(interaction, getListEmbedOptions(data))],
      components: getListComponents(),
    },
  }
}

export function handleDetail(
  data: Record<string, any>,
  interaction: CommandInteraction
) {
  return {
    messageOptions: {
      embeds: [composeEmbedMessage2(interaction, getDetailEmbedOptions(data))],
    },
  }
}
