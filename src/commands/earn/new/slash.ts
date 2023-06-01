import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { run, collectSelection } from "./processor"

const command: SlashCommand = {
  name: "new",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("new")
      .setDescription("Your new quests, resets at 00:00 UTC")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const renderResult = await run(interaction.user.id)

    // cho nay la "editReply" chu khong phai la "reply" boi vi o layer tren da co
    // 1 cho goi deferReply roi
    const reply = (await interaction.editReply(
      renderResult.messageOptions
    )) as Message

    collectSelection(reply, interaction.user)

    // thay vi return renderResult thi minh co the return null va
    // manually reply de lay object reply message de co the tao collector
    return null
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        description: "Check on your quests and what rewards you can claim",
        usage: `${SLASH_PREFIX}earn new`,
        examples: `${SLASH_PREFIX}earn new`,
        footer: [`Type ${SLASH_PREFIX}help earn`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
