import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { MachineConfig, route } from "utils/router"
import { renderInvestHome } from "./index/processor"
import CacheManager from "cache/node-cache"
import { renderInvestToken } from "./token/processor"
import community from "adapters/community"
import { ApiEarningOption } from "types/krystal-api"

CacheManager.init({
  ttl: 0,
  pool: "invest",
  checkperiod: 1,
})

export const machineConfig: (ctx: any) => MachineConfig = (context) => ({
  id: "invest",
  initial: "invests",
  context: {
    button: {
      invests: (i, ev, ctx) => {
        return renderInvestHome(ctx.page)
      },
    },
    ...context,
  },
  states: {
    invests: {
      on: {
        NEXT_PAGE: "invests",
        PREV_PAGE: "invests",
      },
    },
    invest: {
      on: {
        BACK: "invests",
      },
    },
  },
})

const slashCmd: SlashCommand = {
  name: "invest",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("invest")
      .setDescription("check available earn tokens")
      .addStringOption((opt) =>
        opt
          .setName("token")
          .setDescription("filter earn by token")
          .setRequired(false)
          .setAutocomplete(true)
      )

    return data
  },
  autocomplete: async function (i) {
    const { result } = await community.getEarns()
    await i.respond(
      result.map((d: ApiEarningOption) => ({
        name: (d.token?.name || "").toLowerCase(),
        value: (d.token?.name || "").toLowerCase(),
      }))
    )
  },
  run: async function (i: CommandInteraction) {
    const token = i.options.getString("token", false) ?? undefined
    const { context, msgOpts } = token
      ? await renderInvestToken(token)
      : await renderInvestHome()

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
