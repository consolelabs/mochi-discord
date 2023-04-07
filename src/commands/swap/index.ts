import { SlashCommandBuilder } from "@discordjs/builders"
import defi from "adapters/defi"
import { InternalError } from "errors"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { chains } from "./index/processor"
import swapSlash from "./index/slash"

const slashCmd: SlashCommand = {
  name: "swap",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("swap")
      .setDescription("Preview swap route of you tokens")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("the amount of token you want to sell")
          .setMinValue(0)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("from")
          .setDescription("the token you want to sell")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("to")
          .setDescription("the token you want to sell")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("chain_name")
          .setDescription("the chain name, default is solana")
          .setRequired(false)
          .setChoices([
            ["solana", "solana"],
            ...Object.values(chains).map<[string, string]>((c) => [c, c]),
          ])
      )

    return data
  },
  run: async function (i) {
    const from = i.options.getString("from", true)
    const to = i.options.getString("to", true)
    const amount = i.options.getNumber("amount", true)

    const chain_name = i.options.getString("chain_name", false) ?? "solana"
    const { ok, data } = await defi.getSwapRoute({
      from,
      to,
      amount: String(amount),
      chain_name,
    })

    if (!ok) {
      throw new InternalError({
        msgOrInteraction: i,
        description:
          "No route data found, we're working on adding them in the future, stay tuned.",
        emojiUrl: getEmojiURL(emojis.SWAP_ROUTE),
      })
    }

    swapSlash(i, data?.data, from.toUpperCase(), to.toUpperCase(), chain_name)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
  ephemeral: true,
}

export default { slashCmd }
