/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
/* eslint-disable */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "firebase-admin/app": "firebase-admin/lib/app",
    "firebase-admin/firestore": "firebase-admin/lib/firestore",
    // remark@14 / remark-gfm@3 are ESM-only; @consolelabs/mochi-formatter's CJS
    // dist requires them at import time and every suite fails to load. Stubbed
    // (only its changelog component uses them; no test renders a changelog).
    "^remark$": "<rootDir>/tests/mocks/remark.js",
    "^remark-gfm$": "<rootDir>/tests/mocks/remark-gfm.js",
    // jest-resolve@27 does not read package.json "exports", so the subpath
    // require("wretch/addons/queryString") in @consolelabs/mochi-rest cannot
    // resolve; point it at the CJS bundle node itself would pick via exports.
    "^wretch/addons/queryString$":
      "wretch/dist/bundle/addons/queryString.min.cjs",
    // @consolelabs/mochi-rest pulls nanoid@5 (ESM-only); the app already pins
    // nanoid@3 (CJS, same named exports), so route every import there.
    "^nanoid$": "<rootDir>/node_modules/nanoid",
    // @noble/ed25519@2 is ESM-only; see tests/mocks/noble-ed25519.js.
    "^@noble/ed25519$": "<rootDir>/tests/mocks/noble-ed25519.js",
  },
};
