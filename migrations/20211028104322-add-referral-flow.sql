
-- +migrate Up
ALTER TABLE "users" rename column "twitter" to "twitter_id";

alter TABLE users ADD column referral_code text NOT NULL default substring(md5(random()::text), 0, 9);

alter table users add column invited_by text;


-- +migrate Down
ALTER TABLE "users" rename column "twitter_id" to "twitter";

alter table "users" drop column "referral_code";

alter table "users" drop column "invited_by";
