import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Defi from "adapters/defi"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { handler } from "./processor"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { APIError } from "errors"
import { msgColors } from "utils/common"
const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove the price alert")
  },
  run: async (interaction: CommandInteraction) => {
    const {
      ok,
      data,
      log,
      curl,
      status = 500,
      error,
    } = await Defi.getAlertList(interaction.user.id)
    if (!ok) {
      throw new APIError({ description: log, curl, status, error })
    }

    const options: MessageSelectOptionData[] = []
    data.forEach((alert: any) => {
      const label =
        alert.symbol +
          " " +
          alert.alert_type.replaceAll("_", " ") +
          " " +
          alert.value ?? ""
      const value = `${alert.id ?? ""}`
      options.push({
        label,
        value,
      })
    })

    const embed = composeEmbedMessage2(interaction, {
      title: "Select an alert to remove",
      color: msgColors.PINK,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "alert_remove",
            placeholder: "Select an alert",
            options,
          }),
          composeDiscordExitButton(interaction.user.id),
        ],
      },
      interactionOptions: {
        handler,
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}alert remove`,
        examples: `${SLASH_PREFIX}alert remove`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
