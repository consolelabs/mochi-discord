/* eslint-disable */
require("dotenv").config();
const { generateApi } = require("swagger-typescript-api");
const path = require("path");

generateApi({
  name: "api.ts",
  output: path.resolve(process.cwd(), "./src/types/"),
  url: process.env.SWAGGER_URL || "https://api.mochi.pod.town/swagger/doc.json",
  generateClient: false,
  silent: true,
});

generateApi({
  name: "krystal-api.ts",
  output: path.resolve(process.cwd(), "./src/types/"),
  url: "https://api-docs-dev.krystal.team/docs/doc.json",
  generateClient: false,
  silent: true,
});
