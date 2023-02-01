import community from "adapters/community"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { APIError } from "errors"
import client from "index"
import NodeCache from "node-cache"
import { ModelDaoProposalVoteCount } from "types/api"
import { defaultEmojis, getEmoji } from "utils/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { composeButtonLink } from "ui/discord/button"

let proposalTitle = ""
let proposalDesc = ""
let proposalExpireIn = ""

export const proposalCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 60,
  useClones: false,
})

export async function handleProposalCancel(i: ButtonInteraction) {
  i.deferUpdate()
  const channelId = i.customId.split("-")[2]
  const msg = i.message as Message
  msg.edit({
    embeds: [
      getErrorEmbed({
        title: "Proposal canceled",
        description: `The proposal is canceled. Start a new proposal in the <#${channelId}>`,
      }),
    ],
    components: [],
  })
}

function composeProposalCancelButton(guidelineId: string): MessageButton {
  return new MessageButton({
    customId: `proposal-cancel-${guidelineId}`,
    emoji: getEmoji("revoke"),
    style: "SECONDARY",
    label: "Cancel",
  })
}

// clicked from DM
export async function handleProposalCreate(i: ButtonInteraction) {
  i.deferUpdate()
  const args = i.customId.split("-")
  const guild_id = args[2]
  const duration = args[3]

  // get dao voting channel configs
  const {
    data: cfgData,
    ok: cfgOk,
    error: cfgErr,
    curl: cfgCurl,
  } = await community.getGuildConfigDaoProposal(guild_id)
  if (!cfgOk) {
    throw new APIError({ curl: cfgCurl, error: cfgErr })
  }

  // create proposal, generate discussion channel and get id
  const { data, ok, error, curl } = await community.createProposal({
    creator_id: i.user.id,
    description: proposalDesc,
    guild_id,
    title: proposalTitle,
    voting_channel_id: cfgData.proposal_channel_id ?? "",
  })
  if (!ok) {
    throw new APIError({ curl, error })
  }

  await i.editReply({
    embeds: [
      getSuccessEmbed({
        title: "Proposal successfully submitted",
        description: `${defaultEmojis.POINT_RIGHT} Your proposal has been recorded in the <#${cfgData.proposal_channel_id}>.\n${defaultEmojis.POINT_RIGHT} You can create a new proposal in the <#${cfgData.guideline_channel_id}>.\n${defaultEmojis.POINT_RIGHT} You can join the discussion about your proposal in the <#${data.discussion_channel_id}>`,
      }),
    ],
    components: [],
  })

  // interacted from DM, need to get guild client
  const guild = await client.guilds.fetch(guild_id)
  const proposalChannel = await guild.channels.fetch(
    cfgData.proposal_channel_id ?? ""
  )
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `proposal-vote-Yes-${data.id}-${i.user.id}`,
      style: "PRIMARY",
      label: "Yes",
    }),
    new MessageButton({
      customId: `proposal-vote-No-${data.id}-${i.user.id}`,
      style: "PRIMARY",
      label: "No",
    }),
    new MessageButton({
      customId: `proposal-vote-Abstain-${data.id}-${i.user.id}`,
      style: "PRIMARY",
      label: "Abstain",
    }),
    new MessageButton({
      style: MessageButtonStyles.LINK,
      label: "Discuss",
      url: `https://discord.com/channels/${guild_id}/${data.discussion_channel_id}`,
    })
  )

  // post proposal to channel
  if (proposalChannel?.type === "GUILD_TEXT") {
    const msg = await proposalChannel.send({
      content: `> @everyone vote for the new proposal`,
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("MAIL")} ${proposalTitle.toUpperCase()}`,
          description: `${proposalDesc}\n\nVoting will close at: <t:${proposalExpireIn}>`,
        }),
      ],
      components: [actionRow],
    })
    const cacheKey = `proposal-${msg.id}`
    proposalCache.set(cacheKey, [], +duration)
    await checkExpiredProposal(
      cacheKey,
      msg,
      data.id,
      data.creator_id,
      (+proposalExpireIn - +duration).toString(),
      proposalExpireIn,
      proposalTitle.toUpperCase()
    )
  }
}

async function checkExpiredProposal(
  cacheKey: string,
  msg: Message,
  proposal_id: string,
  creator_id: string,
  startTime: string,
  stopTime: string,
  title: string
) {
  proposalCache.on("expired", async (key) => {
    // get vote results
    const { data, ok, error, curl } = await community.getProposalResults(
      proposal_id,
      creator_id
    )
    if (!ok) {
      throw new APIError({ curl, error })
    }

    const voteYes = data.proposal.points.find(
      (votes: ModelDaoProposalVoteCount) => {
        return votes.choice === "Yes"
      }
    )
    const voteNo = data.proposal.points.find(
      (votes: ModelDaoProposalVoteCount) => {
        return votes.choice === "No"
      }
    )
    const voteAbstain = data.proposal.points.find(
      (votes: ModelDaoProposalVoteCount) => {
        return votes.choice === "Abstain"
      }
    )
    const yesCount = voteYes ? voteYes.sum : 0
    const noCount = voteNo ? voteNo.sum : 0
    const absCount = voteAbstain ? voteAbstain.sum : 0
    const voteTotal = yesCount + noCount + absCount
    if (key === cacheKey) {
      msg.edit({
        content: null,
        components: [],
      })
      await msg.channel.send({
        content: "> @everyone",
        embeds: [
          composeEmbedMessage(null, {
            title: `**${title}** Vote results`,
            description: `The vote result is recorded from <t:${startTime}> to <t:${stopTime}>\nYes: ${
              voteTotal > 0 ? ((yesCount / voteTotal) * 100).toFixed(2) : 0
            }% (${yesCount} votes)\nNo: ${
              voteTotal > 0 ? ((noCount / voteTotal) * 100).toFixed(2) : 0
            }% (${noCount} votes)\nAbstain: ${
              voteTotal > 0 ? ((absCount / voteTotal) * 100).toFixed(2) : 0
            }% (${absCount} votes)\n\nTotal votes: ${voteTotal}`,
          }),
        ],
        components: [],
      })
    }
  })
}

// clicked from guild
export async function handleProposalForm(i: ButtonInteraction) {
  await i.deferReply({ ephemeral: true })
  const guidelineChannelId = i.customId.split("-")[2]
  const authority = i.customId.split("-")[3]

  // check proposal requirements
  if (authority === "admin" && !i.memberPermissions?.has("ADMINISTRATOR")) {
    return await i
      .editReply({
        embeds: [
          getErrorEmbed({
            title: "Permissions required",
            description: `Only Administrators can use this command ${getEmoji(
              "NEKOSAD"
            )}.\nPlease contact your server admins if you need help.`,
          }),
        ],
      })
      .catch(() => null)
  }

  //check user's balance has met token requirements to post proposal
  if (authority === "tokenholder") {
    const { data, ok, error, curl, log } = await community.getDaoVoterStatus(
      null,
      i.user.id,
      i.guildId ?? "",
      "create_proposal"
    )
    if (!ok) {
      throw new APIError({ curl, description: log, error })
    }
    if (!data.is_wallet_connected) {
      await i
        .editReply({
          embeds: [
            getErrorEmbed({
              title: "Wallet not connected",
              description:
                "Please [Connect your wallet](https://mochi.gg/verify?code=30a5bf5f-20d2-434f-a20f-2c03dc5e386f) to gain the authority to create a proposal. ",
            }),
          ],
        })
        .catch(() => null)
      return
    }
    if (!data.is_qualified) {
      await i
        .editReply({
          embeds: [
            getErrorEmbed({
              title: "Insufficient token amount",
              description: `You need to own at least ${data.guild_config.required_amount} **${data.guild_config.symbol}** to post a proposal.`,
            }),
          ],
        })
        .catch((err) => console.log(err))
      return
    }
  }
  const dm = await i.user.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji("QUESTION")} Please enter your proposal title.`,
      }),
    ],
    components: [
      new MessageActionRow().addComponents(
        composeProposalCancelButton(guidelineChannelId)
      ),
    ],
  })

  await i.editReply({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji("MAIL")} Proposal Submission`,
        description:
          "The proposal submission will be processed in your DM. Please check your DM!",
      }),
    ],
    components: [composeButtonLink("See the DM", dm.url)],
  })

  // get data from dm messages
  proposalTitle = await getProposalTitle(i.user.id, guidelineChannelId, dm)
  proposalDesc = await getProposalDescription(i.user.id, guidelineChannelId, dm)
  const proposalDuration = (
    await getProposalDuration(i.user.id, dm)
  ).toLowerCase()
  const currentTime = Date.now()
  let durationSeconds = 0 // seconds vote available
  // duration ends in hH or dD
  if (proposalDuration.includes("h")) {
    const hours = parseInt(
      proposalDuration.slice(0, proposalDuration.length - 1)
    )
    proposalExpireIn = (
      Math.floor(currentTime / 1000) +
      hours * 3600
    ).toString()
    durationSeconds = hours * 3600
  } else {
    const days = parseInt(
      proposalDuration.slice(0, proposalDuration.length - 1)
    )
    proposalExpireIn = (
      Math.floor(currentTime / 1000) +
      days * 24 * 3600
    ).toString()
    durationSeconds = days * 24 * 3600
  }

  // send confirmation
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `proposal-confirm-${i.guildId}-${durationSeconds}`,
      style: "PRIMARY",
      label: "Submit",
    }),
    composeProposalCancelButton(guidelineChannelId)
  )
  await i.user.send({
    content: "> Proposal preview",
    embeds: [
      composeEmbedMessage(null, {
        title: proposalTitle,
        description: `${proposalDesc}\n\nVoting will close at: <t:${proposalExpireIn}>`,
      }),
    ],
    components: [actionRow],
  })
}

async function getProposalTitle(
  authorId: string,
  guidelineChannelId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // ask for description
  await dm.channel.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "QUESTION"
        )} Please enter your proposal description.`,
        description: "Word limit: 2000 words",
      }),
    ],
    components: [
      new MessageActionRow().addComponents(
        composeProposalCancelButton(guidelineChannelId)
      ),
    ],
  })
  return userReply?.content?.trim() ?? ""
}

async function getProposalDescription(
  authorId: string,
  guidelineChannelId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // ask for duration
  await dm.channel.send({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "QUESTION"
        )} Please enter the duration of your proposal.`,
        description: "You can enter the duration in hours or days (h, d)",
      }),
    ],
    components: [
      new MessageActionRow().addComponents(
        composeProposalCancelButton(guidelineChannelId)
      ),
    ],
  })
  return userReply?.content?.trim() ?? ""
}

async function getProposalDuration(
  authorId: string,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()

  // accept hours OR days
  const regex = /([1-9][0-9]*[hH])|([1-9][0-9]*[dD])/
  if (!userReply?.content.match(regex)) {
    await userReply?.reply({
      embeds: [
        getErrorEmbed({
          title: "Invalid duration",
          description: "Duration should be in h (hour) or d (day)",
        }),
      ],
    })
    await getProposalDuration(authorId, dm)
  }
  return userReply?.content?.trim() ?? ""
}
