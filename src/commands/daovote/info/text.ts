import config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "daovote_info",
  command: "info",
  brief: "Daovote Info",
  category: "Defi",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const { ok, data, log, curl } = await config.getProposalChannelConfig(
      msg.guildId || ""
    )
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("mail")} No information found!`,
              description: `You haven't set up any proposal!\n${getEmoji(
                "pointright"
              )} You can set up your DAO voting channel by \`$daovote set <#channel> <network> <token_contract>\``,
            }),
          ],
        },
      }
    }
    let authority = data.authority ? data.authority.replace("_", " ") : ""
    if (data.authority) {
      authority = authority.charAt(0).toUpperCase() + authority.slice(1)
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("mail")} DAO voting information`,
            description: `${getEmoji("pointingright")} **Channel**: <#${
              data.proposal_channel_id
            }>\n${getEmoji("pointingright")} **Token**: ${
              data.symbol
            }\n${getEmoji(
              "pointingright"
            )} **Proposal creator**: ${authority}\n${
              data.required_amount
                ? `${getEmoji("pointingright")} **Minimum token amount**: ${
                    data.required_amount
                  }`
                : ""
            }`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}daovote info`,
        examples: `${PREFIX}daovote info`,
      }),
    ],
  }),
  colorType: "Defi",
  minArguments: 2,
}

export default command
