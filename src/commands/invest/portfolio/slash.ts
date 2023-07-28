import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  SelectMenuInteraction,
} from "discord.js"
import { SlashCommand } from "types/common"
import community from "adapters/community"
import { composeEmbedMessage } from "ui/discord/embed"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { ResponseInvestPlatforms } from "types/api"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { MachineConfig, route } from "utils/router"
import { InternalError } from "errors"
import { getSlashCommand } from "utils/commands"
import { composeInvestPortfolio } from "./processor"

export const machineConfig: (
  filter?: InvestPortfolioFilter
) => MachineConfig = (filter) => ({
  id: "investPortfolio",
  context: {
    button: {
      investPortfolio: (i) => {
        return renderInvestPortfolio(i, filter)
      },
    },
  },
})

const slashCmd: SlashCommand = {
  name: "portfolio",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("portfolio")
      .setDescription("Track your earning portfolio")
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("filter earn by chain")
          .setRequired(false)
          .addChoices([
            ["Ethereum", "1"],
            ["BSC", "56"],
            ["Polygon", "137"],
            ["Avalance", "43114"],
            ["Fantom", "250"],
            ["Arbitrum", "42161"],
            ["Optimism", "10"],
          ])
      )
      .addStringOption((opt) =>
        opt
          .setName("platform")
          .setDescription("filter earn by platform")
          .setRequired(false)
          .setAutocomplete(true)
      )

    return data
  },
  autocomplete: async function (i) {
    const focusedValue = i.options.getFocused()
    const chainId = i.options.getString("chain")
    if (!chainId) {
      await i.respond([])
      return
    }

    const { ok, data } = await community.getEarns({
      chainIds: chainId ?? "",
      types: "lend", // get lend only
      status: "active",
    })

    if (!ok) {
      await i.respond([])
      return
    }
    const formatter = Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      notation: "compact",
    })
    const platforms = data[0].platforms
    const options = platforms
      ?.filter((p: ResponseInvestPlatforms) =>
        p?.name?.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .map((p: ResponseInvestPlatforms) => ({
        name: `[${p.name?.toUpperCase()}] APY: ${p.apy?.toFixed(
          2
        )}% - TVL: ${formatter.format(p.tvl ?? 0)}`,
        value: p.name ?? "NA",
      }))

    await i.respond(options ?? [])
  },
  run: async function (i: CommandInteraction) {
    const chainId = i.options.getString("chain") ?? ""
    const platform = i.options.getString("platform") ?? ""
    const { msgOpts } = await renderInvestPortfolio(i, {
      chainId,
      platform,
    })
    const reply = (await i.editReply(msgOpts)) as Message
    route(reply, i, machineConfig({ chainId, platform }))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export type InvestPortfolioFilter = {
  chainId: string
  platform: string
}

async function renderInvestPortfolio(
  i: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  filter?: InvestPortfolioFilter
) {
  const { chainId, platform } = filter ?? { chainId: "", platform: "" }
  const profileId = await getProfileIdByDiscord(i.user.id)
  const { ok, data, error } = await mochiPay.getKrystalEarnPortfolio({
    profile_id: profileId,
    chain_id: chainId,
    platform: platform,
  })

  if (!ok) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Failed to get earning portfolio",
      description: error,
    })
  }

  if (data.length === 0) {
    return {
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No earning portfolio",
            description: `You have no earning portfolio!/n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )}You can start earning by using the ${await getSlashCommand(
              "invest stake"
            )}`,
          }),
        ],
      },
    }
  }

  const description = composeInvestPortfolio(data)

  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Invest Portfolio", getEmojiURL(emojis.BANK)],
          description,
        }),
      ],
    },
  }
}

export default slashCmd
