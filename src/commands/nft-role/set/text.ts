import config from "adapters/config"
import { InternalError } from "errors"
import { list } from "commands/nft-role/processor"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"

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
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid role format",
        description: `Your role is in an invalid format. Make sure an “@” symbol is put before the role.\n\n${getEmoji(
          "POINTINGRIGHT"
        )} Type @ to see a role list.\n${getEmoji(
          "POINTINGRIGHT"
        )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
      })
    }
    const roleId = roleArg.substring(3, roleArg.length - 1)
    const role = await msg.guild.roles.fetch(roleId)
    if (!role) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: "Invalid roles",
              description: `Your role is invalid. Make sure that role exists, or that you have entered it correctly.\n\n${getEmoji(
                "POINTINGRIGHT"
              )} Type @ to see a role list.\n${getEmoji(
                "POINTINGRIGHT"
              )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
            }),
          ],
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
              description:
                "The amount is invalid. Please insert a natural number.",
            }),
          ],
        },
      }

    const nfts: any[] = await config.getAllNFTCollections()
    const nft = nfts.find((nft) => nftAddresses.includes(nft.address))
    if (!nft) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Unsupported NFT",
        description: `This collection has NOT been supported yet.\n\n${getEmoji(
          "POINTINGRIGHT"
        )} Please choose one in the \`$nft list\`.\n${getEmoji(
          "POINTINGRIGHT"
        )} To add your NFT, run \`$nft add\`.`,
      })
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

    const res = await config.newGuildNFTRoleConfig({
      guild_id: msg.guildId,
      role_id: roleId,
      group_name: role.name,
      collection_address: nftAddresses,
      number_of_tokens: amount,
    })

    if (res.ok) {
      const configs = await config.getGuildNFTRoleConfigs(msg.guildId)
      if (configs.ok) {
        const { description } = list(configs)
        return {
          messageOptions: {
            embeds: [
              getSuccessEmbed({
                msg,
                title: `Successfully configured ${role.name}!`,
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
      if (res.error.toLowerCase().includes("role has been used")) {
        throw new InternalError({
          msgOrInteraction: msg,
          title: "Duplicated roles",
          description: `Your role has been used for another role configuration. Please choose another role or remove the existing one using \`$nr remove\`.\n\n${getEmoji(
            "POINTINGRIGHT"
          )} Type @ to see a role list.\n${getEmoji(
            "POINTINGRIGHT"
          )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
        })
      }
      return {
        messageOptions: { embeds: [getErrorEmbed({ msg })] },
      }
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr set <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]\n${PREFIX}nftrole set <role> <amount> <nft_address1,nft_address2> [erc1155_token_id]`,
        examples: `${PREFIX}nftrole set @Mochi 1 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73\n${PREFIX}nr set @SeniorMochian 100 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73,0xFBde54764f51415CB0E00765eA4383bc90EDCCE8`,
        document: `${NFT_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
