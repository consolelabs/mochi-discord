import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { utils } from "ethers"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import { APPROX } from "utils/constants"
import mochiPay from "../../../adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import { getProfileIdByDiscord } from "../../../utils/profile"

export const balanceTypes: Record<string, number> = {
  Offchain: 1,
  Onchain: 2,
  Total: 3,
}

const balanceEmbedProps = {
  [balanceTypes.Offchain]: {
    title: "Mochi balance",
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.`,
  },
  [balanceTypes.Onchain]: {
    title: "Onchain balance",
    description: `This balance shows the total amount of pending on-chain transactions.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can transfer received token to your crypto wallet by claiming in your DM \`$claim <Claim ID> <your recipient address>\`.\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} All the tip transaction won't take from this balance.`,
  },
  [balanceTypes.Total]: {
    title: "Total",
    description: "This balance including both onchain and offchain balance.",
  },
}

// const row = (type: number) => {
//   return new MessageActionRow().addComponents(
//     new MessageButton({
//       customId: `balance-${balanceTypes.Offchain}`,
//       style: "SECONDARY",
//       label: "Off-chain",
//       disabled: type === balanceTypes.Offchain,
//     }),
//     new MessageButton({
//       customId: `balance-${balanceTypes.Onchain}`,
//       style: "SECONDARY",
//       label: "On-chain",
//       disabled: type === balanceTypes.Onchain,
//     }),
//     new MessageButton({
//       customId: `balance-${balanceTypes.Total}`,
//       style: "SECONDARY",
//       label: "Total",
//       disabled: type === balanceTypes.Total,
//     })
//   )
// }

// TODO: temporarily disable onchain balances
const balancesFetcher: Record<number, (profileId: string) => Promise<any>[]> = {
  [balanceTypes.Offchain]: (profileId) => [
    // Defi.offchainGetUserBalances({ userId }),
    mochiPay.getBalances({ profileId }),
  ],
  // [balanceTypes.Onchain]: (userId) => [Defi.getUserOnchainBalances(userId)],
  // [balanceTypes.Total]: (userId) => [
  //   Defi.offchainGetUserBalances({ userId }),
  //   Defi.getUserOnchainBalances(userId),
  // ],
}

export async function getBalances(
  userId: string,
  type: number,
  msg: OriginalMessage
) {
  const fetcher = balancesFetcher[type]
  const res = await Promise.all(fetcher(userId))
  const ok = res[0].ok && (res[1]?.ok ?? true)
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: "",
    })
  }
  return res[0].data.concat(res[1]?.data).filter((i: any) => Boolean(i))
  // const groupedData: Record<string, any> = data.reduce(
  //   (acc: Record<string, UserBalances>, cur: any) => {
  //     if (!cur.symbol) return cur
  //     cur.balances += acc[cur.symbol]?.balances ?? 0
  //     cur.balances_in_usd += acc[cur.symbol]?.balances_in_usd ?? 0
  //     return { ...acc, [cur.symbol]: cur }
  //   },
  //   {}
  // )
  // return Object.values(groupedData)
}

export async function handleBalanceView(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferUpdate()
  }
  const [, view, profileId, type] = i.customId.split("_")
  const msg = i.message as Message
  const balances = await getBalances(profileId, Number(type), msg)

  const props = balanceEmbedProps[Number(type)]

  if (!balances.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      color: msgColors.SUCCESS,
    })
    i.editReply({
      embeds: [embed],
    })
    return
  }

  i.editReply({
    embeds: [switchView(view as any, props, balances)],
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setEmoji(
            getEmoji(
              view === "expand" ? "ANIMATED_COIN_2" : "ANIMATED_COIN_3",
              true
            )
          )
          .setStyle("SECONDARY")
          .setCustomId(
            `balance-view_${
              view === "expand" ? "compact" : "expand"
            }_${profileId}_${type}`
          )
          .setLabel(view === "expand" ? "Compact" : "Expand")
      ),
    ],
  })
}

function switchView(
  view: "compact" | "expand",
  props: { title: string; description: string },
  balances: any
) {
  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1

  let totalWorth = 0
  const embed = composeEmbedMessage(null, {
    author: [props.title, getEmojiURL(emojis.WALLET)],
    color: msgColors.SUCCESS,
  })

  if (view === "compact") {
    let longestStrLen = 0
    embed.setDescription(
      `${props.description}\n\n${balances
        ?.map((balance: any) => {
          const { token, amount } = balance
          const { symbol, decimal, price, chain, native } = token
          const value = roundFloatNumber(convertString(amount, decimal) ?? 0, 4)
          const usdWorth = roundFloatNumber(price * value, 4)
          totalWorth += usdWorth
          const text = `${value} ${symbol}`
          longestStrLen = Math.max(longestStrLen, text.length)
          if (value === 0)
            return {
              emoji: "",
              text: "",
            }

          return {
            emoji: getEmojiToken(symbol.toUpperCase()),
            text,
            usdWorth,
            ...(chain && !native && isDuplicateSymbol(symbol.toUpperCase())
              ? { chain }
              : {}),
          }
        })
        .map((e: any) => {
          if (!e.text) return ""
          return `${e.emoji} \`${e.text}${" ".repeat(
            longestStrLen - e.text.length
          )} ${APPROX} $${utils.commify(e.usdWorth)}${
            e.chain ? ` (${e.chain.name})` : ""
          }\``
        })
        .filter(Boolean)
        .join("\n")}`
    )
  } else {
    const fields: EmbedFieldData[] = balances
      ?.map((balance: any) => {
        const { token, amount } = balance
        const { name: tokenName, symbol, decimal, price, chain, native } = token
        const value = roundFloatNumber(convertString(amount, decimal) ?? 0, 4)
        const usdWorth = roundFloatNumber(price * value, 4)
        totalWorth += usdWorth
        if (value === 0) return

        return {
          name:
            tokenName +
            `${
              chain && !native && isDuplicateSymbol(symbol.toUpperCase())
                ? ` (${chain.name})`
                : ""
            } `,
          value: `${getEmojiToken(
            symbol.toUpperCase()
          )} ${value} ${symbol} \`$${usdWorth}\` ${getEmoji("BLANK")}`,
          inline: true,
        }
      })
      .filter((f: EmbedFieldData | undefined) => Boolean(f))
    embed.setDescription(props.description).addFields(fields)
  }

  embed.addFields({
    name: `Total (U.S dollar)`,
    value: `${getEmoji("CASH")} \`$${roundFloatNumber(totalWorth, 4)}\``,
  })
  return embed
}

export async function renderBalances(
  discordId: string,
  msg: Message | CommandInteraction,
  type: number
) {
  const profileId = await getProfileIdByDiscord(discordId)
  const balances = await getBalances(profileId, type, msg)
  const props = balanceEmbedProps[type]
  if (!balances.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
      color: msgColors.SUCCESS,
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  return {
    messageOptions: {
      embeds: [switchView("compact", props, balances)],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setEmoji(getEmoji("ANIMATED_COIN_3", true))
            .setStyle("SECONDARY")
            .setCustomId(`balance-view_expand_${profileId}_${type}`)
            .setLabel("Expand")
        ),
      ],
      // components: [row(type)],
    },
    // buttonCollector: {
    //   handler: async (i: ButtonInteraction) => {
    //     const type = +i.customId.split("-")[1]
    //     return await renderBalances(userId, msg, type)
    //   },
    // },
  }
}
