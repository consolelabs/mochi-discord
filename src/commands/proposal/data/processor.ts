import {
  MessageButton,
  MessageActionRow,
  Message,
  EmbedFieldData,
  ButtonInteraction,
  MessageSelectMenu,
  CommandInteraction,
} from "discord.js"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { wrapError } from "utils/wrap-error"
import config from "adapters/config"
import { getPaginationRow } from "ui/discord/button"
import { listenForPaginateAction } from "handlers/discord/button"
import community from "adapters/community"
import { PROPOSAL_INTERNAL_CHANNEL_ID } from "env"
import { DOT } from "utils/constants"

export async function process(message: Message | CommandInteraction) {
  // Just been used in mochi internal channel
  if (message.channelId !== PROPOSAL_INTERNAL_CHANNEL_ID) {
    return
  }
  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message: message })
  }
  const isTextCommand = message instanceof Message
  const userId = isTextCommand ? message.author.id : message.user.id
  const viewType = {
    serverSpace: "server_space",
    proposalTracker: "proposalTracker",
  }
  let currentView = viewType.serverSpace
  const collectorTimeout = 60_000
  const switchViewPrefixId = "proposal-data-switch-view-button"
  const serverSelectMenuId = "server-space-select-menu"

  const switchViewRow = () => {
    const switchServerSpaceButton = new MessageButton({
      label: "Server Space",
      customId: `${switchViewPrefixId}/${viewType.serverSpace}`,
      style: "SECONDARY",
      disabled: currentView === viewType.serverSpace,
    })
    const switchProposalTrackerButton = new MessageButton({
      label: "Proposal Tracker",
      customId: `${switchViewPrefixId}/${viewType.proposalTracker}`,
      style: "SECONDARY",
      disabled: currentView === viewType.proposalTracker,
    })
    return new MessageActionRow().addComponents([
      switchServerSpaceButton,
      switchProposalTrackerButton,
    ])
  }

  const composeServerSpaceView = async (pageIndex: number) => {
    const pageSize = 20
    const resp = await config.getProposalUsageStats({
      page: pageIndex,
      size: pageSize,
    })
    if (!resp.ok) {
      throw new APIError({
        error: resp.error,
        curl: resp.curl,
        description: resp.log,
        status: resp.status ?? 500,
      })
    }
    const { metadata, data = [] } = resp.data
    const { name, number, status } = data.reduce(
      (previous: any, current: any) => ({
        name: `${previous.name}\n${
          message.client.guilds.cache.get(current.guild_id ?? "")?.name ??
          current.guild_name ??
          "-"
        }`,
        number: `${previous.number}\n${current.proposal_count}`,
        status: `${previous.status}\n${
          current.is_active ? "In use" : "Deleted"
        }`,
      }),
      { name: "", number: "", status: "" },
    )
    const fields: EmbedFieldData[] = [
      { name: "Server name", value: name, inline: true },
      { name: "Number of proposal", value: number, inline: true },
      { name: "Status", value: status, inline: true },
    ]
    const totalPage = Math.ceil((metadata?.total ?? 0) / pageSize)
    const embed = composeEmbedMessage(null, {
      title: "All Proposals Space created by Mochi",
      footer: totalPage > 1 ? [`Page ${pageIndex + 1} / ${totalPage}`] : [],
    }).addFields(fields)
    const serverOpts = data.map((stats: any) => ({
      label: stats.guild_name ?? "-",
      value: `${stats.guild_name ?? "-"}/${stats.guild_id}`,
    }))
    const selectSeverRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(serverSelectMenuId)
        .setPlaceholder("Select server")
        .addOptions(serverOpts),
    )
    return {
      embeds: [embed],
      components: [
        ...getPaginationRow(pageIndex, totalPage),
        selectSeverRow,
        switchViewRow(),
      ],
    }
  }

  const composeDaoProposalsView = async ({
    guildId,
    guildName,
  }: {
    guildId: string
    guildName: string
  }) => {
    const {
      ok,
      data,
      error,
      curl,
      log,
      status = 500,
    } = await community.getDaoProposals({
      guild_id: guildId,
    })
    if (!ok) {
      throw new APIError({
        error: error,
        curl: curl,
        description: log,
        status,
      })
    }
    const description = data.reduce(
      (previous: any, current: any, index: any) => {
        return `${previous}\n**${index + 1}.**  ${current.title}`
      },
      "Type the number of the proposal you want to check.",
    )
    const embed = composeEmbedMessage(null, {
      title: `${guildName}'s proposals`,
      description: description,
    })
    return {
      embeds: [embed],
      components: [],
      data,
    }
  }

  const composeProposalResultView = async ({
    proposalId,
    creatorId,
  }: {
    proposalId: string
    creatorId: string
  }) => {
    const {
      data,
      ok,
      error,
      curl,
      status = 500,
    } = await community.getProposalResults(proposalId, creatorId)
    if (!ok) {
      throw new APIError({ curl, description: error, status })
    }

    const voteYes = data.proposal?.points?.find((votes: any) => {
      return votes.choice === "Yes"
    })
    const voteNo = data.proposal?.points?.find((votes: any) => {
      return votes.choice === "No"
    })
    const voteAbstain = data.proposal?.points?.find((votes: any) => {
      return votes.choice === "Abstain"
    })
    const yesCount = voteYes?.sum ?? 0
    const noCount = voteNo?.sum ?? 0
    const absCount = voteAbstain?.sum ?? 0
    const voteTotal = yesCount + noCount + absCount
    const yesPercent =
      voteTotal > 0 ? `${((yesCount / voteTotal) * 100).toFixed(2)}%` : "0%"
    const noPercent =
      voteTotal > 0 ? `${((noCount / voteTotal) * 100).toFixed(2)}%` : "0%"
    const absPercent =
      voteTotal > 0 ? `${((absCount / voteTotal) * 100).toFixed(2)}%` : "0%"
    const timeStart = Math.floor(
      (data.proposal?.created_at
        ? Date.parse(data.proposal?.created_at)
        : Date.now()) / 1000,
    )
    const timeClose = Math.floor(
      (data.proposal?.closed_at
        ? Date.parse(data.proposal.closed_at)
        : Date.now()) / 1000,
    )
    const embed = composeEmbedMessage(null, {
      title: data.proposal?.title ?? "NA",
      description: `
      ${DOT} ${data.proposal?.description ?? "NA"}
      ${DOT} Voting round is from <t:${timeStart}> to <t:${timeClose}>
      ${DOT} Voting result: \`${yesPercent}\` **Yes**, \`${noPercent}\` **No**, \`${absPercent}\` **Abstain**
      `,
    })
    return {
      embeds: [embed],
    }
  }

  const composeProposalTrackerView = async (pageIndex: number) => {
    const pageSize = 20
    const resp = await config.getDaoTrackerUsageStats({
      page: pageIndex,
      size: pageSize,
    })
    if (!resp.ok) {
      throw new APIError({
        error: resp.error,
        curl: resp.curl,
        description: resp.log,
        status: resp.status ?? 500,
      })
    }
    const { metadata, data = [] } = resp.data
    const { name, number, platform } = data.reduce(
      (previous: any, current: any) => ({
        name: `${previous.name}\n${current.space}`,
        number: `${previous.number}\n${current.count}`,
        platform: `${previous.platform}\n${current.source}`,
      }),
      { name: "", number: "", platform: "" },
    )
    const fields: EmbedFieldData[] = [
      { name: "DAO space", value: name, inline: true },
      { name: "Number of server tracking", value: number, inline: true },
      { name: "Platform", value: platform, inline: true },
    ]
    const totalPage = Math.ceil((metadata?.total ?? 0) / pageSize)
    const embed = composeEmbedMessage(null, {
      title: "All proposal tracker",
      footer: totalPage > 1 ? [`Page ${pageIndex + 1} / ${totalPage}`] : [],
    }).addFields(fields)
    return {
      embeds: [embed],
      components: [...getPaginationRow(pageIndex, totalPage), switchViewRow()],
    }
  }

  const composeCurrentView = async (pageIndex: number) => {
    if (currentView === viewType.serverSpace) {
      return await composeServerSpaceView(pageIndex)
    }
    return await composeProposalTrackerView(pageIndex)
  }

  const switchView = async (i: ButtonInteraction) => {
    currentView = i.customId.split("/").pop() ?? viewType.serverSpace
    const { embeds, components } = await composeCurrentView(0)
    await i.deferUpdate()
    await i.editReply({ embeds, components })
  }

  const collectSwitchViewButton = (msg: Message) => {
    return msg
      .createMessageComponentCollector({
        componentType: "BUTTON",
        idle: collectorTimeout,
        filter: (i) =>
          i.user.id === userId && i.customId.startsWith(switchViewPrefixId),
      })
      .on("collect", (i) => {
        wrapError(message, async () => {
          await switchView(i)
        })
      })
      .on("end", () => {
        msg.edit({ components: [] }).catch(() => null)
      })
  }

  const collectPaginationButton = (msg: Message) => {
    const render = async (pageIdx: number) => {
      const { embeds, components } = await composeCurrentView(pageIdx)
      return {
        messageOptions: {
          embeds,
          components,
        },
      }
    }
    listenForPaginateAction(
      msg,
      message,
      render,
      false,
      true,
      (i) => i.user.id === userId && i.customId.startsWith("page"),
    )
  }

  const collectServerSelectMenu = (msg: Message) => {
    return msg
      .createMessageComponentCollector({
        componentType: "SELECT_MENU",
        idle: collectorTimeout,
        filter: (i) =>
          i.user.id === userId && i.customId.startsWith(serverSelectMenuId),
      })
      .on("collect", (i) => {
        wrapError(message, async () => {
          const [guildName, guildId] = i.values[0].split("/")
          const { embeds, components, data } = await composeDaoProposalsView({
            guildId,
            guildName,
          })
          return msg
            .reply({ embeds, components })
            .then((message) => {
              return message.channel.awaitMessages({
                max: 1,
                time: collectorTimeout,
                filter: (m) => m.author.id === userId,
              })
            })
            .then(async (collector) => {
              const proposalIndexArg = collector.first()?.content.trim() ?? 1
              const proposalIndex = +proposalIndexArg - 1
              if (
                Number.isNaN(proposalIndex) ||
                !Number.isInteger(proposalIndex) ||
                proposalIndex < 0 ||
                proposalIndex >= Infinity
              ) {
                const embed = getErrorEmbed({
                  title: "Command error",
                  description: "Please enter the valid number",
                })
                collector.first()?.reply({ embeds: [embed] })
                return
              }
              const proposal = data[proposalIndex]
              const { embeds } = await composeProposalResultView({
                proposalId: proposal.id ? `${proposal.id}` : "",
                creatorId: proposal.creator_id ?? "",
              })
              collector.first()?.reply({ embeds })
            })
        })
      })
      .on("end", () => {
        msg.edit({ components: [] }).catch(() => null)
      })
  }

  const { embeds, components } = await composeCurrentView(0)

  const replyMsg = isTextCommand
    ? await message.reply({ embeds, components })
    : await message.followUp({ embeds, components })

  if (replyMsg instanceof Message) {
    collectSwitchViewButton(replyMsg)
    collectPaginationButton(replyMsg)
    collectServerSelectMenu(replyMsg)
  }
  return null
}
