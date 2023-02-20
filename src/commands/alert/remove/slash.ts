import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Defi from "adapters/defi"
import { CommandInteraction, MessageSelectOptionData } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { handler } from "./processor"
import { composeDiscordExitButton } from "ui/discord/button"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { APIError } from "errors"
const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove the price alert")
  },
  run: async (interaction: CommandInteraction) => {
    const { ok, data, log, curl } = await Defi.getAlertList(interaction.user.id)
    if (!ok) {
      throw new APIError({ description: log, curl })
    }

    const options: MessageSelectOptionData[] = []
    data.forEach((config: any) => {
      options.push({
        label: config.role_name ?? "",
        value: `${config.id ?? ""}|${config.role_name ?? ""}`,
      })
    })

    const embed = composeEmbedMessage2(interaction, {
      title: "Select an option",
      //   description: list(configs).description,
    })

    return {
      messageOptions: {
        embeds: [embed],
        components: [
          composeDiscordSelectionRow({
            customId: "nftrole_remove",
            placeholder: "Select a nftrole",
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
        usage: `${SLASH_PREFIX}nftrole remove`,
        examples: `${SLASH_PREFIX}nftrole remove`,
        document: `${NFT_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
