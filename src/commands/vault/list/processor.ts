import config from "adapters/config"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { InternalError } from "errors"
import {
  authorFilter,
  EmojiKey,
  getEmoji,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { getSlashCommand } from "utils/commands"
import { wrapError } from "utils/wrap-error"
import { handleVaultRounds, runGetVaultDetail } from "../info/processor"
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

export async function runVaultList(interaction: CommandInteraction) {
  const userProfile = await profile.getByDiscord(interaction.user.id)
  const spotVaults = interaction.guildId
    ? await config.vaultList(interaction.guildId)
    : await config.vaultList("", false, userProfile.id)

  const tradingVaults = (
    (await mochiPay.listEarningVaults(userProfile.id)) || []
  ).map((v: any) => ({
    id: v.id,
    name: v.name,
    wallet_address: v.evm_wallet_address,
    total: v.investor_report.current_balance,
    threshold: 100,
    type: "trading",
    discord_guild: { name: "" },
  }))

  const data = [...spotVaults, ...tradingVaults]

  if (!spotVaults.length && !tradingVaults.length) {
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
    data.filter((d) => d.type !== "trading"),
    interaction.guildId || "",
  )

  if (tradingVaults.length > 0) {
    description += "\n\n"
    description += "**Trading**\n"
    description += formatVaults(
      // @ts-ignore
      data.filter((d) => d.type === "trading"),
      interaction.guildId || "",
    )
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

  const options = [...spotOpts, ...tradingOpts]

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

  const reply = (await interaction.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  collectSelection(reply, interaction.user, components, userProfile.id)
}

function collectSelection(
  reply: Message,
  author: User,
  components: any,
  profileId: string,
) {
  reply
    .createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }

        const [vaultType, selectedVault] = i.values[0].startsWith("trading_")
          ? i.values[0].split("_")
          : ["spot", i.values[0].split(" - ")[0]]
        i.guildId = i.guildId || i.values[0].split(" - ")[1]
        const { msgOpts } = await runGetVaultDetail(selectedVault, i, vaultType)

        msgOpts.components = [
          ...msgOpts.components,
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Back")
              .setStyle("SECONDARY")
              .setCustomId("back"),
          ),
        ] as any
        const edited = (await i.editReply(msgOpts)) as Message

        edited
          .createMessageComponentCollector({
            filter: authorFilter(author.id),
            componentType: "BUTTON",
            time: 300000,
          })
          .on("collect", (i) => {
            wrapError(edited, async () => {
              if (!i.deferred) {
                await i.deferUpdate().catch(() => null)
              }
              if (i.customId === "rounds") {
                const { msgOpts } = await handleVaultRounds(selectedVault, i)
                i.editReply({
                  embeds: msgOpts.embeds,
                  components: msgOpts.components,
                })
              } else {
                i.editReply({ embeds: reply.embeds, components })
              }
            })
          })
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}
