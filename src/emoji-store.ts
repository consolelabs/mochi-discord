// Shared registry of product-metadata emojis, fetched at boot by index.ts.
// Lives outside index.ts so utils/common.ts (imported by nearly every module)
// does not have to import the bot entrypoint: that import made every jest suite
// evaluate index.ts and created the errors/base <-> utils/common cycle.
export let emojis: Map<string, any> = new Map()

export function setEmojis(next: Map<string, any>) {
  emojis = next
}
