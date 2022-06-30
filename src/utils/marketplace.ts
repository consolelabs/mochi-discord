export function SplitMarketplaceLink(marketplaceLink: string): string {
  const tmpLink = marketplaceLink.split("https://")
  const platform = tmpLink[1].split(".")
  return platform[0]
}

export function CheckMarketplaceLink(markeplacelink: string): boolean {
  return markeplacelink.includes("https://")
}
