import { CommandInteraction, GuildMember, Message } from "discord.js"
import {
  PageType,
  buildHelpInterface,
  defaultPageType,
  getHelpEmbed,
  pagination,
} from "./processor"
import { hasAdministrator } from "utils/common"

const run = async (interaction: CommandInteraction) => {
  const member = interaction.member as GuildMember
  const embed = getHelpEmbed(interaction.user)
  buildHelpInterface(embed, defaultPageType, hasAdministrator(member), "/")

  const replyMsg = (await interaction.editReply({
    embeds: [embed],
    components: pagination(defaultPageType, hasAdministrator(member)),
  })) as Message

  replyMsg
    .createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
    })
    .on("collect", (i) => {
      i.deferUpdate()
      const pageType = i.customId as PageType
      const embed = getHelpEmbed(interaction.user)
      buildHelpInterface(embed, pageType, hasAdministrator(member), "/")

      interaction
        .editReply({
          embeds: [embed],
          components: pagination(pageType, hasAdministrator(member)),
        })
        .catch(() => null)
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })

  return {}
}
export default run
