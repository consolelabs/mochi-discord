import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, CommandArgumentError, GuildIdNotFoundError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "moniker_set",
  command: "set",
  brief: "Set up a new moniker configuration.",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const regex = /[\d|,|.]+/g
    const amountStr = msg.content.match(regex)?.[0].toString() ?? ""
    if (!amountStr) {
      throw new CommandArgumentError({
        message: msg,
        description: "Amount token is not valid",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    const amount = +amountStr
    const amountIdx = args.indexOf(amountStr)
    const token = args[amountIdx + 1].toUpperCase()
    const moniker = args.slice(2, amountIdx).join(" ").trim()
    const payload: RequestUpsertMonikerConfigRequest = {
      guild_id: msg.guildId,
      moniker,
      amount,
      token,
    }
    const { ok, log, curl } = await config.setMonikerConfig(payload)
    if (!ok) {
      throw new APIError({ description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${getEmoji("approve")} Moniker successfully set`,
            description: `1 **${moniker}** is set as ${amount} **${token}**. To tip your friend moniker, use $tip <@users> <amount> <moniker> . ${getEmoji(
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
          description: "Set a new moniker configuration for your server.",
          usage: `${PREFIX}monikers set <moniker> <amount_token> <token>`,
          examples: `${PREFIX}moniker set cup of coffee 0.01 bnb`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  minArguments: 5,
  colorType: "Server",
}

export default command
