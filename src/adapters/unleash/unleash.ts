import {
  UNLEASH_PAT_TOKEN,
  UNLEASH_API_TOKEN,
  UNLEASH_PROJECT,
  UNLEASH_SERVER_HOST,
  PROD,
} from "env"
import fetch from "node-fetch"
import { Unleash } from "unleash-client"
import { logger } from "logger"

export const appName = "mochi"
export let unleash: Unleash

export async function initUnleash() {
  unleash = new Unleash({
    url: `${UNLEASH_SERVER_HOST}/api`,
    appName: appName,
    projectName: UNLEASH_PROJECT,
    customHeaders: { Authorization: UNLEASH_API_TOKEN },
  })

  unleash.on("ready", () => {
    logger.info("Unleash READY")
  })
}

export async function getProjectFeatures(
  projectId: string,
): Promise<ProjectFeaturesResponse> {
  const response = await fetch(
    `${UNLEASH_SERVER_HOST}/api/admin/projects/${projectId}/features`,
    {
      headers: {
        Authorization: UNLEASH_PAT_TOKEN,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch project features: ${response.status}`)
  }

  // Use type assertion to tell TypeScript the expected type
  return (await response.json()) as ProjectFeaturesResponse
}

async function getProjectFeatureByName(projectId: string, name: string) {
  const response = await fetch(
    `${UNLEASH_SERVER_HOST}/api/admin/projects/${projectId}/features/${name}`,
    {
      headers: {
        Authorization: UNLEASH_PAT_TOKEN,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch project features: ${response.status}`)
  }

  const data = (await response.json()) as ProjectFeatureResponse

  // Use type assertion to tell TypeScript the expected type
  return data
}

export interface FilterFeatures {
  global?: boolean
}

export async function getFeatures(
  f?: FilterFeatures,
): Promise<Record<string, string[]>> {
  // Get feature data from Unleash
  const featureData: Record<string, string[]> = {}

  const desiredEnv = PROD ? "production" : "development"

  let data = await getProjectFeatures(UNLEASH_PROJECT) // change the projectName

  if (f?.global) {
    const globalFeatures = data.features.filter((d: any) => {
      const tags = d.tags as FeatureTag[]
      if (!tags) {
        return false
      }
      if (tags.some((tag) => tag.value === "global")) {
        return true
      }
    })
    data.features = globalFeatures
  }

  if (data) {
    const featureNames: string[] = data.features.map((d: any) => d.name)
    const filteredNames: string[] = featureNames.filter((name: string) =>
      name.includes(appName),
    )
    for (const name of filteredNames) {
      const d = await getProjectFeatureByName(UNLEASH_PROJECT, name) // change the projectName
      if (d) {
        const environmentData = d.environments.find(
          (e: { name: string }) => e.name === desiredEnv,
        )

        if (environmentData && environmentData.enabled) {
          const parts = name.split(".")
          // Extract values from "strategies" constraints with "contextName" as "guildId"
          environmentData.strategies.forEach((strat) => {
            if (featureData[parts[parts.length - 1]]) {
              featureData[parts[parts.length - 1]].push(
                ...collectGuildIdValues(strat),
              )
              return
            }
            featureData[parts[parts.length - 1]] = collectGuildIdValues(strat)
          })
        }
      }
    }
  }
  return featureData
}

// Function to collect guildId values
function collectGuildIdValues(strategy: any): string[] {
  let guildIdValues: string[] = []

  if (strategy.disabled) {
    return guildIdValues
  }

  for (const constraint of strategy.constraints) {
    if (constraint.contextName !== "guildId") {
      continue
    }
    const values = constraint.values
    if (Array.isArray(values)) {
      guildIdValues.push(...values)
    }
    break
  }

  return guildIdValues
}
