import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { getSlashCommand } from "utils/commands"
import { utils } from "ethers"

const slashCmd: SlashCommand = {
  name: "unstake",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("unstake")
      .setDescription("unstake your token from earn platform")
      .addStringOption((opt) =>
        opt
          .setName("from")
          .setDescription("select earn vault to unstake")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addNumberOption((opt) =>
        opt
          .setName("amount")
          .setDescription("amount of token to unstake (-1 for unstaking all)")
          .setRequired(true)
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
    const amount = i.options.getNumber("amount", true)

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
              title: "Unstake failed",
              description:
                "The unstake request failed. Please try again. If the problem persists, please contact the Mochi team.",
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
              title: "Unstake failed",
              description:
                "The unstake request failed. Please try again. If the problem persists, please contact the Mochi team.",
            }),
          ],
        },
      }
    }

    const vaultData = data[0]
    let amountStr = utils
      .parseUnits(amount.toString(), vaultData.to_underlying_token.decimals)
      .toString()
    if (amount === -1) {
      amountStr = vaultData.to_underlying_token.balance
    }

    const { ok: unstakeOk } = await mochiPay.krystalUnstake({
      chain_id: vaultData.chain_id,
      profile_id: profileId,
      earning_type: "lend", // default to lend
      platform: vaultData.platform.name ?? platform,
      token_amount: amountStr,
      token: {
        address: vaultData.to_underlying_token.address,
        symbol: vaultData.to_underlying_token.symbol,
        name: vaultData.to_underlying_token.name,
        decimals: vaultData.to_underlying_token.decimals,
      },
      receipt_token: {
        address: vaultData.staking_token.address,
        symbol: vaultData.staking_token.symbol,
        name: vaultData.staking_token.name,
        decimals: vaultData.staking_token.decimals,
      },
    })

    if (!unstakeOk) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Unstake failed",
              description:
                "The unstake request failed. Please try again. If the problem persists, please contact the Mochi team.",
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Unstake success",
            description: `The request to unstake has been sent. Please wait a few minutes for the transaction to be confirmed.\n${getEmoji(
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
