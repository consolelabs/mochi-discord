import { CommandInteraction, MessageOptions } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import defi from "adapters/defi"
import moment from "moment-timezone"

const command: SlashCommand = {
  name: "info",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Information of a pair")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription(
            "token's addr, pair's addr, or symbol. Example: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }

    const symbol = interaction.options.getString("symbol", true)

    // const { base, target, isCompare, isFiat } = parseTickerQuery(symbol)
    // const { msgOpts } = await tickerRun(
    //   interaction,
    //   base,
    //   target,
    //   isCompare,
    //   isFiat,
    //   false,
    //   TickerView.Chart
    // )

    const msgOpts: MessageOptions = {
      embeds: [],
    }

    const { data } = await defi.searchDexPairs(symbol)

    const pairs = data?.pairs || []

    if (pairs.length === 0) {
      msgOpts.embeds?.push(
        composeEmbedMessage2(interaction, {
          color: "RED",
          title: "No pair found",
          description: "Please try again with another search",
        })
      )
      await interaction.editReply(msgOpts)
      return
    }

    const mostPopularPair = pairs[0]

    const msgEmbed = composeEmbedMessage2(interaction, {
      title: mostPopularPair.name,
      description: `**${mostPopularPair.base_token?.symbol}** \`\`\`${mostPopularPair.base_token?.address}\`\`\``,
    })

    msgEmbed.addFields([
      {
        name: "Created",
        value: moment(mostPopularPair.created_at).fromNow(),
        inline: true,
      },
      {
        name: "Chain",
        value: mostPopularPair.chain_id ? mostPopularPair.chain_id : "N/A",
        inline: true,
      },
      {
        name: "Dex",
        value: mostPopularPair.dex_id ? mostPopularPair.dex_id : "N/A",
        inline: true,
      },
      {
        name: "Market Cap",
        value: mostPopularPair.market_cap_usd
          ? `$${mostPopularPair.market_cap_usd.toFixed(2)}`
          : "N/A",
        inline: true,
      },
      {
        name: "Price",
        value: mostPopularPair.price_usd
          ? `$${mostPopularPair.price_usd.toFixed(2)}`
          : "N/A",
        inline: true,
      },
      {
        name: "Price Change (24h)",
        value: mostPopularPair.price_percent_change_24h
          ? `${mostPopularPair.price_percent_change_24h.toFixed(2)}%`
          : "N/A",
        inline: true,
      },
      {
        name: "Volume (24h)",
        value: mostPopularPair.volume_usd_24h
          ? `$${mostPopularPair.volume_usd_24h.toFixed(2)}`
          : "N/A",
        inline: true,
      },
      {
        name: "FDV",
        value: `$${
          mostPopularPair.fdv ? mostPopularPair.fdv.toFixed(2) : "N/A"
        }`,
        inline: true,
      },
      {
        name: "Liquidity",
        value: mostPopularPair.liquidity_usd
          ? `$${mostPopularPair.liquidity_usd.toFixed(2)}`
          : "N/A",
        inline: true,
      },
      {
        name: "Buys | Sells (24h)",
        value: `${mostPopularPair.txn_24h_buy || 0} | ${
          mostPopularPair.txn_24h_sell || 0
        }`,
        inline: true,
      },
    ])

    if (mostPopularPair.owner) {
      msgEmbed.addFields([
        {
          name: "Owner",
          value: mostPopularPair.owner,
          inline: true,
        },
      ])
    }

    if (mostPopularPair.holders && mostPopularPair.holders.length > 0) {
      msgEmbed.addFields([
        {
          name: "Holders",
          // keep first 5 and last 4 chars
          value: mostPopularPair.holders
            .map(
              (holder: any) =>
                `\`\`\`${holder.address?.slice(0, 5)}...${holder.address?.slice(
                  -4
                )} (${holder.percent?.toFixed(2)}%)\`\`\``
            )
            .join("\n"),
          inline: true,
        },
      ])
    }

    msgOpts.embeds?.push(msgEmbed)

    await interaction.editReply(msgOpts)

    // route(reply, interaction, tickerMachineConfig(base, context, initial || ""))
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}dex info <symbol>\n${SLASH_PREFIX}dex info <id>`,
          examples: `${SLASH_PREFIX}dex info 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n${SLASH_PREFIX}dex info weth`,
        }),
      ],
    }),
  colorType: "Defi",
}

export default command
