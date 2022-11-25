import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: Command = {
  id: "moniker_remove",
  command: "remove",
  brief: "Remove a moniker configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const moniker = args.slice(2).join(" ").trim()
    const payload: RequestDeleteMonikerConfigRequest = {
      guild_id: msg.guild.id,
      moniker,
    }
    const { ok, log, curl } = await config.deleteMonikerConfig(payload)
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${getEmoji("approve")} Successfully removed`,
            description: `**${moniker}** is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. ${getEmoji(
              "bucket_cash",
              true
            )}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}monikers remove <moniker>`,
          examples: `${PREFIX}monikers remove cup of coffee`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
