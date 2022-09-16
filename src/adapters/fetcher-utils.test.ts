import { convertToSnakeCase } from "./fetcher-utils"

test.each([
  // normal case
  [
    { guild_id: "guild", role_id: "role" },
    { guild_id: "guild", role_id: "role" },
  ],
  // normal case
  [
    { guildId: "guild", roleId: "role" },
    { guild_id: "guild", role_id: "role" },
  ],
  // nested case
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
  // array case
  [
    {
      users: [
        { emailAddress: "a" },
        { emailAddress: "b" },
        { emailAddress: "c" },
      ],
    },
    {
      users: [
        { email_address: "a" },
        { email_address: "b" },
        { email_address: "c" },
      ],
    },
  ],
  // array + nested case
  [
    {
      users: [
        {
          emailAddress: "a",
          company: { address: { cityName: "city", streetName: "street" } },
        },
        {
          emailAddress: "b",
          company: { address: { cityName: "city", streetName: "street" } },
        },
        {
          emailAddress: "c",
          company: { address: { cityName: "city", streetName: "street" } },
        },
        // primitive values are skipped
        "string",
        2,
        true,
      ],
    },
    {
      users: [
        {
          email_address: "a",
          company: { address: { city_name: "city", street_name: "street" } },
        },
        {
          email_address: "b",
          company: { address: { city_name: "city", street_name: "street" } },
        },
        {
          email_address: "c",
          company: { address: { city_name: "city", street_name: "street" } },
        },
        // primitive values are skipped
        "string",
        2,
        true,
      ],
    },
  ],
])("convertToSnakeCase(%o)", (input, output) => {
  expect(convertToSnakeCase(input)).toStrictEqual(output)
})
