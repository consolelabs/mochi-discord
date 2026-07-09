// vite-node HMR cleanup lives in its own module: `import.meta` is a parse error
// under CJS, and jest (ts-jest, module commonjs) must never see it. index.ts
// loads this via a guarded dynamic import, so test runs skip the file entirely.
export function onBeforeFullReload(cb: () => Promise<void> | void) {
  // @ts-ignore
  if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.on("vite:beforeFullReload", cb)
  }
}
