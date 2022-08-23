import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { DOT } from "utils/constants"
import {
  composeEmbedMessage,
  composeSimpleSelection,
  getErrorEmbed,
  getSuccessEmbed,
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
  shortenHashOrAddress,
} from "utils/common"
import { NFTMetadataAttrIcon } from "types/community"
import config from "adapters/config"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { NFTSymbol } from "types/config"

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

export async function setDefaultSymbol(i: ButtonInteraction) {
  await i.deferUpdate()
  const [colAddress, symbol, chain, authorId] = i.customId.split("|").slice(1)
  if (authorId !== i.user.id) {
    return
  }
  await config.setGuildDefaultSymbol({
    guild_id: i.guildId,
    chain,
    symbol,
    address: colAddress,
  })
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default NFT symbol ENABLED",
    description: `Next time your server members use $nft with \`${symbol}\`, **${symbol} (${shortenHashOrAddress(
      colAddress
    )}/${chain.toUpperCase()})** will be the default selection`,
  })
  i.editReply({
    embeds: [embed],
    components: [],
  })
}

function addSuggestionIfAny(
  symbol: string,
  tokenId: string,
  _suggestions?: Array<NFTSymbol>
) {
  const suggestions = _suggestions ?? []
  const duplicatedSymbols =
    suggestions.reduce((acc, s) => acc.add(s.symbol), new Set()).size === 1
  const components = getSuggestionComponents(
    suggestions.map((s, i) => ({
      label: s.name,
      value: `${s.address}/${tokenId}/${symbol}/${s.chain}/${duplicatedSymbols}`,
      emoji:
        i > 8
          ? `${getEmoji(`NUM_${Math.floor(i / 9)}`)}${getEmoji(`NUM_${i % 9}`)}`
          : getEmoji(`NUM_${i + 1}`),
    }))
  )

  return components ? { components: [components] } : {}
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
    let res = await community.getNFTDetail(symbol, tokenId, msg.guildId)

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

    let replyMsg: Message
    // great, we have data
    if (res.data.collection_address) {
      const collectionDetailRes = await community.getNFTCollectionDetail(symbol)
      replyMsg = await msg.reply({
        embeds: [
          await composeNFTDetail(
            res.data,
            msg,
            collectionDetailRes.data.name,
            collectionDetailRes.data.image
          ),
        ],
        ...addSuggestionIfAny(symbol, tokenId),
      })
    } else {
      // ambiguity, check if there is default_symbol first
      if (res.default_symbol) {
        // there is, so we use its collection address to get
        const collectionDetailRes = await community.getNFTCollectionDetail(
          res.default_symbol.address
        )
        const components = addSuggestionIfAny(
          res.default_symbol.symbol,
          tokenId,
          res.suggestions
        )
        res = await community.getNFTDetail(
          res.default_symbol.address,
          tokenId,
          msg.guildId
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
          ...components,
        })
      } else {
        // there isn't, so we continue to check for the `suggestions` property
        const embed = getSuggestionEmbed({
          title: `Multiple results for ${symbol}`,
          msg,
          description: `Did you mean one of these instead:\n\n${composeSimpleSelection(
            res.suggestions?.map(
              (s) =>
                `[\`${s.chain.toUpperCase()}\` - \`${s.name} (${
                  s.symbol
                })\`](${getMarketplaceCollectionUrl(s.address)})`
            )
          )}`,
        })

        replyMsg = await msg.reply({
          embeds: [embed],
          ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
        })
      }
    }

    listenForSuggestionAction(replyMsg, msg.author.id, async (value, i) => {
      const [colAddress, tokenId, symbol, chain, hasDuplicatedSymbols] =
        value.split("/")
      const res = await community.getNFTDetail(colAddress, tokenId, msg.guildId)
      const detailRes = await community.getNFTCollectionDetail(colAddress)

      if (!res.ok || !detailRes.ok || !res.data || !detailRes.data) {
        await i.deferUpdate()
        await replyMsg.edit({
          embeds: [
            getErrorEmbed({
              msg,
            }),
          ],
        })
      } else {
        await replyMsg.edit({
          embeds: [
            await composeNFTDetail(
              res.data,
              msg,
              detailRes.data.name,
              detailRes.data.image
            ),
          ],
          ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
        })
        if (
          hasAdministrator(msg.member) &&
          !res.default_symbol &&
          hasDuplicatedSymbols === "true"
        ) {
          const actionRow = new MessageActionRow().addComponents(
            new MessageButton({
              customId: `confirm_symbol|${colAddress}|${symbol}|${chain}|${msg.author.id}`,
              emoji: getEmoji("approve"),
              style: "PRIMARY",
              label: "Confirm",
            })
          )
          const ephemeralMessage = {
            embeds: [
              composeEmbedMessage(msg, {
                title: "Set default NFT symbol",
                description: `Do you want to set **${symbol}** as your server default NFT symbol?\nNo further selection next time use \`$nft\``,
              }),
            ],
            components: [actionRow],
          }
          const interactionReply = (await i.reply({
            fetchReply: true,
            ephemeral: true,
            ...ephemeralMessage,
          })) as Message
          const collector = interactionReply.createMessageComponentCollector({
            componentType: MessageComponentTypes.BUTTON,
            idle: 60000,
          })
          collector.on("collect", setDefaultSymbol)
        }
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
