import config from "adapters/config"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbedOptions,
  MessageOptions,
} from "discord.js"
import { APIError } from "errors"
import { RunResult, MultipleResult } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"

export async function handle(
  msg: Message | CommandInteraction,
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  return {
    messageOptions: {
      embeds: [await composeDaoVoteInfoEmbed(msg.guildId ?? "")],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "Proposal",
            customId: `proposal-info_proposal`,
            style: "SECONDARY",
          }),
        ),
      ],
    },
  }
}

export async function composeDaoVoteInfoEmbed(
  guildId: string,
): Promise<MessageEmbedOptions> {
  const {
    ok,
    data,
    log,
    curl,
    status = 500,
    error,
  } = await config.getGuildConfigDaoProposal(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log, status, error })
  }
  if (!data) {
    return {
      title: `${getEmoji("MAIL")} No information found!`,
      description: `You haven't set up any proposal!\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} You can set up your DAO voting channel by \`$proposal set <#channel> <network> <token_contract>\``,
    }
  }
  let authority = data.authority ? data.authority.replace("_", " ") : ""
  if (data.authority) {
    authority = authority.charAt(0).toUpperCase() + authority.slice(1)
  }
  return {
    title: `${getEmoji("MAIL")} DAO voting information`,
    description: `${getEmoji("ANIMATED_POINTING_RIGHT", true)} **Channel**: <#${
      data.proposal_channel_id
    }>\n${getEmoji("ANIMATED_POINTING_RIGHT", true)} **Token**: ${
      data.symbol
    } (${shortenHashOrAddress(
      data.address,
    )}) - ${data.chain.toUpperCase()}\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true,
    )} **Proposal creator**: ${authority}\n${
      data.required_amount
        ? `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} **Minimum token amount**: ${data.required_amount}`
        : ""
    }`,
  }
}
