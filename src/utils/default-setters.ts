import { ButtonInteraction, Message } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"

type GetDefaultSetterParams = {
  updateCache?: () => void
  updateAPI?: () => Promise<any>
  description: string
}

export function getDefaultSetter({
  updateAPI = async () => {
    return
  },
  updateCache = () => {
    return
  },
  description,
}: GetDefaultSetterParams) {
  return async function (i: ButtonInteraction) {
    await i.deferUpdate().catch(() => null)
    await updateAPI()
    updateCache()
    const embed = getSuccessEmbed({
      title: "Default ENABLED",
      description,
    })
    i.editReply({
      embeds: [embed],
      components: [],
    }).catch(() => null)
  }
}
