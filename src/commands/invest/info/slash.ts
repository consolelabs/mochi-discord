import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { MachineConfig, route } from "utils/router"
import { renderInvestHome, renderInvestToken } from "./processor"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import uniq from "lodash/uniq"

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
      invests: (i, _ev, ctx) => {
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
  name: "info",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("info")
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
    const { ok, data } = await community.getEarns()
    if (!ok) return await i.respond([])

    const symbols = uniq<string>(
      data.map((d) => d.token?.symbol?.toLowerCase() ?? "")
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
      ? await renderInvestToken(token)
      : await renderInvestHome(i)

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default slashCmd
