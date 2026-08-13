import { protocol, net } from 'electron'
import { pathToFileURL } from 'node:url'
import { SOURCE_PROTOCOL } from '@shared/channels'
import { resolveSourceUrl } from './services/files'
import { createLogger } from './services/logger'

const log = createLogger('protocol')

/**
 * Must run before app.whenReady, which is why it is a separate call from the
 * handler registration below.
 *
 * `standard` gives the scheme a real origin so fetch treats it like http,
 * `secure` keeps it out of the mixed content blocklist, and `stream` lets the
 * response body be read progressively instead of buffered.
 */
export function registerSourceScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SOURCE_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false,
        corsEnabled: true
      }
    }
  ])
}

/**
 * Serves source images to the GPU worker.
 *
 * This is the only way the renderer can read a file, and it is deliberately
 * narrow: the URL carries an opaque id, not a path, and the id is looked up in
 * the import registry. A renderer that has been compromised cannot ask for
 * anything the user did not explicitly add to the queue, so there is no path
 * traversal surface to get wrong.
 */
export function registerSourceProtocol(): void {
  protocol.handle(SOURCE_PROTOCOL, async (request) => {
    const file = resolveSourceUrl(request.url)

    if (!file) {
      log.warn(`refused an unregistered source request: ${request.url}`)
      return new Response('not found', { status: 404 })
    }

    try {
      const response = await net.fetch(pathToFileURL(file.path).toString())
      // The worker only ever reads these once, and the bytes can be large, so
      // caching them in the renderer would be pure memory pressure.
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-store')
      headers.set('Access-Control-Allow-Origin', '*')
      return new Response(response.body, { status: response.status, headers })
    } catch (error) {
      log.warn(`could not read ${file.path}: ${String(error)}`)
      return new Response('unreadable', { status: 500 })
    }
  })
}
