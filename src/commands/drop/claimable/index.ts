import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"

export const slashCmd: SlashCommand = {
  name: "claimable",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("claimable")
      .setDescription("view claimable airdrop campaigns")

    return data
  },
  run: () =>
    Promise.resolve({
      messageOptions: {
        content: "claimable",
      },
    }),
  help: () => Promise.resolve({}),
  colorType: "Server",
}
