import Defi from "adapters/defi"
import { SelectMenuInteraction } from "discord.js"
import { APIError } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getSuccessEmbed } from "ui/discord/embed"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const alertId = interaction.values[0]
  const { ok, log, curl, status = 500 } = await Defi.removeAlertPrice(alertId)

  if (!ok) {
    throw new APIError({ description: log, curl, status })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully removed",
          description: `You can set a new alert for another token by \`$alert add <token_symbol>\`.`,
        }),
      ],
      components: [],
    },
  }
}
