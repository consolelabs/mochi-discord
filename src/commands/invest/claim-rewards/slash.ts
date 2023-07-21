import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { getSlashCommand } from "utils/commands"

const slashCmd: SlashCommand = {
  name: "claim-rewards",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("claim")
      .setDescription("claim your rewards from earn platform")
      .addStringOption((opt) =>
        opt
          .setName("from")
          .setDescription("select earn vault to claim rewards")
          .setRequired(true)
          .setAutocomplete(true)
      )
    return data
  },
  autocomplete: async function (i) {
    const focusedValue = i.options.getFocused()

    // Fetch user staking portfolio
    const { ok, data } = await mochiPay.getKrystalEarnPortfolio({
      profile_id: await getProfileIdByDiscord(i.user.id),
    })

    // If error, return empty
    if (!ok) {
      await i.respond([])
      return
    }

    // If no data, return empty
    if (!data) {
      await i.respond([])
      return
    }

    const balance = (balance: string, decimals: number) => {
      return (Number(balance) / 10 ** decimals).toFixed(2)
    }

    const options = data
      .filter(
        (d) =>
          d.platform.name?.toLowerCase().includes(focusedValue.toLowerCase()) ||
          d.to_underlying_token.symbol
            .toLowerCase()
            .includes(focusedValue.toLowerCase())
      )
      .map((d) => ({
        name: `[${d.platform.name?.toUpperCase()}] APY: ${d.apy.toFixed(
          2
        )}% Staking ${balance(
          d.to_underlying_token.balance,
          d.to_underlying_token.decimals
        )} ${d.to_underlying_token.symbol} `,
        value: `${d.platform.name} ${d.chain_id} ${d.to_underlying_token.address}`,
      }))
    await i.respond(options)
  },
  run: async function (i: CommandInteraction) {
    const [platform, chainId, tokenAddress] = i.options
      .getString("from", true)
      .split(" ")

    const profileId = await getProfileIdByDiscord(i.user.id)
    const { ok, data } = await mochiPay.getKrystalEarnPortfolio({
      profile_id: profileId,
      platform,
      chain_id: chainId,
      token_address: tokenAddress,
    })
    if (!ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Claim failed",
              description:
                "The claim rewards request failed. Please try again. If the problem persists, please contact the Mochi team.",
            }),
          ],
        },
      }
    }
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Claim failed",
              description:
                "The claim rewards request failed. Please try again. If the problem persists, please contact the Mochi team.",
            }),
          ],
        },
      }
    }

    const vaultData = data[0]
    const { ok: claimOk } = await mochiPay.krystalClaimRewards({
      chain_id: vaultData.chain_id,
      profile_id: profileId,
      platform: vaultData.platform.name ?? platform,
    })

    if (!claimOk) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Claim failed",
              description:
                "The claim rewards request failed. Please try again. If the problem persists, please contact the Mochi team.",
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Claim rewards success",
            description: `The request to claim rewards has been sent. Please wait a few minutes for the transaction to be confirmed.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )}You can check the status of the transaction using ${await getSlashCommand(
              "invest status"
            )}.`,
          }),
        ],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
