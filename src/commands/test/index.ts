import {
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SLASH_PREFIX,
  TIP_GITBOOK,
} from "utils/constants"
import { getEmoji, thumbnails } from "utils/common"
import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import tip from "./index/text"

const textCmd: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: tip,
  featured: {
    title: `${getEmoji("tip")} Tip`,
    description: "Send coins to a user or a group of users",
  },
  getHelpMessage: async (msg) => ({
    embeds: [],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 1,
}

export default { textCmd }
