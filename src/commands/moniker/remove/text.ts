import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleRemoveMoniker } from "./processor"

const command: Command = {
  id: "moniker_remove",
  command: "remove",
  brief: "Remove a moniker configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const moniker = args.slice(2).join(" ").trim()
    const payload: RequestDeleteMonikerConfigRequest = {
      guild_id: msg.guildId,
      moniker,
    }
    return await handleRemoveMoniker(payload)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}moniker remove <moniker>`,
          examples: `${PREFIX}moniker remove cup of coffee`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
