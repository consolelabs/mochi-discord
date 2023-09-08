import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX } from "utils/constants"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import config from "adapters/config"
import { list } from "../processor"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that users will get when they own specific amount of NFT",
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("number of nfts")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("addresses")
          .setDescription("nft addresses")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("tokenid")
          .setDescription("id of token")
          .setRequired(false),
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a guild",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const nftAddresses = interaction.options
      .getString("addresses", true)
      .split(",")
    const tokenId = interaction.options.getString("tokenid", false)
    const role = interaction.options.getRole("role", true)
    const amount = interaction.options.getInteger("amount", true)
    if (Number.isNaN(amount) || amount < 0 || amount >= Infinity)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Amount has to be a positive number",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }

    const nfts: any[] = await config.getAllNFTCollections()
    const nft = nfts.find((nft) => nftAddresses.includes(nft.address))
    if (!nft) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Unsupported NFT Address",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    if (nft.erc_format == "1155" && !tokenId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "Token ID is required for ERC-1155 NFT",
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }

    const res = await config.newGuildNFTRoleConfig({
      guildID: interaction.guildId,
      role_id: role.id,
      group_name: role.name,
      collection_address: nftAddresses,
      number_of_tokens: amount,
    })

    if (res.ok) {
      const configs = await config.getGuildNFTRoleConfigs(interaction.guildId)
      if (configs.ok) {
        return {
          messageOptions: {
            embeds: [
              getSuccessEmbed({
                title: `Successfully configured ${role.name}!`,
                description: (await list(configs)).description,
                originalMsgAuthor: interaction.user,
              }),
            ],
          },
        }
      } else {
        return {
          messageOptions: {
            embeds: [getErrorEmbed({ description: configs.error })],
          },
        }
      }
    } else {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: res.error,
              originalMsgAuthor: interaction.user,
            }),
          ],
        },
      }
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}role nft set <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]`,
        examples: `${SLASH_PREFIX}role nft set @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73`,
        document: `${NFT_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
