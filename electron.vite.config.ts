import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const r = (...segments: string[]): string => resolve(__dirname, ...segments)

/**
 * The packaged renderer loads nothing it did not ship with, so its policy can
 * be strict. The development server cannot: React fast refresh injects an
 * inline preamble and hot reload runs over a websocket, both of which a
 * production grade policy would block. Injecting the header here rather than
 * writing it into index.html keeps the two variants from drifting apart.
 */
function cspPlugin(): Plugin {
  const common =
    "style-src 'self' 'unsafe-inline'; " +
    'img-src \'self\' data: blob: bico-src:; ' +
    "font-src 'self' data:; " +
    "worker-src 'self' blob:; " +
    "object-src 'none'; base-uri 'none'; form-action 'none'"

  const production =
    "default-src 'self'; script-src 'self'; connect-src 'self' bico-src: data: blob:; " + common

  const development =
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "connect-src 'self' bico-src: data: blob: ws: http://localhost:*; " +
    common

  return {
    name: 'bico-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const policy = ctx.server ? development : production
        return html.replace(
          '</head>',
          `  <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`
        )
      }
    }
  }
}

/**
 * Stamped into the bundle so the About panel can show when the binary was
 * produced. Reading it at runtime would report the launch time instead, which
 * tells a bug reporter nothing useful.
 */
const buildDate = JSON.stringify(new Date().toISOString())

export default defineConfig({
  main: {
    define: { __BUILD_DATE__: buildDate },
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': r('src/shared'),
        '@main': r('src/main')
      }
    },
    build: {
      // Two entry points: the Electron main process and the sharp worker that
      // the pool spawns with worker_threads. Both are emitted as CommonJS so
      // that native addons such as sharp resolve through require().
      rollupOptions: {
        input: {
          index: r('src/main/index.ts'),
          'workers/image.worker': r('src/main/workers/image.worker.ts')
        },
        output: {
          entryFileNames: '[name].js'
        }
      },
      minify: false,
      sourcemap: true
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': r('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: { index: r('src/preload/index.ts') },
        output: { entryFileNames: '[name].js' }
      },
      sourcemap: true
    }
  },
  renderer: {
    root: r('src/renderer'),
    resolve: {
      alias: {
        '@renderer': r('src/renderer/src'),
        '@shared': r('src/shared')
      }
    },
    plugins: [react(), cspPlugin()],
    build: {
      rollupOptions: {
        input: { index: r('src/renderer/index.html') },
        output: {
          // Ant Design is by far the largest dependency, and it changes only
          // when the lockfile does. Splitting it out keeps the application
          // chunk small enough to read in a diff and lets the two be parsed in
          // parallel on startup.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('@ant-design') || id.includes('/antd/') || id.includes('@rc-component')) {
              return 'antd'
            }
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react'
            }
            return 'vendor'
          }
        }
      },
      // Electron ships a known Chromium, so there is no reason to down level
      // modern syntax the way a browser build would.
      target: 'chrome138',
      sourcemap: true,
      // Sized just above the Ant Design chunk. A permanent warning about a
      // vendor library teaches everyone to ignore warnings, so the threshold is
      // set where it will only fire if the application code itself balloons.
      chunkSizeWarningLimit: 2400
    },
    worker: {
      format: 'es'
    },
    server: {
      /*
       * A fixed port, so the main process can wait on a known URL, and an
       * escape hatch for when something else on the machine has claimed it.
       *
       * strictPort is deliberate: silently moving to the next free port would
       * leave Electron waiting on an address nothing is serving, which reads as
       * a hung launch rather than a port clash. Failing loudly is the better of
       * the two. Set BICO_DEV_PORT to move it.
       */
      port: Number(process.env.BICO_DEV_PORT ?? 5199),
      strictPort: true
    }
  }
})
