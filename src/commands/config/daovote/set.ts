import { Message, SelectMenuInteraction } from "discord.js"
import config from "adapters/config"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"
import {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
} from "utils/discordEmbed"
import { InteractionHandler } from "utils/InteractionManager"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "daovote_set",
  command: "set",
  brief: "Configuration channel proposal",
  category: "Config",
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    // $daovote set <#channel> <network> <token_contract>
    // $daovote set #channel evm 0xad29abb318791d579433d831ed122afeaf29dcfe
    const args = getCommandArguments(msg)
    const { isChannel, value: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("revoke")} Invalid channels`,
              description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
                "pointingright"
              )} Type # to see the channel list.\n${getEmoji(
                "pointingright"
              )} To add a new channel: 1. Create channel → 2. Confirm`,
            }),
          ],
        },
      }
    }
    const selectRow = composeDiscordSelectionRow({
      customId: "daovote_set",
      placeholder: "Choose who can post proposals",
      options: [
        {
          label: "Admin",
          value: `admin-${channelId}-${args[3]}-${args[4]}`,
        },
        {
          label: "Token holder",
          value: `token_holder-${channelId}-${args[3]}-${args[4]}`,
        },
      ],
    })
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            description: `${getEmoji(
              "defi"
            )} Please choose who can post proposals`,
          }),
        ],
        components: [selectRow, composeDiscordExitButton(msg.author.id)],
      },
      interactionOptions: { handler },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}daovote set <#channel> <network> <token_contract>`,
          examples: `${PREFIX}daovote set #channel eth 0xad29abb318791d579433d831ed122afeaf29dcfe`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 5,
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const input = interaction.values[0]
  const [authority, channelId, chain, contract] = input.split("-")
  if (authority === "admin") {
    const { ok, log, curl } = await config.createProposalChannel({
      guild_id: interaction.guildId || "",
      channel_id: channelId,
      authority,
      chain,
      address: contract,
    })
    if (!ok) {
      throw new APIError({ curl, description: log })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("approve")} Successfully set`,
            description: `${getEmoji(
              "point_right"
            )} All proposals will be posted and voted in the <#${channelId}>`,
          }),
        ],
        components: [],
      },
    }
  }
  await interaction.update({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "question"
        )} Please enter the minimum token amount to post the proposal`,
      }),
    ],
    components: [],
  })
  const filter = (collected: Message) =>
    collected.author.id === interaction.user.id
  const collected = await interaction.channel?.awaitMessages({
    max: 1,
    filter,
  })
  const amountStr = collected?.first()?.content?.trim() ?? ""
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("revoke")} Invalid amount`,
          }),
        ],
      },
    }
  }
  const { ok, log, curl, error } = await config.createProposalChannel({
    guild_id: interaction.guildId || "",
    channel_id: interaction.channelId,
    authority,
    type: "nft_collection",
    chain,
    address: contract,
    required_amount: amount,
  })
  if (!ok) {
    switch (error) {
      case "Invalid token contract":
        throw new InternalError({
          title: `${getEmoji("revoke")} Invalid Contract`,
          description:
            "Can't find the token contract. Please choose the valid one!",
        })
      case "Invalid chain":
        throw new InternalError({
          title: `${getEmoji("revoke")} Unsupported network`,
          description: `${getEmoji(
            "pointingright"
          )} Only tokens on EVM, Polygon, and Solana are supported. You can choose one of these networks.`,
        })
      default:
        throw new APIError({ curl, description: log })
    }
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("approve")} Successfully set`,
          description: `${getEmoji(
            "point_right"
          )} All proposals will be posted and voted in the <#${channelId}>`,
        }),
      ],
    },
  }
}

export default command
