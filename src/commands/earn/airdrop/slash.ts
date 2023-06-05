import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { run, AirdropCampaignStatus } from "./processor"
import { route } from "utils/router"
import { machineConfig } from ".."

const command: SlashCommand = {
  name: "airdrop",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("airdrop")
      .setDescription("view airdrop campaigns")
      .addStringOption((opt) =>
        opt
          .setName("status")
          .setDescription("filter airdrops by its status")
          .setChoices([
            ["new (default)", "new"],
            ["done", "done"],
            ["skipped", "skipped"],
          ])
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const status =
      interaction.options.getString("status", false) ??
      AirdropCampaignStatus.New
    const msgOpts = await run(
      interaction.user.id,
      status as AirdropCampaignStatus
    )

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction.user, machineConfig)
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          description: "Check on your quests and what rewards you can claim",
          usage: `${SLASH_PREFIX}earn airdrop`,
          examples: `${SLASH_PREFIX}earn airdrop`,
          footer: [`Type ${SLASH_PREFIX}help earn`],
        }),
      ],
    }),
  colorType: "Server",
}

export default command
