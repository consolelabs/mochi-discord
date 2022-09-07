import { set } from "./set"
import { list } from "./list"
import { remove } from "./remove"
import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders"

const twitter = new SlashCommandSubcommandGroupBuilder()
  .setName("twitter")
  .setDescription("Configure your server's PoE through twitter")

twitter
  .addSubcommand(set)
  .addSubcommand(list)
  .addSubcommand(remove)

export default twitter
