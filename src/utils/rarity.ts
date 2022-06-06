import { getEmoji } from "utils/common"
export const getEmojiRarity = (rarityRate: string) => {
  switch (rarityRate) {
    case "Common":
      return getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")

    case "Rare":
      return getEmoji("RARE1") + getEmoji("RARE2") + getEmoji("RARE3")
    case "Uncommon":
      return (
        getEmoji("UNCOMMON1") + getEmoji("UNCOMMON2") + getEmoji("UNCOMMON3")
      )

    case "Legendary":
      return (
        getEmoji("LEGENDARY1") + getEmoji("LEGENDARY2") + getEmoji("LEGENDARY3")
      )
    case "Mythic":
      return getEmoji("MYTHIC1") + getEmoji("MYTHIC2") + getEmoji("MYTHIC3")
    default:
      return getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
  }
}

export const getRarityRateFromAttributes = (
  rarityCount: Map<string, number>
) => {
  let rarity = "Common"
  if (rarityCount.get("Legendary") > 0) {
    rarity = "Legendary"
  } else if (rarityCount.get("Mythic") > 0) {
    rarity = "Mythic"
  } else if (rarityCount.get("Rare") > 1) {
    rarity = "Rare"
  } else if (rarityCount.get("Uncommon") > 1 || rarityCount.get("Rare") == 1) {
    rarity = "Uncommon"
  }
  return rarity
}
