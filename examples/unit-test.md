# Unit test

Can refer to test in `src/commands/defi/watchlist`

1. Import mockClient from `/tests/mocks`

```
import { mockClient } from "../../../../tests/mocks"
```

2. Mock adapters

```
jest.mock("adapters/defi")
```

3. Add test for command

```
describe("test_create", () => {
    // logic unit test
})
```

4. Mock discord guild, user, message

```
const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
const userId = Discord.SnowflakeUtil.generate()
const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
        content: "$test create #general",
        author: {
            id: userId,
            username: "tester",
            discriminator   : 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
    },
    Reflect.construct(Discord.TextChannel, [
        guild,
        {
            client: mockClient,
            guild: guild,
            id: Discord.SnowflakeUtil.generate(),
        },
    ]),
])
```

5. Add test case

- Mock api response
- Create variable real result for command and variable expected result
- Compare real and expected result

```
test("success", async () => {
    // Mock api response

    const res = {
        ok: true,
        data: {
            id: 1,
            name: "Mochi"
        },
        error: null,
    }
    defi.createTestForComers = jest.fn().mockResolvedValueOnce(res)

    // Output is real result when run command, expected will get result from mock

    const output = await command.run(msg)
    const expected = composeEmbedMessage(msg, {
        title: `${defaultEmojis.MAG} Multiple options found`,
        description: `Multiple tokens found for \`${res.data.symbol}\`.\nPlease select one of the following`,
    })

    // compare between real result and expect result

    expect(defi.createTestForComers).toHaveBeenCalled()
    expect(defi.createTestForComers).toHaveBeenCalledWith({
        user_id: userId,
    })
    expect(expected.title).toStrictEqual(
        output?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
        output?.messageOptions?.embeds?.[0].description
    )
})
```
