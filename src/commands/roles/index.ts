import { SlashCommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { MachineConfig, route } from "utils/router"
import { render, View } from "./index/processor"

const machineConfig: MachineConfig = {
  id: "roles",
  initial: "defaultRole",
  context: {
    button: {
      defaultRole: (i, _ev, ctx) => render(i, View.DefaultRole, ctx.data),
      levelRole: (i, _ev, ctx) => render(i, View.LevelRole, ctx.data),
      nftRole: (i, _ev, ctx) => render(i, View.NftRole, ctx.data),
      reactionRole: (i, _ev, ctx) => render(i, View.ReactionRole, ctx.data),
      tokenRole: (i, _ev, ctx) => render(i, View.TokenRole, ctx.data),
    },
  },
  states: {
    defaultRole: {
      on: {
        BACK_ROLE: "tokenRole",
        NEXT_ROLE: "levelRole",
      },
    },
    levelRole: {
      on: {
        BACK_ROLE: "defaultRole",
        NEXT_ROLE: "nftRole",
      },
    },
    nftRole: {
      on: {
        BACK_ROLE: "levelRole",
        NEXT_ROLE: "reactionRole",
      },
    },
    reactionRole: {
      on: {
        BACK_ROLE: "nftRole",
        NEXT_ROLE: "tokenRole",
      },
    },
    tokenRole: {
      on: {
        BACK_ROLE: "reactionRole",
        NEXT_ROLE: "defaultRole",
      },
    },
  },
}

const slashCmd: SlashCommand = {
  name: "roles",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("roles")
      .setDescription("list all role configs in your server")

    return data
  },
  run: async function (i) {
    const { msgOpts } = await render(i, View.DefaultRole)

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig)
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
