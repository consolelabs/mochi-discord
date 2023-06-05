import { CommandInteraction, Message } from "discord.js"
import {
  renderSetting,
  pagination,
  defaultPageType,
  PageType,
  getSettingEmbed,
} from "./processor"
import { wrapError } from "utils/wrap-error"

const run = async (interaction: CommandInteraction) => {
  const embed = getSettingEmbed(interaction.user)
  await renderSetting(embed, defaultPageType)

  const replyMsg = (await interaction.editReply({
    embeds: [embed],
    components: pagination(),
  })) as Message

  replyMsg
    .createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
    })
    .on("collect", (i) => {
      wrapError(i, async () => {
        i.deferUpdate()
        const pageType = i.customId as PageType

        const embed = getSettingEmbed(interaction.user)
        await renderSetting(embed, pageType)

        interaction
          .editReply({
            embeds: [embed],
            components: pagination(),
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
