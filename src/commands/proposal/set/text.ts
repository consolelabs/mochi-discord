import { Message, SelectMenuInteraction } from "discord.js"
import config from "adapters/config"
import { APIError, CommandArgumentError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji, isAddress, msgColors } from "utils/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { InteractionHandler } from "handlers/discord/select-menu"
import { PREFIX } from "utils/constants"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

const command: Command = {
  id: "proposal_set",
  command: "set",
  brief: "Configuration channel proposal",
  onlyAdministrator: true,
  category: "Config",
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }

    const {
      ok,
      data,
      curl,
      log,
      error,
      status = 500,
    } = await config.getGuildConfigDaoProposal(msg.guild.id)
    if (!ok) {
      throw new APIError({ curl, description: log, error, status })
    }
    // already config
    if (data !== null) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Proposal channel already set!",
              description: `${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true,
              )} Run \`${PREFIX}proposal remove\` to remove existing config before setting a new one.`,
            }),
          ],
        },
      }
    }
    // $proposal set <#channel> <network> <token_contract>
    // $proposal set #channel evm 0xad29abb318791d579433d831ed122afeaf29dcfe
    const args = getCommandArguments(msg)
    const [channel, chain = "", contract = ""] = args.slice(2)
    if (contract.length && !isAddress(contract).valid) {
      throw new CommandArgumentError({
        message: msg,
        description: "Invalid contract address",
        getHelpMessage: async () => ({
          embeds: [
            getErrorEmbed({
              title: "Invalid argument",
              description: "Please input a valid evm address",
            }),
          ],
        }),
      })
    }
    const { isChannel, value: channelId } = parseDiscordToken(channel)
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("REVOKE")} Invalid channels`,
              description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true,
              )} Type # to see the channel list.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true,
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
          value: `admin-${channelId}-${chain}-${contract}`,
        },
        {
          label: "NFT holder",
          value: `nft_collection-${channelId}-${chain}-${contract}`,
        },
        {
          label: "Crypto holder",
          value: `crypto_holder-${channelId}-${chain}-${contract}`,
        },
      ],
    })
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            description: `${getEmoji(
              "DEFI",
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
          usage: `${PREFIX}proposal set <#channel> <network> <token_contract>\n${PREFIX}proposal set <#channel>`,
          examples: `${PREFIX}proposal set #channel eth 0xad29abb318791d579433d831ed122afeaf29dcfe\n ${PREFIX}proposal set #channel`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const input = interaction.values[0]
  const [authority, channelId, chain, contract] = input.split("-")
  if (authority === "admin") {
    const {
      ok,
      log,
      curl,
      status = 500,
      error,
    } = await config.createProposalChannel({
      guild_id: interaction.guildId || "",
      channel_id: channelId,
      authority,
      chain,
      address: contract,
    })
    if (!ok) {
      throw new APIError({ curl, description: log, status, error })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: `${getEmoji("CHECK")} Successfully set`,
            description: `${getEmoji(
              "POINTINGRIGHT",
            )} All proposals will be posted and voted in the <#${channelId}>`,
            color: msgColors.SUCCESS,
          }),
        ],
        components: [],
      },
    }
  }
  // token holder options but missing args
  if (!chain || !contract) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "Missing arguments",
            description: "Make sure you input both chain and contract address",
          }),
        ],
        components: [],
      },
    }
  }
  // check chain is valid
  const supportedChains = await config.getAllChains()
  const chainCurrencies = supportedChains.map((chain: { currency: string }) => {
    return chain.currency.toUpperCase()
  })
  const chainIds = supportedChains.map((chain: { id: string }) => {
    return chain.id
  })

  const isValidChain =
    chainIds.includes(chainIds) || chainCurrencies.includes(chain.toUpperCase())

  if (!chain || !isValidChain) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: `${getEmoji("REVOKE")} Unsupported chain`,
            description:
              "The chain hasn't been supported. Take a look at our supported chain by `$token list`",
          }),
        ],
      },
    }
  }

  await interaction.update({
    embeds: [
      composeEmbedMessage(null, {
        title: `${getEmoji(
          "ANIMATED_QUESTION_MARK",
          true,
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
            title: `${getEmoji("REVOKE")} Invalid amount`,
          }),
        ],
      },
    }
  }

  const proposalResp = await config.createProposalChannel({
    guild_id: interaction.guildId || "",
    channel_id: channelId,
    authority: "token_holder",
    type: authority == "nft_collection" ? "nft_collection" : "crypto_token",
    chain,
    address: contract,
    required_amount: amount,
  })

  if (!proposalResp.ok) {
    switch (proposalResp.error) {
      case "Invalid token contract 400":
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                title: `${getEmoji("REVOKE")} Invalid Contract`,
                description:
                  "Can't find the token contract. Please choose the valid one!",
              }),
            ],
          },
        }
      case "Invalid chain 400":
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                title: `${getEmoji("REVOKE")} Unsupported network`,
                description: `${getEmoji(
                  "ANIMATED_POINTING_RIGHT",
                  true,
                )} Only tokens on EVM, Polygon, and Solana are supported. You can choose one of these networks.`,
              }),
            ],
          },
        }
      default:
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                title: `${getEmoji("REVOKE")} Internal Error`,
                description: proposalResp.error,
              }),
            ],
          },
        }
    }
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("CHECK")} Successfully set`,
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} All proposals will be posted and voted in the <#${channelId}>`,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}

export default command
