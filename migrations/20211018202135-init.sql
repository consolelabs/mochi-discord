
-- +migrate Up
CREATE TABLE discord_verifications (
    discord_user_id text,
    code text,
    created_at TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    discord_id text,
    twitter text,
    address text
);

CREATE UNIQUE INDEX "address_pkey" ON "public"."users" USING BTREE ("address");
-- +migrate Down

DROP TABLE discord_verifications;
DROP TABLE users;