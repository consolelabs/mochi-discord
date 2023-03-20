import config from "adapters/config"
import { Message } from "discord.js"
import { APIError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import {
  ReactionType,
  buildSwitchViewActionRow,
  collectButton,
  composeMessage,
} from "./processor"

const command: Command = {
  id: "starboard_list",
  command: "list",
  brief: "List all bookmark in the starboard.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const defaultView: ReactionType = "message"

    const res = await config.listAllRepostReactionConfigs(
      msg.guild?.id ?? "",
      defaultView
    )
    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: msg,
        curl: res.curl,
        description: res.log,
      })
    }
    let reply
    if (!res.data?.length) {
      reply = await msg.reply({
        embeds: [
          getErrorEmbed({
            msg,
            title: "No starboards found",
            description: `You haven't configured any emojis in the starboard.\n\n${getEmoji(
              "POINTINGRIGHT"
            )} To set a new one, run \`\`\`$sb set <quantity> <emoji> <channel>\`\`\``,
          }),
        ],
        components: [buildSwitchViewActionRow(defaultView)],
      })
    } else {
      const { embeds, components } = await composeMessage(
        msg,
        res.data,
        defaultView,
        0
      )
      reply = await msg.reply({
        embeds: embeds,
        components: components,
      })
    }

    collectButton(reply, msg.author.id)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb list`,
          examples: `${PREFIX}sb list`,
          document: `${STARBOARD_GITBOOK}&action=list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
