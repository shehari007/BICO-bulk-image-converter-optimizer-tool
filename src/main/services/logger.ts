import { app } from 'electron'
import { appendFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { LogLevel, LogRecord } from '@shared/types'

type Listener = (record: LogRecord) => void

const listeners = new Set<Listener>()

/**
 * Writes are queued behind a single promise so concurrent log calls cannot
 * interleave partial lines in the file. Losing ordering in a log is worse than
 * the negligible cost of serialising the appends.
 */
let writeChain: Promise<void> = Promise.resolve()
let logFile = ''
let ready = false

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

/** Debug noise is suppressed in packaged builds but kept during development. */
let minimumLevel: LogLevel = app.isPackaged ? 'info' : 'debug'

export function setLogLevel(level: LogLevel): void {
  minimumLevel = level
}

async function ensureLogFile(): Promise<void> {
  if (ready) return
  ready = true
  const dir = app.getPath('logs')
  await mkdir(dir, { recursive: true })
  logFile = join(dir, 'bico.log')
  await rotateIfLarge()
  await pruneOldLogs(dir)
}

/** Keeps a single run from filling the disk when a batch of 50k files fails. */
async function rotateIfLarge(): Promise<void> {
  try {
    const info = await stat(logFile)
    if (info.size > 5 * 1024 * 1024) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '')
      await appendFile(logFile, '')
      const { rename } = await import('node:fs/promises')
      await rename(logFile, `${logFile}.${stamp}`)
    }
  } catch {
    // No existing log file, which is the normal first run case.
  }
}

async function pruneOldLogs(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir)
    const rotated = entries.filter((name) => name.startsWith('bico.log.')).sort()
    for (const name of rotated.slice(0, Math.max(0, rotated.length - 5))) {
      await unlink(join(dir, name)).catch(() => undefined)
    }
  } catch {
    // A missing log directory is not worth reporting.
  }
}

function emit(level: LogLevel, scope: string, message: string): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minimumLevel]) return

  const record: LogRecord = { level, scope, message, time: Date.now() }

  for (const listener of listeners) {
    try {
      listener(record)
    } catch {
      // A broken listener must not take the logger down with it.
    }
  }

  const line = `${new Date(record.time).toISOString()} [${level}] [${scope}] ${message}\n`

  if (!app.isPackaged) {
    // Mirroring to the terminal is the whole point of running unpackaged, and
    // info lines have to reach stdout rather than stderr to stay readable.
    // eslint-disable-next-line no-console
    const target = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    target(line.trimEnd())
  }

  writeChain = writeChain
    .then(ensureLogFile)
    .then(() => appendFile(logFile, line, 'utf8'))
    .catch(() => undefined)
}

/** Subscribe to the live log stream, used by the in app diagnostics panel. */
export function onLog(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Namespaced logger so every line says which subsystem produced it. */
export function createLogger(scope: string): {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string, error?: unknown): void
} {
  return {
    debug: (message) => emit('debug', scope, message),
    info: (message) => emit('info', scope, message),
    warn: (message) => emit('warn', scope, message),
    error: (message, error) => {
      const detail =
        error instanceof Error
          ? `${message}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
          : error === undefined
            ? message
            : `${message}: ${String(error)}`
      emit('error', scope, detail)
    }
  }
}

export function logFilePath(): string {
  return logFile || join(app.getPath('logs'), 'bico.log')
}

/** Flushes anything still queued, called on quit so the last error survives. */
export async function flushLogs(): Promise<void> {
  await writeChain.catch(() => undefined)
}
