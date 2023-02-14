import * as processor from "./processor"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import community from "adapters/community"
jest.mock("adapters/community")

describe("executeNftIntegrateCommand", () => {
  afterEach(() => jest.clearAllMocks())

  test("executeNftIntegrateCommand successfully", async () => {
    jest.spyOn(community, "getNftCollectionInfo").mockResolvedValueOnce({
      status: 200,
      data: {
        symbol: "ABC",
        name: "ABC",
      },
    } as any)
    jest.spyOn(community, "updateSupportVerse").mockResolvedValueOnce({
      status: 200,
    } as any)
    const output = await processor.executeNftIntegrateCommand(
      "0x123123",
      "5",
      "123123",
      "121212",
      undefined
    )
    const expected = getSuccessEmbed({
      title: `ABC integrated`,
      description: `ABC collection is now ready to take part in our verse (added + enabled)`,
    })

    expect(community.getNftCollectionInfo).toHaveBeenCalled()
    expect(community.updateSupportVerse).toHaveBeenCalled()
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("executeNftIntegrateCommand api 500", async () => {
    jest.spyOn(community, "getNftCollectionInfo").mockResolvedValueOnce({
      status: 200,
      data: {},
    } as any)
    jest.spyOn(community, "updateSupportVerse").mockResolvedValueOnce({
      status: 500,
    } as any)
    const output = await processor.executeNftIntegrateCommand(
      "0x123123",
      "5",
      "123123",
      "121212",
      undefined
    )
    const expected = getErrorEmbed({
      description: "Internal Server Error",
    })

    expect(community.getNftCollectionInfo).toHaveBeenCalled()
    expect(community.updateSupportVerse).toHaveBeenCalled()
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("executeNftIntegrateCommand api 400", async () => {
    jest.spyOn(community, "getNftCollectionInfo").mockResolvedValueOnce({
      status: 200,
      data: {},
    } as any)
    jest.spyOn(community, "updateSupportVerse").mockResolvedValueOnce({
      status: 400,
      error: "Error",
    } as any)
    const output = await processor.executeNftIntegrateCommand(
      "0x123123",
      "5",
      "123123",
      "121212",
      undefined
    )
    const expected = getErrorEmbed({
      description: "Error",
    })

    expect(community.getNftCollectionInfo).toHaveBeenCalled()
    expect(community.updateSupportVerse).toHaveBeenCalled()
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
