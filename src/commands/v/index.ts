import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import fs from "fs/promises"
import path from "path"
import { version } from "../../../package.json"

const slashCmd: SlashCommand = {
  name: "v",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("v")
      .setDescription("Check bot's version and running environment")
  },
  run: async function () {
    const uiVersion = await fs
      .readFile(
        path.resolve(
          process.cwd(),
          "node_modules",
          "@consolelabs/mochi-ui",
          "package.json",
        ),
        { encoding: "utf8" },
      )
      .then((pkg) => JSON.parse(pkg).version)
      .catch(() => "")

    const restVersion = await fs
      .readFile(
        path.resolve(
          process.cwd(),
          "node_modules",
          "@consolelabs/mochi-rest",
          "package.json",
        ),
        { encoding: "utf8" },
      )
      .then((pkg) => JSON.parse(pkg).version)
      .catch(() => "")
    return {
      messageOptions: {
        content: [
          `v${version} ⎯  ${process.env.NODE_ENV}`,
          `\`mochi-ui@${uiVersion}\``,
          `\`mochi-rest@${restVersion}\``,
        ].join("\n"),
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
