import defi from "adapters/defi"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"

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
          }),
        ],
      },
    }

  const res = data.map((token: any) => {
    return {
      name: `${getEmoji(token.chain)} ${token.chain} TX`,
      value: `${getEmoji("slow")} Slow - ${token.est_safe_time} \`${
        token.safe_gas_price
      } Gwei\`\n${getEmoji("normal")} Normal - ${token.est_propose_time} \`${
        token.propose_gas_price
      } Gwei\`\n${getEmoji("fast")} Fast - ${token.est_fast_time} \`${
        token.fast_gas_price
      } Gwei\``,
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
