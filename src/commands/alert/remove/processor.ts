import Defi from "adapters/defi"
import { SelectMenuInteraction } from "discord.js"
import { APIError } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getSuccessEmbed } from "ui/discord/embed"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const [userId, coinGeckoId] = interaction.values[0].split("|")
  const { ok, log, curl } = await Defi.removeAlertPrice(userId, coinGeckoId)

  if (!ok) {
    throw new APIError({ description: log, curl })
  }

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully removed",
          description: `You can set a new alert for another token by \`$alert add <token_symbol>\`.`,
        }),
      ],
    },
  }
}
