import { enableDMMessage } from "../ui/discord/embed"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageOptions,
  MessagePayload,
  User,
} from "discord.js"
import { reply } from "./discord"

export async function dmUser(
  options: string | MessageOptions | MessagePayload,
  author: User,
  msgOrInteraction: Message | CommandInteraction | null,
  button: ButtonInteraction | null,
  prefixDesc = "",
  suffixDesc = "",
): Promise<Message<boolean> | null> {
  try {
    return await author.send(options)
  } catch (e) {
    if (msgOrInteraction) {
      reply(msgOrInteraction, {
        messageOptions: {
          embeds: [enableDMMessage(prefixDesc, suffixDesc)],
          components: [],
        },
      })
    } else {
      button?.editReply({
        embeds: [enableDMMessage(prefixDesc, suffixDesc)],
        components: [],
      })
    }
    return null
  }
}
