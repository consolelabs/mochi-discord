import { convertToSnakeCase } from "./fetcher-utils"

test.each([
  [
    { guild_id: "guild", role_id: "role" },
    { guild_id: "guild", role_id: "role" },
  ],
  [
    { guildId: "guild", roleId: "role" },
    { guild_id: "guild", role_id: "role" },
  ],
  [
    {
      guildId: "guild",
      userName: { emailAddress: "email", cityData: { name: "city name" } },
    },
    {
      guild_id: "guild",
      user_name: { email_address: "email", city_data: { name: "city name" } },
    },
  ],
])("convertToSnakeCase(%o)", (input, output) => {
  expect(convertToSnakeCase(input)).toStrictEqual(output)
})
