import config from "adapters/config"
import { TEST } from "env"
import { logger } from "logger"
import NodeCache from "node-cache"
import { getChance } from "utils/common"
import retry from "retry"

const contentCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 3600,
  useClones: false,
})

export function getTipsAndFacts() {
  const operation = retry.operation()
  operation.attempt((currentAttempt) => {
    logger.info(`Fetching tips and facts... (attempt ${currentAttempt})`)
    config.getContent("header").then(({ ok, data }) => {
      if (ok) {
        logger.info("Fetch tips and facts OK")
        contentCache.set("content", data)
      } else {
        logger.warn("Fetch tips and facts FAIL, retrying...")
        contentCache.set("content", { description: { fact: [], tip: [] } })
        operation.retry()
      }
    })
  })
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
