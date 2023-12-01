import defi from "adapters/defi"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ConvertSecondToMinute } from "utils/time"

const currency: any = {
  "fantom opera": "FTM",
  "ethereum mainnet": "ETH",
  polygon: "MATIC",
  "binance smart chain mainnet": "BNB",
}

export async function render() {
  const {
    data,
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await defi.getGasTracker()
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }
  if (!data.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No token found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Currently no token gas found`,
            color: msgColors.SUCCESS,
            footer: ["Type /feedback to report"],
          }),
        ],
      },
    }

  const res = data.map((token: any, i: number) => {
    return {
      name: `${i > 1 ? "\u200b\n" : ""}${getEmoji(
        currency[token.chain.toLowerCase()] ?? "",
      )} ${token.chain}`,
      value: `${getEmoji("SLOW")} Slow - ${ConvertSecondToMinute(
        token.est_safe_time,
      )} \`${token.safe_gas_price} Gwei\`\n${getEmoji(
        "NORMAL",
      )} Normal - ${ConvertSecondToMinute(token.est_propose_time)} \`${
        token.propose_gas_price
      } Gwei\`\n${getEmoji("FAST")} Fast - ${ConvertSecondToMinute(
        token.est_fast_time,
      )} \`${token.fast_gas_price} Gwei\``,
      inline: true,
    }
  })

  const fields = []
  for (let i = 0; i < res.length; i++) {
    if (i !== 0 && i % 2 === 0) {
      fields.push({
        name: "\u200b",
        value: "\u200b",
        inline: true,
      })
    }
    fields.push(res[i])
  }
  fields.push({
    name: "\u200b",
    value: "\u200b",
    inline: true,
  })

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    author: ["Gas Prices", getEmojiURL(emojis.GAS)],
  }).addFields(fields)
  return { messageOptions: { embeds: [embed] } }
}

export async function renderOne(chain: string) {
  const {
    data,
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await defi.getChainGasTracker(chain)
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }
  if (!data)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No token found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Currently no token gas found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const fields = [
    {
      name: `${getEmoji(data.chain)} ${data.chain}`,
      value: `${getEmoji("SLOW")} Slow - ${ConvertSecondToMinute(
        data.est_safe_time,
      )} \`${data.safe_gas_price} Gwei\`\n${getEmoji(
        "NORMAL",
      )} Normal - ${ConvertSecondToMinute(data.est_propose_time)} \`${
        data.propose_gas_price
      } Gwei\`\n${getEmoji("FAST")} Fast - ${ConvertSecondToMinute(
        data.est_fast_time,
      )} \`${data.fast_gas_price} Gwei\``,
      inline: true,
    },
  ]
  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    title: "Gas Prices",
  }).addFields(fields)
  return { messageOptions: { embeds: [embed] } }
}
