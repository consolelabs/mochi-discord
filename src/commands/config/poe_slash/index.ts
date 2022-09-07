import { SlashCommand } from "types/common"
import { PREFIX } from "utils/constants"
import twitter from "./twitter"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { hasAdministrator, defaultEmojis } from "utils/common"
import { getErrorEmbed, getSuccessEmbed, composeEmbedMessage } from "utils/discordEmbed"
import { list, twitterList } from "./twitter/list"
import { set, twitterSet } from "./twitter/set"
import { remove, twitterRemove } from "./twitter/remove"

const command: SlashCommand = {
  name: "poe",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("poe")
      .setDescription("Proof of Engagement")

    data.addSubcommandGroup(twitter)
    return data
  },
  run: async function (interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const gMember = interaction?.guild?.members.cache.get(
      interaction?.user.id
    )
    if (!hasAdministrator(gMember)) {
      return { messageOptions: { embeds: [getErrorEmbed({
        title: `${defaultEmojis.ERROR} Insufficient permissions`,
        description: `<@${interaction.user.id}>, you need the following permissions on this channel to run this command`,
      })] } }
    }

    if (interaction.options.getSubcommandGroup() == twitter.name) {
      switch (interaction.options.getSubcommand()){
        case list.name:
          return twitterList(interaction)
        case set.name:
          return twitterSet(interaction)
        case remove.name:
          return twitterRemove(interaction)
      }
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}poe <twitter>`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}


export default command
