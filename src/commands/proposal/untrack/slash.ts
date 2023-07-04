// import { composeEmbedMessage2 } from "ui/discord/embed"
// import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
// import { CommandInteraction } from "discord.js"
// import { SlashCommand } from "types/common"
// import { SLASH_PREFIX } from "utils/constants"
// import { GuildIdNotFoundError } from "errors"
// import { handle } from "./processor"

// const command: SlashCommand = {
//   name: "untrack",
//   category: "Config",
//   prepare: () => {
//     return new SlashCommandSubcommandBuilder()
//       .setName("untrack")
//       .setDescription("Untrack a previously config DAO proposal tracker")
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
//         title: "Untrack a previously config Snapshot tracker",
//         usage: `${SLASH_PREFIX}proposal untrack`,
//         examples: `${SLASH_PREFIX}proposal untrack`,
//       }),
//     ],
//   }),
//   colorType: "Server",
// }

// export default command
