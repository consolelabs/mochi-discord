import { ethers } from "ethers"
import abis from "./abis"
import fetch from "node-fetch"

export async function getTokenUri(
  provider: any,
  address: string,
  tokenId: number,
) {
  const contract = new ethers.Contract(address, abis.erc721, provider)
  return await contract.tokenURI(tokenId)
}

export function standardizeIpfsUrl(url: string) {
  return url.replace("ipfs://", "https://ipfs.io/ipfs/")
}

export async function getTokenMetadata(url: string) {
  if (url.startsWith("ipfs")) {
    url = standardizeIpfsUrl(url)
  }
  if (!url.startsWith("https")) return null
  const res = await fetch(url)
  return await res?.json()
}
