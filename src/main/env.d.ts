/** Injected by electron.vite.config.ts at build time. */
declare const __BUILD_DATE__: string

/**
 * WebAssembly is a Node global, but TypeScript only ships its type definitions
 * inside the DOM library. Adding DOM to the Node project would put `document`
 * and `window` in scope for main process code, which is exactly the mistake
 * this separation exists to prevent, so the two members actually used by the
 * JPEG XL codec are declared here instead.
 */
declare namespace WebAssembly {
  interface Module {
    readonly __brand: 'WebAssembly.Module'
  }

  function compile(bytes: ArrayBuffer | ArrayBufferView): Promise<Module>
}
