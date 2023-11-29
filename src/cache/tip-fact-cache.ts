import config from "adapters/config"
import { TEST } from "env"
import NodeCache from "node-cache"
import { Sentry } from "sentry"
import { getChance } from "utils/common"
import { PRODUCT_NAME } from "utils/constants"

const contentCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 3600,
  useClones: false,
})

export async function getTipsAndFacts() {
  const { ok, status, data, error } = await config.getContent("header")

  if (ok) {
    contentCache.set("content", data)
  } else {
    Sentry.captureException(
      new Error(`${PRODUCT_NAME}: getTipsAndFacts ⎯ ${error}`),
    )
    contentCache.set("content", { description: { fact: [], tip: [] } })
    getTipsAndFacts()
  }
}

export function getRandomFact() {
  if (TEST) return undefined
  const shouldShow = getChance(50)
  if (!shouldShow) return undefined
  const facts = contentCache.get<any>("content")?.description?.fact
  if (!facts || !facts.length) {
    getTipsAndFacts()
    return undefined
  }
  const randomIdx = Math.floor(Math.random() * facts.length)

  return `> ${facts[randomIdx]}`
}

export function getRandomTip() {
  if (TEST) return undefined
  const tips = contentCache.get<any>("content")?.description?.tip
  if (!tips || !tips.length) {
    getTipsAndFacts()
    return undefined
  }
  const randomIdx = Math.floor(Math.random() * tips.length)

  return tips[randomIdx]
}
