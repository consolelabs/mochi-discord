// import { Command } from "types/common"
// import { GuildIdNotFoundError } from "errors"
// import { PREFIX } from "utils/constants"
// import { process } from "./processor"
// import { composeEmbedMessage } from "ui/discord/embed"
// import { getCommandArguments } from "utils/commands"

// const command: Command = {
//   id: "add_server_token",
//   command: "add",
//   brief: "Add a token to your server's list",
//   category: "Community",
//   onlyAdministrator: true,
//   run: async function (msg) {
//     if (!msg.guildId) {
//       throw new GuildIdNotFoundError({ message: msg })
//     }
//     const args = getCommandArguments(msg)
//     const [token_address, token_chain] = args.slice(2)
//     return await process(msg, {
//       user_discord_id: msg.author.id,
//       guild_id: msg.guildId,
//       channel_id: msg.channelId,
//       message_id: msg.id,
//       token_address,
//       token_chain,
//     })
//   },
//   getHelpMessage: async (msg) => ({
//     embeds: [
//       composeEmbedMessage(msg, {
//         usage: `${PREFIX}tokens add`,
//         examples: `${PREFIX}tokens add`,
//       }),
//     ],
//   }),
//   canRunWithoutAction: true,
//   colorType: "Defi",
// }

// export default command
