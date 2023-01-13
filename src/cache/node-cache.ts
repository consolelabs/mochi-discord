import NodeCache from "node-cache"

export class CacheManager {
  cachePools: Map<string, NodeCache> = new Map()

  init({
    pool,
    ttl,
    checkperiod,
  }: {
    pool: string
    ttl?: number
    checkperiod?: number
  }) {
    const cache = this.cachePools.get(pool)
    if (cache) return
    const newCache = new NodeCache({
      stdTTL: ttl,
      checkperiod,
      useClones: false,
    })
    this.cachePools.set(pool, newCache)
    return newCache
  }

  async get({
    pool,
    key,
    call,
    callIfCached,
    ttl = 120,
  }: {
    pool: string
    key: string
    call: () => Promise<any>
    callIfCached?: () => Promise<any>
    ttl?: number
  }) {
    const cache = this.cachePools.get(pool)
    if (!cache) return {}
    let val = cache.get(key)
    if (!val) {
      val = await call()
      cache.set(key, val, ttl)
    } else if (callIfCached) {
      await callIfCached()
    }
    return val as any
  }

  private find(pool: string, prefix: string, subStr?: string) {
    const cache = this.cachePools.get(pool)
    return cache
      ?.keys()
      .filter((k) => k.startsWith(prefix) && (!subStr || k.includes(subStr)))
  }

  findAndRemove(pool: string, prefix: string, subStr?: string) {
    const keys = this.find(pool, prefix, subStr) ?? []
    return this.cachePools.get(pool)?.del(keys)
  }
}

export default new CacheManager()
