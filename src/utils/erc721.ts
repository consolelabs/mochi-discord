import { ethers } from "ethers"
import abis from "./abis"

export async function getTokenUri(
  provider: any,
  address: string,
  tokenId: number
) {
  const contract = new ethers.Contract(address, abis.erc721, provider)
  return await contract.tokenURI(tokenId)
}
