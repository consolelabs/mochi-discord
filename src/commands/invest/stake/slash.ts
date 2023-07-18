import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import community from "adapters/community"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { getSlashCommand } from "utils/commands"

const slashCmd: SlashCommand = {
  name: "stake",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("stake")
      .setDescription("stake your token to earn")
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("filter earn by chain")
          .setRequired(true)
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
          .setName("token")
          .setDescription("filter earn by token")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("platform")
          .setDescription("filter earn by platform")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addNumberOption((opt) =>
        opt
          .setName("amount")
          .setDescription("amount of token to stake")
          .setRequired(true)
      )

    return data
  },
  autocomplete: async function (i) {
    const focused = i.options.getFocused(true)

    if (focused.name === "token") {
      const focusedValue = focused.value
      const chainId = i.options.getString("chain", true)

      const { ok, data } = await community.getEarns({
        chainIds: chainId,
        types: "lend", // get lend only
        status: "active",
      })
      if (!ok) {
        await i.respond([])
        return
      }
      const options = data
        .filter((opt) =>
          opt.token?.symbol?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25)
        .map((opt) => ({
          name: `${opt.token?.symbol} ${shortenHashOrAddress(
            opt.token?.address ?? ""
          )}`,
          value: `${opt.token?.name} ${opt.token?.address}`,
        }))

      await i.respond(options)
    }

    if (focused.name === "platform") {
      const focusedValue = focused.value
      const chainId = i.options.getString("chain", true)
      const token = i.options.getString("token", true)
      const address = token.split(" ")[1]

      const { ok, data } = await community.getEarns({
        chainIds: chainId,
        address,
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
        ?.filter((p) =>
          p?.name?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .map((p) => ({
          name: `[${p.name?.toUpperCase()}] APY: ${p.apy?.toFixed(
            2
          )}% - TVL: ${formatter.format(p.tvl ?? 0)}`,
          value: p.name ?? "NA",
        }))

      await i.respond(options ?? [])
    }
  },
  run: async function (i: CommandInteraction) {
    const chainId = i.options.getString("chain", true)
    const [, tokenAddress] = i.options.getString("token", true).split(" ")
    const platform = i.options.getString("platform", true)
    const amount = i.options.getNumber("amount", true)

    const { ok, data } = await community.getEarns({
      chainIds: chainId,
      types: "lend",
      platforms: platform,
      address: tokenAddress,
      status: "active",
    })
    if (!ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Stake failed",
              description: `The transaction failed. Please try again later. If the problem persists, please contact us on Discord.`,
            }),
          ],
        },
      }
    }
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(i, {
              title: "Stake",
              description: `No vault found`,
            }),
          ],
        },
      }
    }
    const { platforms, token } = data[0]
    const platformDetail = platforms?.at(0)
    const profileId = await getProfileIdByDiscord(i.user.id)
    const amountBN = BigInt(amount * 10 ** (token?.decimals ?? 18))

    const { ok: stakeOk } = await mochiPay.krystalStake({
      profile_id: profileId,
      chain_id: parseInt(chainId),
      platform: platform,
      earning_type: platformDetail?.type ?? "",
      token_amount: amountBN.toString(),
      token: {
        name: token?.name ?? "",
        symbol: token?.symbol ?? "",
        address: token?.address ?? "",
        decimals: token?.decimals ?? 18,
      },
    })

    if (!stakeOk) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Stake failed",
              description: `The transaction failed. Please try again later. If the problem persists, please contact the support team.`,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Stake success",
            description: `You have successfully request to stake ${amount} ${
              token?.symbol ?? ""
            } to ${platformDetail?.name ?? "NA"}. \n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} You can check the transaction status with ${await getSlashCommand(
              "invest status"
            )}`,
          }),
        ],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
