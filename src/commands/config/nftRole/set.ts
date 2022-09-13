import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import Config from "../../../adapters/config"
import { list } from "./list"

const command: Command = {
  id: "nr_set",
  command: "set",
  brief: "Set a role that users will get when they own specific amount of NFT",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    const [, roleArg, amountArg, nftAddressesArg, tokenId] = args.slice(1)
    const nftAddresses = nftAddressesArg.split(",")
    if (!roleArg.startsWith("<@&") || !roleArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid role" })],
        },
      }
    }
    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Role not found" })],
        },
      }
    }

    const amount = +amountArg
    if (Number.isNaN(amount) || amount < 0 || amount >= Infinity)
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Amount has to be a positive number",
            }),
          ],
        },
      }

    const nfts: any[] = await Config.getAllNFTCollections()
    const nft = nfts.find((nft) => nftAddresses.includes(nft.address))
    if (!nft) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Unsupported NFT Address",
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
              msg,
              description: "Token ID is required for ERC-1155 NFT",
            }),
          ],
        },
      }
    }

    const res = await Config.newGuildNFTRoleConfig({
      guild_id: msg.guildId,
      role_id: roleId,
      group_name: role.name,
      collection_address: nftAddresses,
      number_of_tokens: amount,
    })

    if (res.ok) {
      const configs = await Config.getGuildNFTRoleConfigs(msg.guildId)
      if (configs.ok) {
        const description = list(configs)
        return {
          messageOptions: {
            embeds: [
              getSuccessEmbed({
                msg,
                title: `Added new role config ${role.name}`,
                description,
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
          embeds: [getErrorEmbed({ msg, description })],
        },
      }
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]\n${PREFIX}nftrole <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]`,
        examples: `${PREFIX}nftrole @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73\n${PREFIX}nr @SeniorMochian 100 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73,0xFBde54764f51415CB0E00765eA4383bc90EDCCE8`,
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 4,
}

export default command
