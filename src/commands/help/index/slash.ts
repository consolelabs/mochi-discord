import { CommandInteraction, Message } from "discord.js"
import { wrapError } from "utils/wrap-error"
import {
  PageType,
  buildHelpInterface,
  defaultPageType,
  getHelpEmbed,
  pagination,
} from "./processor"

const run = async (interaction: CommandInteraction) => {
  const embed = getHelpEmbed(interaction.user)
  await buildHelpInterface(embed, defaultPageType)

  const replyMsg = (await interaction.editReply({
    embeds: [embed],
    components: pagination(defaultPageType),
  })) as Message

  replyMsg
    .createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
    })
    .on("collect", (i) => {
      wrapError(i, async () => {
        i.deferUpdate()
        const pageType = i.customId as PageType
        const embed = getHelpEmbed(interaction.user)
        await buildHelpInterface(embed, pageType)

        interaction
          .editReply({
            embeds: [embed],
            components: pagination(pageType),
          })
          .catch(() => null)
      })
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })

  return {}
}
export default run
