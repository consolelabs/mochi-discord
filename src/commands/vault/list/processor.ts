import config from "adapters/config"
import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  User,
} from "discord.js"
import { InternalError } from "errors"
import {
  EmojiKey,
  getEmoji,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { getSlashCommand } from "utils/commands"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import profile from "adapters/profile"
import { ModelVault } from "types/api"
import { faker } from "@faker-js/faker"
import mochiPay from "adapters/mochi-pay"

export function formatVaults(
  vaults: Array<ModelVault & { total?: string }>,
  guildId: string,
) {
  return formatDataTable(
    vaults.map((v) => ({
      name: `${v.name?.slice(0, 10) ?? ""}${
        (v.name ?? "").length > 10 ? "..." : ""
      }`,
      address:
        (!guildId && v.discord_guild?.name) ||
        shortenHashOrAddress(v.wallet_address ?? "", 3),
      threshold: `${v.threshold ?? 0}%`,
      balance: v.total?.toString() ? `$${v.total.toString()}` : "",
      // @ts-ignore
      type: v.type === "trading" ? "trading" : "spot",
    })),
    {
      cols: ["name", "address", "threshold", "balance"],
      rowAfterFormatter: (f, i) =>
        `${getEmoji(
          "type" in vaults[i] ? "ANIMATED_STAR" : "ANIMATED_VAULT",
        )}${f}${getEmoji("CASH")}`,
    },
  ).joined
}

function mockData(data: Array<any>) {
  data.push({
    name: "podtown",
    wallet_address: faker.finance.ethereumAddress(),
    total: faker.finance.amount({ dec: 2, min: 0 }),
    threshold: 50,
    type: "trading",
    discord_guild: {
      name: "",
    },
  })
}

function formatAppVaults(vaults: any[]) {
  return formatDataTable(
    vaults.map((v) => ({
      name: `${v.name?.slice(0, 20) ?? ""}${
        (v.name ?? "").length > 20 ? "..." : ""
      }`,
      balance: v.total?.toString() ? `$${v.total.toString()}` : "",
      type: "application_vault",
    })),
    {
      cols: ["name", "balance"],
      rowAfterFormatter: (f, i) =>
        `${getEmoji(
          "type" in vaults[i] ? "ANIMATED_STAR" : "ANIMATED_VAULT",
        )}${f}${getEmoji("CASH")}`,
    },
  ).joined
}

export async function runVaultList(
  interaction: CommandInteraction | ButtonInteraction,
) {
  const userProfile = await profile.getByDiscord(interaction.user.id)
  const spotVaults = interaction.guildId
    ? await config.vaultList(interaction.guildId)
    : await config.vaultList("", false, userProfile.id)

  const appVaults = await mochiPay.getApplicationVaultBalancesByProfile(userProfile.id)

  const publicTradingVaults = (
    await mochiPay.listGlobalEarningVault(userProfile.id)
  ).map((v: any) => ({
    id: v.id,
    name: v.name,
    wallet_address: v.evm_wallet_address,
    total: v.investor_report.current_balance,
    threshold: 100,
    type: "trading",
    discord_guild: { name: "" },
  }))

  const tradingVaults = (
    interaction.guildId
      ? await mochiPay.listEarningVaults(
          userProfile.id,
          interaction.guildId,
          true,
        )
      : []
  ).map((v: any) => ({
    id: v.id,
    name: v.name,
    wallet_address: v.evm_wallet_address,
    total: v.investor_report.current_balance,
    threshold: 100,
    type: "trading",
    discord_guild: { name: "" },
  }))

  if (
    !spotVaults.length &&
    !tradingVaults.length &&
    !publicTradingVaults.length &&
    !appVaults.length
  ) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Empty list vault",
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} This guild does not have any vault yet`,
    })
  }

  // const vaults = data.filter((v: any) => v.discord_guild.name).slice(0, 9)
  let description = ""

  description += `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true,
  )} View detail of the vault ${await getSlashCommand("vault info")}\n\n`

  description += "**Spot**\n"
  description += formatVaults(
    // @ts-ignore
    spotVaults,
    interaction.guildId || "",
  )

  if (tradingVaults.length > 0) {
    description += "\n\n"
    description += "**Trading**\n"
    description += formatVaults(
      // @ts-ignore
      tradingVaults,
      interaction.guildId || "",
    )
  }

  if (publicTradingVaults.length > 0) {
    description += "\n\n"
    description += "**Public Trading**\n"
    description += formatVaults(
      // @ts-ignore
      publicTradingVaults,
      interaction.guildId || "",
    )
  }

  if (appVaults.length > 0) {
    description += "\n\n"
    description += "**Application Vaults**\n"
    description += formatAppVaults(appVaults)
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("MOCHI_CIRCLE")} Vault List`,
    description,
    color: msgColors.BLUE,
  })

  let spotOpts = interaction.guildId
    ? spotVaults.map((v: any, i: number) => ({
        emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
        label: v.name,
        value: v.name,
      }))
    : spotVaults.map((v: any, i: number) => ({
        emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
        label: `${v.name} - ${v.discord_guild?.name}`,
        value: `${v.name} - ${v.discord_guild?.id}`,
      }))

  const tradingOpts = tradingVaults.map((v: any, i: number) => ({
    emoji: getEmoji(`NUM_${spotOpts.length + i + 1}` as EmojiKey),
    label: v.name,
    value: `trading_${v.id}`,
  }))

  const publicTradingOpts = publicTradingVaults.map((v: any, i: number) => ({
    emoji: getEmoji(`NUM_${tradingOpts.length + i + 1}` as EmojiKey),
    label: v.name,
    value: `trading_${v.id}`,
  }))

  const options = [...spotOpts, ...tradingOpts, ...publicTradingOpts]

  const components = [
    new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setPlaceholder("💰 View a vault")
        .setCustomId("view_vault")
        .addOptions(options),
    ),
  ]

  const msgOpts = {
    embeds: [embed],
    components,
  }

  return {
    msgOpts,
    initial: "vaultList",
  }
}
