/* eslint-disable */
const { generateApi } = require("swagger-typescript-api");
const path = require("path");

generateApi({
  name: "api.ts",
  output: path.resolve(process.cwd(), "./src/types/"),
  url: `${process.env.API_SERVER_HOST}/swagger/doc.json`,
  generateClient: false,
  silent: true,
});
