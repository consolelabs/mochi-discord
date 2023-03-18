import defi from "adapters/defi"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ConvertSecondToMinute } from "utils/time"

export async function render() {
  const { data, ok, curl, error, log } = await defi.getGasTracker()
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No token found",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} Currently no token gas found`,
            color: msgColors.SUCCESS,
            footer: ["Type /feedback to report"],
          }),
        ],
      },
    }

  const res = data.map((token: any) => {
    return {
      name: `${getEmoji(token.chain)} ${token.chain}`,
      value: `${getEmoji("slow")} Slow - ${ConvertSecondToMinute(
        token.est_safe_time
      )} \`${token.safe_gas_price} Gwei\`\n${getEmoji(
        "normal"
      )} Normal - ${ConvertSecondToMinute(token.est_propose_time)} \`${
        token.propose_gas_price
      } Gwei\`\n${getEmoji("fast")} Fast - ${ConvertSecondToMinute(
        token.est_fast_time
      )} \`${token.fast_gas_price} Gwei\``,
      inline: true,
    }
  })

  const fields = []
  for (let i = 0; i < res.length; i++) {
    if (i !== 0 && i % 2 == 0) {
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

  return {
    messageOptions: {
      embeds: [
        {
          color: msgColors.BLUE,
          title: `Gas Prices`,
          fields,
        },
      ],
    },
  }
}

export async function renderOne(chain: string) {
  const { data, ok, curl, error, log } = await defi.getChainGasTracker(chain)
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No token found",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} Currently no token gas found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const fields = [
    {
      name: `${getEmoji(data.chain)} ${data.chain} TX`,
      value: `${getEmoji("slow")} Slow - ${ConvertSecondToMinute(
        data.est_safe_time
      )} \`${data.safe_gas_price} Gwei\`\n${getEmoji(
        "normal"
      )} Normal - ${ConvertSecondToMinute(data.est_propose_time)} \`${
        data.propose_gas_price
      } Gwei\`\n${getEmoji("fast")} Fast - ${ConvertSecondToMinute(
        data.est_fast_time
      )} \`${data.fast_gas_price} Gwei\``,
      inline: true,
    },
  ]

  return {
    messageOptions: {
      embeds: [
        {
          color: msgColors.BLUE,
          title: `Gas Prices`,
          fields,
        },
      ],
    },
  }
}
