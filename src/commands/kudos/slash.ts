import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction, AutocompleteInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import {
  composeEmbedMessage,
  errorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { getEmoji, getEmojiToken } from "utils/common"
import { convertString } from "utils/convert"
import { formatTokenDigit, formatUsdDigit } from "utils/defi"
import { utils } from "ethers"

const command: SlashCommand = {
  name: "kudos",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("kudos")
      .setDescription("Request a kudos transfer from an application vault")
      .addStringOption((option) =>
        option
          .setName("vault")
          .setDescription("Select the vault")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("Select the token")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("Enter the amount to transfer")
          .setRequired(true),
      )
      .addUserOption((option) =>
        option
          .setName("recipient")
          .setDescription("Select the recipient user")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Optional reason for the kudos")
          .setRequired(false),
      )
  },
  autocomplete: async function (i: AutocompleteInteraction) {
    const focusedOption = i.options.getFocused(true)

    // Quick response for expired interactions
    const timeoutMs = 2500 // Leave 500ms buffer before Discord's 3s timeout
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), timeoutMs)
    })

    try {
      const userProfile = await profile.getByDiscord(i.user.id)
      if (!userProfile?.id) {
        await i.respond([])
        return
      }

      switch (focusedOption.name) {
        case "vault": {
          const vaultsPromise = mochiPay.getApplicationVaultsByProfileId(
            userProfile.id,
          )
          const result = await Promise.race([vaultsPromise, timeoutPromise])
          if (!result) {
            await i.respond([]).catch(() => {})
            return
          }

          const vaults = result as any[]
          const filtered = vaults.filter((vault: any) =>
            vault.name
              .toLowerCase()
              .includes(focusedOption.value.toLowerCase()),
          )

          await i
            .respond(
              filtered.slice(0, 25).map((vault: any) => ({
                name: vault.name,
                value: `${vault.application_id}|${vault.vault_profile_id}|${vault.name}`,
              })),
            )
            .catch(() => {})
          break
        }

        case "token": {
          const vaultValue = i.options.getString("vault")
          if (!vaultValue) {
            await i.respond([])
            return
          }

          const [appId, vaultId] = vaultValue.split("|")

          // Get vault balances with timeout protection
          const balancesPromise = mochiPay.getAppVaultBalances(
            userProfile.id,
            appId,
            vaultId,
          )

          const result = await Promise.race([balancesPromise, timeoutPromise])

          if (!result) {
            // Fallback: return empty response if API is slow
            await i.respond([]).catch(() => {})
            return
          }

          const balances = result as any[]
          const filtered = balances
            .filter(
              (balance: any) =>
                balance.token.symbol
                  .toLowerCase()
                  .includes(focusedOption.value.toLowerCase()) ||
                balance.token.name
                  .toLowerCase()
                  .includes(focusedOption.value.toLowerCase()),
            )
            .filter(
              (balance: any) =>
                convertString(balance.amount, balance.token.decimal) > 0,
            ) // Only show tokens with balance

          await i
            .respond(
              filtered.slice(0, 25).map((balance: any) => ({
                name: `${balance.token.symbol}`,
                value: `${balance.token.id}`,
              })),
            )
            .catch(() => {}) // Ignore errors if interaction expired
          break
        }

        default:
          await i.respond([])
      }
    } catch (error) {
      console.error("Autocomplete error:", error)
      // Always try to respond, even if it might fail due to timeout
      await i.respond([]).catch(() => {})
    }
  },
  run: async function (interaction: CommandInteraction) {
    const vaultValue = interaction.options.getString("vault", true)
    const tokenValue = interaction.options.getString("token", true)
    const amount = interaction.options.getString("amount", true)
    const recipient = interaction.options.getUser("recipient", true)
    const reason = interaction.options.getString("reason") || undefined

    try {
      // Parse values
      const [appId, vaultId, vaultName] = vaultValue.split("|")
      const tokenId = tokenValue

      // Check if sender is trying to transfer to themselves
      if (interaction.user.id === recipient.id) {
        try {
          await interaction.editReply({
            embeds: [
              errorEmbed(
                "Invalid recipient",
                ["You cannot send kudos to yourself."],
                "Self-kudos not allowed",
                [
                  {
                    emoji: getEmoji("CONFIG"),
                    label: "Suggestion.",
                    text: "Please select a different recipient.",
                  },
                ],
              ),
            ],
          })
        } catch (error) {
          console.error("Kudos request error:", error)
        }
        return
      }

      const senderProfile = await profile.getByDiscord(interaction.user.id)
      if (!senderProfile.id) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "Profile not found",
              ["Could not find your profile."],
              "User profile missing",
              [
                {
                  emoji: getEmoji("CONFIG"),
                  label: "Solution.",
                  text: "Please create a profile first using /profile commands.",
                },
              ],
            ),
          ],
        })
        return
      }

      const balances = await mochiPay.getAppVaultBalances(
        senderProfile.id,
        appId,
        vaultId,
      )
      const tokenBalance = balances.find(
        (balance: any) => balance.token.id === tokenId,
      )

      if (!tokenBalance) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "Token not found",
              ["The selected token was not found in the vault."],
              "Token not available",
              [
                {
                  emoji: getEmoji("CONFIG"),
                  label: "Suggestion.",
                  text: "Please select a different token.",
                },
              ],
            ),
          ],
        })
        return
      }

      const tokenSymbol = tokenBalance.token.symbol
      const availableAmount = convertString(
        tokenBalance.amount,
        tokenBalance.token.decimal,
      )

      // Validate amount
      const transferAmount = parseFloat(amount)
      if (isNaN(transferAmount) || transferAmount <= 0) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "Invalid amount",
              ["Please enter a valid positive number."],
              "Amount validation failed",
              [
                {
                  emoji: getEmoji("CONFIG"),
                  label: "Example.",
                  text: "Try entering a number like: 10.5",
                },
              ],
            ),
          ],
        })
        return
      }

      if (transferAmount > availableAmount) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "Insufficient balance",
              [
                `You can send at most ${formatTokenDigit(
                  availableAmount.toString(),
                )} ${tokenSymbol} as kudos.`,
              ],
              "Balance too low",
              [
                {
                  emoji: getEmoji("WALLET"),
                  label: "Available.",
                  text: `${formatTokenDigit(
                    availableAmount.toString(),
                  )} ${tokenSymbol}`,
                },
              ],
            ),
          ],
        })
        return
      }

      // Get recipient profile
      const recipientProfile = await profile.getByDiscord(recipient.id)
      if (!recipientProfile.id) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "Recipient profile not found",
              ["The recipient does not have a registered profile."],
              "Recipient profile missing",
              [
                {
                  emoji: getEmoji("CONFIG"),
                  label: "Solution.",
                  text: "Ask the recipient to create a profile first.",
                },
              ],
            ),
          ],
        })
        return
      }

      // Convert amount to bigint string format using token decimals
      const amountBigInt = utils
        .parseUnits(amount, tokenBalance.token.decimal)
        .toString()

      // Create kudos transfer request
      const { ok, data, curl, log } = await mochiPay.createVaultTransferRequest(
        {
          profileId: senderProfile.id,
          appId,
          vaultId,
          targetProfileId: recipientProfile.id,
          tokenId,
          amount: amountBigInt,
          reason,
        },
      )

      if (!ok) {
        console.error("Kudos request failed:", { curl, log, data })
        return {
          messageOptions: {
            embeds: [
              errorEmbed(
                "Kudos request failed",
                ["Failed to create kudos request."],
                data?.message || "API error",
                [
                  {
                    emoji: getEmoji("CONFIG"),
                    label: "Suggestion.",
                    text: "Please try again later or contact support.",
                  },
                ],
              ),
            ],
            ephemeral: true,
          },
        }
      }

      // Calculate USD amount
      const usdAmount = tokenBalance.token.price
        ? transferAmount * tokenBalance.token.price
        : 0
      const formattedUsdAmount =
        usdAmount > 0 ? formatUsdDigit(usdAmount.toString()) : ""

      // Success response
      await interaction.editReply({
        embeds: [
          getSuccessEmbed({
            title: "Kudos Request Created",
            description: [
              `${getEmoji("NFT")}\`Amount.       \`${getEmojiToken(
                tokenSymbol.toUpperCase() as any,
              )} **${amount} ${tokenSymbol}**${
                formattedUsdAmount ? ` (≈ ${formattedUsdAmount})` : ""
              }`,
              `${getEmoji("COIN")}\`Token.        \`${tokenSymbol}`,
              `${getEmoji("SWAP")}\`Kudos to.     \`${recipient}`,
              `${getEmoji("SWAP")}\`From vault.   \`${vaultName}`,
              reason ? `${getEmoji("CONFIG")}\`Reason.       \`${reason}` : "",
              "",
              `${getEmoji(
                "CLOCK",
              )} The application owner will be notified to approve or reject this kudos request.`,
            ]
              .filter(Boolean)
              .join("\n"),
          }),
        ],
      })
    } catch (error) {
      console.error("Kudos request error:", error)
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "System error",
            [
              "An unexpected error occurred while processing your kudos request.",
            ],
            (error as Error)?.message || "Unknown error",
            [
              {
                emoji: getEmoji("CONFIG"),
                label: "Suggestion.",
                text: "Please try again later.",
              },
            ],
          ),
        ],
      })
      return
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "Kudos Transfer",
        description: [
          "Request a kudos transfer from an application vault to another user",
          "",
          `**Usage:** \`${SLASH_PREFIX}kudos\``,
          "",
          "**Parameters:**",
          "• **Application**: Select from your authorized applications",
          "• **Vault**: Choose a vault from the selected application",
          "• **Token**: Pick a token with available balance",
          "• **Amount**: Enter the amount to transfer as kudos",
          "• **Recipient**: Select the Discord user to receive kudos",
          "• **Reason**: Optional reason for the kudos",
          "",
          "**Process:**",
          "1. You submit a kudos request",
          "2. Application owner receives notification",
          "3. Owner approves or rejects the request",
          "4. If approved, tokens are transferred automatically",
        ].join("\n"),
        color: "BLUE",
      }),
    ],
  }),
  colorType: "Defi",
  ephemeral: true,
}

export default command
