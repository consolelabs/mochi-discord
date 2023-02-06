import config from "adapters/config"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbedOptions,
  MessageOptions,
} from "discord.js"
import { APIError } from "errors"
import { ModelGuildConfigDaoTracker } from "types/api"
import { RunResult, MultipleResult } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { PREFIX } from "utils/constants"

export async function handle(
  msg: Message | CommandInteraction
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
            style: "PRIMARY",
          })
        ),
      ],
    },
  }
}

export async function handleDaoTrackerView(i: ButtonInteraction) {
  if (!i.guild) return
  if (i.customId.split("_")[1] === "daovote") {
    const row = new MessageActionRow().addComponents(
      new MessageButton({
        label: "Proposal",
        customId: `proposal-info_proposal`,
        style: "PRIMARY",
      })
    )
    await i.update({
      embeds: [await composeDaoVoteInfoEmbed(i.guild.id)],
      components: [row],
    })
    return
  } else {
    const row = new MessageActionRow().addComponents(
      new MessageButton({
        label: "Info",
        customId: `proposal-info_daovote`,
        style: "PRIMARY",
      })
    )
    await i.update({
      embeds: [await composeProposalInfoEmbed(i.guild.id)],
      components: [row],
    })
  }
}

export async function composeDaoVoteInfoEmbed(
  guildId: string
): Promise<MessageEmbedOptions> {
  const { ok, data, log, curl } = await config.getProposalChannelConfig(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  if (!data) {
    return {
      title: `${getEmoji("mail")} No information found!`,
      description: `You haven't set up any proposal!\n${getEmoji(
        "pointingright"
      )} You can set up your DAO voting channel by \`$proposal set <#channel> <network> <token_contract>\``,
    }
  }
  let authority = data.authority ? data.authority.replace("_", " ") : ""
  if (data.authority) {
    authority = authority.charAt(0).toUpperCase() + authority.slice(1)
  }
  return {
    title: `${getEmoji("mail")} DAO voting information`,
    description: `${getEmoji("pointingright")} **Channel**: <#${
      data.proposal_channel_id
    }>\n${getEmoji("pointingright")} **Token**: ${
      data.symbol
    } (${shortenHashOrAddress(
      data.address
    )}) - ${data.chain.toUpperCase()}\n${getEmoji(
      "pointingright"
    )} **Proposal creator**: ${authority}\n${
      data.required_amount
        ? `${getEmoji("pointingright")} **Minimum token amount**: ${
            data.required_amount
          }`
        : ""
    }`,
  }
}

export async function composeProposalInfoEmbed(
  guildId: string
): Promise<MessageEmbedOptions> {
  const { ok, data, log, curl } = await config.getDaoTrackerConfigs(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  if (!data) {
    return {
      title: `${getEmoji("mail")} No tracker found!`,
      description: `You haven't set up any tracker!\n${getEmoji(
        "pointingright"
      )} You can set up your DAO voting channel by \`${PREFIX}proposal track #channel <snapshot_DAO_link>\``,
    }
  }
  const description = data
    ?.map(
      (c: ModelGuildConfigDaoTracker) =>
        `<#${c.channel_id ?? ""}>\n${getEmoji("blank")}${getEmoji(
          "reply"
        )} [${c.space?.toUpperCase()}](https://snapshot.org/#/${c.space})`
    )
    .join("\n\n")
  return {
    title: `${getEmoji("MAIL")} Proposal Tracker`,
    description,
  }
}
