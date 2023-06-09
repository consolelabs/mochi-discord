import { Message } from "discord.js"
import { wrapError } from "utils/wrap-error"
import {
  PageType,
  buildHelpInterface,
  defaultPageType,
  getHelpEmbed,
  pagination,
} from "./processor"

const run = async (msg: Message) => {
  const embed = getHelpEmbed(msg.author)
  await buildHelpInterface(embed, defaultPageType)

  const replyMsg = await msg.reply({
    embeds: [embed],
    components: pagination(defaultPageType),
  })

  replyMsg
    .createMessageComponentCollector({
      filter: (i) => i.user.id === msg.author.id,
    })
    .on("collect", (i) => {
      wrapError(i, async () => {
        i.deferUpdate()
        const pageType = i.customId as PageType
        const embed = getHelpEmbed(msg.author)
        await buildHelpInterface(embed, pageType)

        replyMsg
          .edit({
            embeds: [embed],
            components: pagination(pageType),
          })
          .catch(() => null)
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })

  return {}
}
export default run
