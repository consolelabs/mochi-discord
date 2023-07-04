// import { composeEmbedMessage2 } from "ui/discord/embed"
// import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
// import { CommandInteraction } from "discord.js"
// import { SlashCommand } from "types/common"
// import { SLASH_PREFIX } from "utils/constants"
// import { GuildIdNotFoundError } from "errors"
// import { handle } from "./processor"

// const command: SlashCommand = {
//   name: "track",
//   category: "Config",
//   prepare: () => {
//     return new SlashCommandSubcommandBuilder()
//       .setName("info")
//       .setDescription("Show information about dao config and proposal tracking")
//   },
//   run: async function (interaction: CommandInteraction) {
//     if (!interaction.guildId) {
//       throw new GuildIdNotFoundError({})
//     }
//     return await handle(interaction)
//   },
//   help: async (interaction: CommandInteraction) => ({
//     embeds: [
//       composeEmbedMessage2(interaction, {
//         usage: `${SLASH_PREFIX}proposal info`,
//         examples: `${SLASH_PREFIX}proposal info`,
//       }),
//     ],
//   }),
//   colorType: "Server",
// }

// export default command
