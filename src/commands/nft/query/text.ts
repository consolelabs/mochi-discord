import community from "adapters/community"
import { Message, MessageActionRow, MessageButton } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { APIError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import {
  authorFilter,
  getEmoji,
  getMarketplaceCollectionUrl,
  hasAdministrator,
} from "utils/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuggestionEmbed,
} from "ui/discord/embed"
import {
  addSuggestionIfAny,
  buildSwitchViewActionRow,
  collectButton,
  composeNFTDetail,
  fetchAndComposeNFTDetail,
  setDefaultSymbol,
} from "./processor"
import { composeSimpleSelection } from "ui/discord/select-menu"
import { listenForSuggestionAction } from "handlers/discord/button"

const command: Command = {
  id: "nft_query",
  command: "query",
  brief: "View NFT token info",
  category: "Community",
  getHelpMessage: async () => {
    return {}
  },
  run: async function (msg) {
    // TODO(tuan): refactor set default handler
    const args = getCommandArguments(msg)
    const symbol = args
      .slice(1, args.length - 1)
      .reduce((prev, next) => prev + "%20" + next)
      .toUpperCase()
    const tokenId = args[args.length - 1]
    const res = await community.getNFTDetail(
      symbol,
      tokenId,
      msg.guildId ?? "",
      false
    )

    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }

    let replyMsg: Message | null = null
    // great, we have data
    if (res.data?.collection_address) {
      const collectionDetailRes = await community.getNFTCollectionDetail({
        collectionAddress: res.data.collection_address,
        queryAddress: true,
      })
      if (collectionDetailRes.ok) {
        replyMsg = await msg.reply({
          embeds: [
            await composeNFTDetail(
              res.data,
              msg,
              collectionDetailRes.data.name,
              collectionDetailRes.data.image,
              collectionDetailRes.data.chain?.name
            ),
          ],
          components: [
            ...addSuggestionIfAny(symbol, tokenId),
            buildSwitchViewActionRow(
              "nft",
              symbol,
              res.data.collection_address,
              tokenId,
              collectionDetailRes.data.chain?.short_name ?? ""
            ),
          ],
        })
      }
    } else {
      // ambiguity, check if there is default_symbol first
      if (res.default_symbol) {
        // there is, so we use its collection address to get
        const messageOptions = await fetchAndComposeNFTDetail(
          msg,
          res.default_symbol.name,
          res.default_symbol.address,
          tokenId,
          res.default_symbol.chain
        )
        replyMsg = await msg.reply({ ...messageOptions })
      } else {
        // there isn't, so we continue to check for the `suggestions` property
        // if there is not any suggestion, return error
        if (res.suggestions?.length == 0) {
          replyMsg = await msg.reply({
            embeds: [
              getErrorEmbed({
                msg,
                description:
                  "The collection does not exist. Please choose another one.",
              }),
            ],
          })
        } else {
          const embed = getSuggestionEmbed({
            title: `Multiple results for ${symbol}`,
            msg,
            description: `Did you mean one of these instead:\n\n${composeSimpleSelection(
              (res.suggestions ?? []).map(
                (s) =>
                  `[\`${s.chain.toUpperCase()}\` - \`${s.name} (${
                    s.symbol
                  })\`](${getMarketplaceCollectionUrl(s.address)})`
              )
            )}`,
          })

          replyMsg = await msg.reply({
            embeds: [embed],
            components: [
              ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
            ],
          })
        }
      }
    }

    if (replyMsg) {
      listenForSuggestionAction(replyMsg, msg.author.id, async (value, i) => {
        // ignore if user click to switch view button
        if (i.customId.startsWith("nft-view")) return

        await i.deferUpdate().catch(() => null)
        const [colAddress, tokenId, symbol, chain, hasDuplicatedSymbols] =
          value.split("/")
        const res = await community.getNFTDetail(
          colAddress,
          tokenId,
          msg.guildId ?? "",
          true
        )
        const detailRes = await community.getNFTCollectionDetail({
          collectionAddress: colAddress,
          queryAddress: true,
        })

        if (!res.ok) {
          throw new APIError({
            message: msg,
            curl: res.curl,
            description: res.log,
          })
        } else if (!detailRes.ok) {
          throw new APIError({
            message: msg,
            curl: detailRes.curl,
            description: detailRes.log,
          })
        } else {
          const shouldAskDefault =
            hasAdministrator(msg.member) &&
            !res.default_symbol &&
            hasDuplicatedSymbols === "true"

          // the token might not be synced yet
          if (!res.data) {
            await replyMsg
              ?.edit({
                embeds: [
                  composeEmbedMessage(null, {
                    title: detailRes?.data?.name ?? "NFT Query",
                    description: "The token is being synced",
                  }),
                ],
              })
              .catch(() => null)
          } else {
            await replyMsg
              ?.edit({
                embeds: [
                  await composeNFTDetail(
                    res.data,
                    msg,
                    detailRes.data.name,
                    detailRes.data.image,
                    detailRes.data.chain?.name
                  ),
                ],
                components: [
                  ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
                  buildSwitchViewActionRow(
                    "nft",
                    symbol,
                    detailRes.data.address,
                    tokenId,
                    detailRes.data.chain?.short_name ?? ""
                  ),
                ],
              })
              .catch(() => null)
          }
          if (shouldAskDefault) {
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
            const askDefaultMsg = await msg
              .reply(ephemeralMessage)
              .catch(() => null)

            askDefaultMsg
              ?.createMessageComponentCollector({
                componentType: MessageComponentTypes.BUTTON,
                idle: 60000,
                filter: authorFilter(msg.author.id),
              })
              .on("collect", setDefaultSymbol)
          }
        }
      })

      collectButton(replyMsg, msg)
    }

    return
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
