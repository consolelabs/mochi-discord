import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "discord/embed/ui"
import config from "../../../adapters/config"
import { list } from "commands/nft-role/processor"

const command: SlashCommand = {
  name: "set",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription(
        "Set a role that users will get when they own specific amount of NFT"
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("role which you want to configure")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("number of nft addresses")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("addresses")
          .setDescription("nft addresses")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("tokenid")
          .setDescription("id of token")
          .setRequired(false)
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
    const amount = interaction.options.getNumber("amount", true)
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
      guild_id: interaction.guildId,
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
                description: list(configs).description,
                originalMsgAuthor: interaction.user,
              }),
            ],
          },
        }
      } else {
        return {
          messageOptions: {
            embeds: [getErrorEmbed({})],
          },
        }
      }
    } else {
      let description
      if (res.error.toLowerCase().includes("role has been used")) {
        description = res.error
      }
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description,
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
        usage: `${PREFIX}nftrole set <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]\n${PREFIX}nftrole set <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]`,
        examples: `${PREFIX}nftrole set @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73\n${PREFIX}nftrole set @SeniorMochian 100 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73,0xFBde54764f51415CB0E00765eA4383bc90EDCCE8`,
        document: `${NFT_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
