import * as processor from "./processor"
import { getErrorEmbed } from "ui/discord/embed"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import community from "adapters/community"
jest.mock("adapters/community")

describe("composeNFTListEmbed", () => {
  afterEach(() => jest.clearAllMocks())

  test("composeNFTListEmbed no collection", async () => {
    jest.spyOn(community, "getNFTCollections").mockResolvedValueOnce({
      status: 200,
      data: {
        data: [],
      },
    } as any)

    const output = await processor.composeNFTListEmbed(undefined, 10)
    const expected = getErrorEmbed({
      description: "No NFT collections found",
    })

    expect(community.getNFTCollections).toHaveBeenCalled()
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
