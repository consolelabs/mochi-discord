import { Message } from "discord.js"
import { CommandArgumentError, GuildIdNotFoundError, APIError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleSetMoniker } from "./processor"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_MONIKER,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { SendActivityMsg } from "utils/activity"

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

    const dataProfile = await profile.getByDiscord(msg.author.id)
    if (dataProfile.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
        curl: "",
      })
    }
    const kafkaMsg: KafkaQueueActivityDataCommand = {
      platform: "discord",
      activity: {
        profile_id: dataProfile.id,
        status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
        platform: MOCHI_APP_SERVICE,
        action: MOCHI_ACTION_MONIKER,
        content: {
          username: "",
          amount: "",
          token: "",
          server_name: "",
          number_of_user: "",
          role_name: "",
          channel_name: "",
          token_name: payload.token.toUpperCase(),
          moniker_name: "",
          address: "",
        },
      },
    }
    SendActivityMsg(kafkaMsg)
    return await handleSetMoniker(payload)
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
