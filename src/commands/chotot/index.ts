import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { MachineConfig, route } from "utils/router"
import { renderAdDetail, renderListAds } from "./index/processor"
import CacheManager from "cache/node-cache"
import chotot from "adapters/chotot"
import qs from "query-string"
import { capitalizeFirst } from "utils/common"

CacheManager.init({
  ttl: 0,
  pool: "chotot",
  checkperiod: 1,
})

export const machineConfig: (ctx: any) => MachineConfig = (context) => ({
  id: "chotot",
  initial: "chotot",
  context: {
    button: {
      chotot: (i, _ev, ctx) => {
        return renderListAds(i, ctx.queryString, ctx.page)
      },
    },
    select: {
      chototDetail: (i) => renderAdDetail(i),
    },
    ...context,
  },
  states: {
    chotot: {
      on: {
        NEXT_PAGE: "chotot",
        PREV_PAGE: "chotot",
        VIEW_CHOTOT_DETAIL: "chototDetail",
      },
    },
    search: {
      on: {
        BACK: "chotot",
      },
    },
    chototDetail: {
      on: {
        BACK: "chotot",
      },
    },
  },
})

const slashCmd: SlashCommand = {
  name: "chotot",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("chotot")
      .setDescription("Search item on Chotot")
      .addStringOption((opt) =>
        opt
          .setName("keywords")
          .setDescription("search keywords")
          .setRequired(true)
          .setAutocomplete(true)
      )

    return data
  },
  autocomplete: async function (i) {
    const focusedValue = i.options.getFocused()
    if (focusedValue.length < 3) {
      return await i.respond([])
    }
    const res = await chotot.getSuggestions(focusedValue.toLowerCase())
    if (!res.ok) {
      return await i.respond([])
    }
    const options = (res.results || [])
      .filter(({ url }: { url: string }) => url.startsWith("https://"))
      .map(({ formal, url }: { formal: string; url: string }, i: number) => {
        const urlPaths = url.split("/").slice(3)
        const categoryName = urlPaths[urlPaths.length - 2] || urlPaths[0]
        const queryString = qs.stringify({
          keywords: focusedValue,
          index: i,
        })
        return {
          name: `${i + 1}. ${formal} (in ${capitalizeFirst(
            categoryName.split("-").join(" ")
          )})`,
          value: queryString,
        }
      })

    await i.respond(options)
  },
  run: async function (i: CommandInteraction) {
    let params = ""
    const resultIndex = i.options.getString("keywords", true)
    const queryObj = qs.parse(resultIndex)
    const res = await chotot.getSuggestions(
      ((queryObj.keywords as string) || "").toLowerCase()
    )

    if (res.ok) {
      const selectedResult = res.results[parseInt(queryObj.index as string)]
      params = qs.stringify({
        ...selectedResult.params,
        query_term: selectedResult.formal,
      })
    }

    const { context, msgOpts } = await renderListAds(i, params, 1)

    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig(context))
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
