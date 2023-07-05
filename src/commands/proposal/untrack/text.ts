// import { GuildIdNotFoundError } from "errors"
// import { Command } from "types/common"
// import { PREFIX } from "utils/constants"
// import { composeEmbedMessage } from "ui/discord/embed"
// import { handle } from "./processor"

// const command: Command = {
//   id: "proposal_untrack",
//   command: "untrack",
//   brief: "Untrack a previously config DAO proposal tracker",
//   category: "Config",
//   run: async (msg) => {
//     if (!msg.guild) {
//       throw new GuildIdNotFoundError({})
//     }
//     return await handle(msg)
//   },
//   getHelpMessage: async (msg) => ({
//     embeds: [
//       composeEmbedMessage(msg, {
//         title: "Untrack a previously config DAO proposal tracker",
//         usage: `${PREFIX}proposal untrack`,
//         examples: `${PREFIX}proposal untrack`,
//       }),
//     ],
//   }),
//   colorType: "Server",
//   minArguments: 2,
// }

// export default command
