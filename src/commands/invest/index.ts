import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { MachineConfig, route } from "utils/router"
import { renderInvestHome } from "./index/processor"
import CacheManager from "cache/node-cache"
import { renderInvestToken } from "./token/processor"
import community from "adapters/community"
import { ApiEarningOption } from "types/krystal-api"
import uniq from "lodash/uniq"

CacheManager.init({
  ttl: 0,
  pool: "invest",
  checkperiod: 1,
})

const machineConfig: (ctx: any) => MachineConfig = (context) => ({
  id: "invest",
  initial: "invests",
  context: {
    button: {
      invests: (i, ev, ctx) => {
        return renderInvestHome(i, ctx.page)
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
    const data = new SlashCommandBuilder()
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
    const focusedValue = i.options.getFocused()
    const { result } = await community.getEarns()
    const symbols = uniq<string>(
      result.map((d: ApiEarningOption) => d.token?.symbol?.toLowerCase())
    )
    const options = symbols
      .filter((symbol: string) => symbol.includes(focusedValue.toLowerCase()))
      .slice(0, 25)
      .map((symbol: string) => ({ name: symbol, value: symbol }))
    await i.respond(options)
  },
  run: async function (i: CommandInteraction) {
    const token = i.options.getString("token", false) ?? undefined
    const { context, msgOpts } = token
      ? await renderInvestToken(i, token)
      : await renderInvestHome(i)

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
