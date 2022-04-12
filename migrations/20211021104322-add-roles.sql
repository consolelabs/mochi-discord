
-- +migrate Up
CREATE TABLE "guilds" (
  "id" text PRIMARY KEY,
  "guild_id" text UNIQUE,
  "name" text,
  "token_address" text
);

CREATE TABLE "roles" (
  "id" text PRIMARY KEY,
  "name" text,
  "role_id" text UNIQUE,
  "guild_id" text,
  "number_of_token" int
);

CREATE TABLE "discord_users" (
  "id" text PRIMARY KEY,
  "discord_id" text UNIQUE,
  "guild_id" text
);

CREATE TABLE "user_addresses" (
  "id" text PRIMARY KEY,
  "address" text,
  "discord_user_id" text
);

ALTER TABLE "roles" ADD FOREIGN KEY ("guild_id") REFERENCES "guilds" ("guild_id");

ALTER TABLE "discord_users" ADD FOREIGN KEY ("discord_id") REFERENCES "roles" ("role_id");

ALTER TABLE "discord_users" ADD FOREIGN KEY ("guild_id") REFERENCES "guilds" ("guild_id");

ALTER TABLE "user_addresses" ADD FOREIGN KEY ("discord_user_id") REFERENCES "discord_users" ("discord_id");

-- +migrate Down
DROP TABLE "guilds" CASCADE;
DROP TABLE "roles" CASCADE;
DROP TABLE "discord_users" CASCADE;
DROP TABLE "user_addresses" CASCADE;