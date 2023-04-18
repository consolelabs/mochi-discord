import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import claim from "./index/text"

const textCmd: Command = {
  id: "tip-onchain",
  command: "tip",
  brief: "Claim on-chain tips",
  category: "Defi",
  run: claim,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}claim 1234 0xabc`,
        description: "Transfer received token to your crypto wallet.",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Claim on-chain tips",
        examples: `${PREFIX}claim <Claim ID> <Your recpient address>`,
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
