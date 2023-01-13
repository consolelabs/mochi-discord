import { CommandArgumentError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleTokenDefault } from "./processor"

const command: Command = {
  id: "set_default_token",
  command: "default",
  brief: "Set default token for your server",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      throw new CommandArgumentError({
        message: msg,
        getHelpMessage: () => command.getHelpMessage(msg),
      })
    }
    const embeds = await handleTokenDefault(msg, args[2])
    return {
      messageOptions: {
        ...embeds,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens default <symbol>`,
        examples: `${PREFIX}tokens default cake`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
