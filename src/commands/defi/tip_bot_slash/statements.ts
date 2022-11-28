import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction, MessageOptions } from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { SlashCommand } from "types/common"
import { authorFilter, getEmoji } from "utils/common"
import { DEFI_DEFAULT_FOOTER, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { buildButtonsRow, handleStatement } from "../statements"

function listenButtonsRow(
  interaction: CommandInteraction,
  args: string,
  pages: any,
  render: (
    interaction: CommandInteraction,
    pageIdx: number,
    pages: any
  ) => Promise<{ messageOptions: MessageOptions }>
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }

  interaction.channel
    ?.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(interaction.user.id),
    })
    .on("collect", async (i) => {
      const [pageStr, opStr] = i.customId.split("_").slice(1)
      let page = +pageStr + operators[opStr]
      if (i.customId.includes("statement_cash")) {
        const [flow] = i.customId.split("_").slice(2)
        const newPages = await handleStatement(
          args,
          interaction.user.id,
          flow === "inflow",
          flow === "outflow"
        )
        pages = newPages
        page = 0
      }
      const {
        messageOptions: { embeds, components },
      } = await render(interaction, page, pages)

      const msgComponents = components
      await interaction
        .editReply({
          embeds,
          components: msgComponents,
        })
        .catch(() => null)
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })
}

const command: SlashCommand = {
  name: "statements",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("statements")
      .setDescription("List all transactions histories of your wallet")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: FTM")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    let token = interaction.options.getString("token")
    if (!token) {
      token = ""
    }
    const pages = await handleStatement(token, interaction.user.id)
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: `${getEmoji("STATEMENTS")} Transaction histories`,
              description: `You haven't made any transaction ${
                token !== "" ? `with **${token.toUpperCase()}** yet` : ""
              }. Run ${SLASH_PREFIX} <@username/@role> <amount> <token> to transfer token.`,
            }),
          ],
        },
      }
    }
    const msgOpts = {
      messageOptions: {
        embeds: [pages[0]],
        components: buildButtonsRow(0, pages.length),
      },
    }
    listenButtonsRow(
      interaction,
      token,
      pages,
      async (interaction: CommandInteraction, idx: number, pages: any) => {
        return {
          messageOptions: {
            embeds: [pages[idx]],
            components: buildButtonsRow(idx, pages.length),
          },
        }
      }
    )
    return msgOpts
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}statements [token]`,
        description: "Show your statements",
        examples: `${SLASH_PREFIX}statements\n${SLASH_PREFIX}statements ftm`,
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Statements",
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
