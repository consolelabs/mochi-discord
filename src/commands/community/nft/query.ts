import { EmbedFieldData, Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { DOT } from "utils/constants"
import {
  composeEmbedMessage,
  composeSimpleSelection,
  getErrorEmbed,
  getSuggestionComponents,
  getSuggestionEmbed,
  justifyEmbedFields,
  listenForSuggestionAction,
} from "utils/discordEmbed"
import community from "adapters/community"
import {
  capitalizeFirst,
  getEmoji,
  getMarketplaceCollectionUrl,
  getMarketplaceNftUrl,
  hasAdministrator,
} from "utils/common"
import { NFTMetadataAttrIcon } from "types/community"
import config from "adapters/config"

const rarityColors: Record<string, string> = {
  COMMON: "#939393",
  UNCOMMON: "#22d489",
  RARE: "#02b3ff",
  EPIC: "#9802f6",
  LEGENDARY: "#ff8001",
  MYTHIC: "#ed2939",
}

let icons: Array<NFTMetadataAttrIcon>

function getRarityEmoji(rarity: string) {
  const rarities = Object.keys(rarityColors)
  rarity = rarities[rarities.indexOf(rarity.toUpperCase())] ?? "common"
  return Array.from(Array(4).keys())
    .map((k) => getEmoji(`${rarity}${k + 1}`))
    .join("")
}

function getIcon(iconList: NFTMetadataAttrIcon[], iconName: string): string {
  if (!iconList) {
    return getEmoji(iconName)
  }
  const icon = iconList.find((i) => i.trait_type === iconName)

  if (icon) {
    return icon.discord_icon
  }

  return getEmoji(iconName)
}

async function composeNFTDetail(
  data: any,
  msg: Message,
  colName: string,
  colImage: string
) {
  try {
    if (!icons) {
      icons = await community.getNFTMetadataAttrIcon()
    }

    const { name, attributes, rarity, image, collection_address, token_id } =
      data

    // set rank, rarity score empty if have data
    const rarityRate = rarity?.rarity
      ? `**${DOT}** ${getRarityEmoji(rarity.rarity)}`
      : ""
    let description = `**[${name ?? ""}](${getMarketplaceNftUrl(
      collection_address,
      token_id
    )})**`
    description += rarity?.rank
      ? `\n\n🏆** ・ Rank: ${rarity.rank} ** ${rarityRate}`
      : ""

    const attributesFiltered = attributes.filter(
      (obj: { trait_type: string }) => {
        return obj.trait_type !== ""
      }
    )

    const fields: EmbedFieldData[] = attributesFiltered
      ? attributesFiltered.map((attr: any) => {
          const val = `${attr.value}\n${attr.frequency ?? ""}`
          return {
            name: `${getIcon(icons, attr.trait_type)} ${attr.trait_type}`,
            value: `${val ? val : "-"}`,
            inline: true,
          }
        })
      : []

    const embed = composeEmbedMessage(msg, {
      author: [
        capitalizeFirst(colName),
        ...(colImage.length ? [colImage] : []),
      ],
      description,
      image,
      color: rarityColors[rarity?.rarity?.toUpperCase()],
    }).addFields(fields)
    return justifyEmbedFields(embed, 3)
  } catch (e: any) {
    msg.reply({
      embeds: [
        getErrorEmbed({
          msg,
        }),
      ],
    })
  }
}

const command: Command = {
  id: "nft_query",
  command: "query",
  brief: "View NFT token info",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args
      .slice(1, args.length - 1)
      .reduce((prev, next) => prev + "%20" + next)
      .toUpperCase()
    const tokenId = args[args.length - 1]
    const { foundMultipleSameSymbols, res } = await community.getNFTDetail(
      symbol,
      tokenId,
      msg.guildId
    )

    if (!res.ok) {
      return {
        messageOptions: {
          embeds: [
            justifyEmbedFields(
              getErrorEmbed({
                msg,
                description: res.error,
              }),
              1
            ),
          ],
        },
      }
    }

    let components
    let replyMsg
    if (
      Array.isArray(res.suggestions) &&
      res.suggestions?.length > 0 &&
      !res.default_symbol
    ) {
      const embed = getSuggestionEmbed({
        title:
          foundMultipleSameSymbols && hasAdministrator(msg.member)
            ? `Set default symbol`
            : `Multiple results for ${symbol}`,
        msg,
        description:
          foundMultipleSameSymbols && hasAdministrator(msg.member)
            ? `Select one of these symbols, it will also be set as the default symbol from now on (you can change it via another command)`
            : `Did you mean one of these instead:\n\n${composeSimpleSelection(
                res.suggestions?.map(
                  (s) =>
                    `[\`${s.chain.toUpperCase()}\` - \`${s.name} (${
                      s.symbol
                    })\`](${getMarketplaceCollectionUrl(s.address)})`
                )
              )}`,
      })
      components = getSuggestionComponents(
        res.suggestions.map((s, i) => ({
          label: s.name,
          value: `${s.address}/${tokenId}/${symbol}/${s.chain}`,
          emoji:
            i > 8
              ? `${getEmoji(`NUM_${Math.floor(i / 9)}`)}${getEmoji(
                  `NUM_${i % 9}`
                )}`
              : getEmoji(`NUM_${i + 1}`),
        }))
      )

      replyMsg = await msg.reply({
        embeds: [embed],
        components: [components],
      })
    } else {
      const collectionDetailRes = await community.getNFTCollectionDetail(
        res.default_symbol.address
      )
      if (!collectionDetailRes.ok) {
        return {
          messageOptions: {
            embeds: [
              justifyEmbedFields(
                getErrorEmbed({
                  msg,
                  description: res.error,
                }),
                1
              ),
            ],
          },
        }
      }
      components = getSuggestionComponents(
        res.suggestions
          .filter(
            (s) =>
              s.address !== res.default_symbol.address &&
              s.chain !== res.default_symbol.chain
          )
          .map((s, i) => ({
            label: s.name,
            value: `${s.address}/${tokenId}/${symbol}/${s.chain}`,
            emoji:
              i > 8
                ? `${getEmoji(`NUM_${Math.floor(i / 9)}`)}${getEmoji(
                    `NUM_${i % 9}`
                  )}`
                : getEmoji(`NUM_${i + 1}`),
          }))
      )

      replyMsg = await msg.reply({
        embeds: [
          await composeNFTDetail(
            res.data,
            msg,
            collectionDetailRes.data.name,
            collectionDetailRes.data.image
          ),
        ],
        components: [components],
      })
    }

    listenForSuggestionAction(replyMsg, msg.author.id, async (value) => {
      const [colAddress, tokenId, symbol, chain] = value.split("/")
      const { res } = await community.getNFTDetail(
        colAddress,
        tokenId,
        msg.guildId
      )
      const detailRes = await community.getNFTCollectionDetail(colAddress)

      if (!res.ok || !detailRes.ok || !res.data || !detailRes.data) {
        msg.reply({
          embeds: [
            getErrorEmbed({
              msg,
            }),
          ],
        })
      } else {
        // the admin has chosen to set a default symbol
        if (!res.default_symbol && hasAdministrator(msg.member)) {
          await config.setGuildDefaultSymbol({
            guild_id: msg.guildId,
            chain,
            symbol,
            address: colAddress,
          })
        }
        msg.reply({
          embeds: [
            await composeNFTDetail(
              res.data,
              msg,
              detailRes.data.name,
              detailRes.data.image
            ),
          ],
        })
      }
    })

    return null
  },
  getHelpMessage: async () => null,
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
