import { Command } from "types/common"
import { getEmoji, thumbnails } from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import claim from "./index/text"

const textCmd: Command = {
  id: "tip-onchain",
  command: "tip",
  brief: "Onchain Tip Bot",
  category: "Defi",
  run: claim,
  featured: {
    title: `${getEmoji("tip")} Claim your pending transfers`,
    description: "Claim transfers from others",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}claim 1234 0xabc`,
        description: "Send coins onchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot Onchain",
        examples: `\`\`\`${PREFIX}claim <Claim ID> <Your recpient address>\`\`\``,
      }).addFields({
        name: "**Instructions**",
        value: `[**Gitbook**](${TIP_GITBOOK})`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
  allowDM: true,
}

export default { textCmd }
