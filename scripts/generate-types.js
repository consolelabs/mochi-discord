/* eslint-disable */
const { generateApi } = require("swagger-typescript-api");
const path = require("path");

generateApi({
  name: "api.ts",
  output: path.resolve(process.cwd(), "./src/types/"),
  url: "https://api.mochi.pod.town/swagger/doc.json",
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
