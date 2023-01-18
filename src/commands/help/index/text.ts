import { Message } from "discord.js"
import { hasAdministrator } from "utils/common"
import {
  PageType,
  buildHelpInterface,
  defaultPageType,
  getHelpEmbed,
  pagination,
} from "./processor"

const run = async (msg: Message) => {
  const embed = getHelpEmbed(msg.author)
  buildHelpInterface(embed, defaultPageType, hasAdministrator(msg.member))

  const replyMsg = await msg.reply({
    embeds: [embed],
    components: pagination(defaultPageType, hasAdministrator(msg.member)),
  })

  replyMsg
    .createMessageComponentCollector({
      filter: (i) => i.user.id === msg.author.id,
    })
    .on("collect", (i) => {
      i.deferUpdate()
      const pageType = i.customId as PageType
      const embed = getHelpEmbed(msg.author)
      buildHelpInterface(embed, pageType, hasAdministrator(msg.member))

      replyMsg
        .edit({
          embeds: [embed],
          components: pagination(pageType, hasAdministrator(msg.member)),
        })
        .catch(() => null)
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })

  return {}
}
export default run
