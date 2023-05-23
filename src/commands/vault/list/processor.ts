import config from "adapters/config"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { MessageEmbed } from "discord.js"
import { APIError } from "errors"
import {
  authorFilter,
  EmojiKey,
  getEmoji,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { getSlashCommand } from "utils/commands"
import { wrapError } from "utils/wrap-error"
import { runGetVaultDetail } from "../info/processor"

export async function runVaultList(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    throw new GuildIdNotFoundError({ message: interaction })
  }

  const { data, ok, curl, error, log } = await config.vaultList(
    interaction.guildId
  )
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }

  if (!data) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Empty list vault",
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} This guild does not have any vault yet`,
    })
  }

  const vaults = data.slice(0, 9)
  let description = ""
  const longest = vaults.reduce(
    (acc: number, c: any) => Math.max(acc, c.name.length),
    0
  )
  for (let i = 0; i < vaults.length; i++) {
    description += `${getEmoji(`NUM_${i + 1}` as EmojiKey)}\`${
      data[i].name
    } ${" ".repeat(longest - data[i].name.length)} | ${shortenHashOrAddress(
      data[i].wallet_address
    )} | ${" ".repeat(3 - data[i].threshold.toString().length)}${
      data[i].threshold
    }%\`\n`
  }

  description += `\n${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} View detail of the vault </vault info:${await getSlashCommand(
    "vault info"
  )}>`

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("MOCHI_CIRCLE")} Vault List`)
    .setDescription(description)
    .setColor(msgColors.BLUE)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())

  const components = [
    new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setPlaceholder("View a vault")
        .setCustomId("view_vault")
        .addOptions(
          vaults.map((v: any, i: number) => ({
            emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
            label: v.name,
            value: v.name,
          }))
        )
    ),
  ]
  const reply = (await interaction.editReply({
    embeds: [embed],
    components,
  })) as Message

  collectSelection(reply, interaction.user, components)
}

function collectSelection(reply: Message, author: User, components: any) {
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
        const selectedVault = i.values[0]
        const { messageOptions } = await runGetVaultDetail(selectedVault, i)

        messageOptions.components = [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Back")
              .setStyle("SECONDARY")
              .setCustomId("back")
          ),
        ] as any
        const edited = (await i.editReply(messageOptions)) as Message

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
              i.editReply({ embeds: reply.embeds, components })
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
