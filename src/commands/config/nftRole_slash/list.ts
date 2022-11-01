import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import Config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { APIError } from "errors"
import { ResponseListGuildGroupNFTRolesResponse } from "types/api"
import { SlashCommand } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { NFT_ROLE_GITBOOK, SLASH_PREFIX as PREFIX } from "utils/constants"
import { composeEmbedMessage2, getErrorEmbed } from "utils/discordEmbed"

export function list({ data }: ResponseListGuildGroupNFTRolesResponse) {
  let description
  if (data?.length === 0) {
    description = `No nft roles found! To set a new one, run \`\`\`${PREFIX}nftrole set <role> <amount> <nft_address1,nft_address2>\`\`\``
  } else {
    description = data
      ?.sort(
        (c1, c2) => (c1.number_of_tokens ?? 0) - (c2.number_of_tokens ?? 0)
      )
      ?.map(
        (c) =>
          `<@&${c.role_id}> - requires \`${
            c.number_of_tokens
          }\` tokens\n${c.nft_collection_configs
            ?.map(
              (nftCol) =>
                `${getEmoji("blank")}${getEmoji("reply")}[\`${
                  nftCol.symbol?.toUpperCase() ?? ""
                } ${shortenHashOrAddress(nftCol.address ?? "")}${
                  nftCol.chain_name
                    ? ` (${nftCol.chain_name.toUpperCase()})`
                    : ""
                }\`](${nftCol.explorer_url || "https://getmochi.co/"})`
            )
            .join("\n")}`
      )
      .join("\n\n")
  }
  return description
}

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Get server's nftroles configuration")
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

    const res = await Config.getGuildNFTRoleConfigs(interaction.guildId)
    if (!res.ok) {
      throw new APIError({
        user: interaction.user,
        guild: interaction.guild,
        curl: res.curl,
        description: res.log,
      })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage2(interaction, {
            author: [
              `${interaction.guild.name}'s nft roles`,
              interaction.guild.iconURL(),
            ],
            description: list(res),
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}nftrole list`,
        examples: `${PREFIX}nftrole list`,
        document: `${NFT_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
