interface Constraint {
  values: string[]
  inverted: boolean
  operator: string
  contextName: string
  caseInsensitive: boolean
}

interface Strategy {
  name: string
  constraints: Constraint[]
  variants: any[] // Define the actual structure
  parameters: {
    groupId: string
    rollout: string
    stickiness: string
  }
  sortOrder: number
  id: string
  title: string
  disabled: boolean
}

interface Environment {
  name: string
  lastSeenAt: null | string
  enabled: boolean
  type: string
  sortOrder: number
  strategies: Strategy[]
  variantCount: number
}

interface FeatureData {
  type: string
  description: string | null
  favorite: boolean
  name: string
  createdAt: string
  lastSeenAt: null | string
  stale: boolean
  strategies: Strategy[]
  impressionData: boolean
  environments: Environment[]
}

interface ProjectFeaturesResponse {
  version: number
  features: FeatureData[]
}

interface ProjectFeatureResponse {
  environments: Environment[]
  name: string
  favorite: boolean
  impressionData: boolean
  description: string | null
  project: string
  stale: boolean
  lastSeenAt: null | string
  createdAt: string
  type: string
  tags: FeatureTag[]
  variants: any[] // Define the actual structure
  archived: boolean
}

interface FeatureTag {
  type: string
  value: string
}
