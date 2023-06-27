import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { run } from "./processor"

const command: SlashCommand = {
  name: "set",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("captcha")
      .setDescription("Create a captcha verfication flow for role")
      .addRoleOption((opt) =>
        opt
          .setName("for_role")
          .setDescription("the role to assign to verified users")
          .setRequired(true)
      )
  },
  run,
  help: () => Promise.resolve({}),
  colorType: "Server",
}
export default command
