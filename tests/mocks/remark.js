// Jest stub: remark@14 is ESM-only and cannot be required from the CJS dist of
// @consolelabs/mochi-formatter. Only its changelog component uses remark, and no
// test exercises changelog rendering, so a pass-through processor is enough.
const processor = {
  use() {
    return processor;
  },
  process: async (md) => ({ toString: () => String(md) }),
  processSync: (md) => ({ toString: () => String(md) }),
};

module.exports = { remark: () => processor };
