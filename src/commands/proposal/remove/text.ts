import config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji, msgColors } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"

const command: Command = {
  id: "proposal_remove",
  command: "remove",
  brief: "Remove DAO vote channel",
  onlyAdministrator: true,
  category: "Config",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const {
      ok: okGet,
      data,
      log: logGet,
      curl: curlGet,
    } = await config.getProposalChannelConfig(msg.guildId || "")
    if (!okGet) {
      throw new APIError({
        msgOrInteraction: msg,
        description: logGet,
        curl: curlGet,
      })
    }
    if (data === null) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "No config found",
              description: `${getEmoji(
                "pointingright"
              )} You have no DAO voting channel config, you can create one by \`$proposal set <#channel> <chain/network> <token_contract>\``,
            }),
          ],
        },
      }
    }

    const { ok, log, curl } = await config.deleteProposalChannelConfig({
      id: `${data.id}`,
    })
    if (!ok) {
      throw new APIError({ msgOrInteraction: msg, description: log, curl })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Successfully remove the channel",
            description: `${getEmoji(
              "pointingright"
            )} You can create a new DAO voting channel by \`$proposal set <#channel> <chain/network> <token_contract>\``,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}proposal remove`,
          examples: `${PREFIX}proposal remove`,
        }),
      ],
    }
  },
  colorType: "Defi",
  minArguments: 2,
}

export default command
