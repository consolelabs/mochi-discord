import { getEmoji } from "./common"

export function getEmojiRarity(rarityRate: string) {
  const rarities = ["Common", "Rare", "Uncommon", "Legendary", "Mythic"]
  if (!rarities.includes(rarityRate)) {
    rarityRate = "common"
  }
  return (
    getEmoji(`${rarityRate}1`) +
    getEmoji(`${rarityRate}2`) +
    getEmoji(`${rarityRate}3`)
  )
}

export function getRarityRateFromAttributes(rarityCount: Map<string, number>) {
  let rarity
  switch (true) {
    case rarityCount.get("Legendary") > 0:
      rarity = "Legendary"
      break
    case rarityCount.get("Mythic") > 0:
      rarity = "Mythic"
      break
    case rarityCount.get("Rare") > 1:
      rarity = "Rare"
      break
    case rarityCount.get("Uncommon") > 1 || rarityCount.get("Rare") == 1:
      rarity = "Uncommon"
      break
    default:
      rarity = "Common"
  }
  return rarity
}
