// Jest stub: @noble/ed25519@2 is ESM-only. Only transfer_request/index/processor
// imports it (module-top wiring of etc.sha512Async + signAsync inside the
// request call). The helpers are real; signing throws loudly if a test ever
// actually signs instead of silently producing a bogus signature.
const etc = {
  concatBytes: (...arrays) => Buffer.concat(arrays.map((a) => Buffer.from(a))),
  bytesToHex: (b) => Buffer.from(b).toString("hex"),
};

module.exports = {
  etc,
  signAsync: async () => {
    throw new Error(
      "@noble/ed25519 stub (jest): signing is not available in tests",
    );
  },
};
