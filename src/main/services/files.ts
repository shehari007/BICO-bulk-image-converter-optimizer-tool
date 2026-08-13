import { readdir, realpath, stat } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import { isReadableExtension } from '@shared/formats'
import { errorMessage, uid } from '@shared/utils'
import { SOURCE_PROTOCOL } from '@shared/channels'
import { createLogger } from './logger'
import type { AddFilesOptions, AddFilesResult, SourceFile } from '@shared/types'

const log = createLogger('files')

/**
 * The authoritative list of every file the user has imported this session.
 *
 * The renderer only ever holds ids. That keeps IPC payloads small, but more
 * importantly it means the custom protocol handler can resolve an id back to a
 * path through this map and refuse anything else. The renderer is therefore
 * unable to read a file the user did not explicitly add, even though it can
 * issue fetch requests on the custom scheme.
 */
const registry = new Map<string, SourceFile>()

/** Reverse index so re importing the same path reuses its existing id. */
const byPath = new Map<string, string>()

export function getFile(id: string): SourceFile | undefined {
  return registry.get(id)
}

export function getFiles(ids: readonly string[]): SourceFile[] {
  const out: SourceFile[] = []
  for (const id of ids) {
    const file = registry.get(id)
    if (file) out.push(file)
  }
  return out
}

export function removeFiles(ids: readonly string[]): void {
  for (const id of ids) {
    const file = registry.get(id)
    if (!file) continue
    registry.delete(id)
    byPath.delete(file.path)
  }
}

export function clearFiles(): void {
  registry.clear()
  byPath.clear()
}

export function fileCount(): number {
  return registry.size
}

/** URL the GPU worker fetches. Carries an opaque id, never a filesystem path. */
export function sourceUrl(id: string): string {
  return `${SOURCE_PROTOCOL}://file/${encodeURIComponent(id)}`
}

/** Resolves a URL produced by `sourceUrl` back to a registered file. */
export function resolveSourceUrl(url: string): SourceFile | undefined {
  try {
    const parsed = new URL(url)
    const id = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
    return registry.get(id)
  } catch {
    return undefined
  }
}

/** Directories that never contain user content and only slow a scan down. */
const SKIPPED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '$recycle.bin',
  'system volume information',
  '.trash',
  '.cache'
])

interface WalkAccumulator {
  found: { path: string; root: string }[]
  rejected: { path: string; reason: string }[]
  scannedDirs: number
}

/**
 * Depth first walk with an explicit stack.
 *
 * Recursion was avoided on purpose: a deeply nested photo archive on Windows
 * can exceed the default call stack, and a user importing their whole Pictures
 * tree should not crash the app.
 */
async function walkDirectory(
  root: string,
  recursive: boolean,
  acc: WalkAccumulator,
  visited: Set<string>
): Promise<void> {
  const stack: string[] = [root]

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined) break

    let real: string
    try {
      real = await realpath(current)
    } catch {
      real = current
    }
    // Symlinked directories can form a cycle, so each physical directory is
    // only ever entered once.
    if (visited.has(real)) continue
    visited.add(real)

    let entries: Dirent[]
    try {
      entries = await readdir(current, { withFileTypes: true })
      acc.scannedDirs += 1
    } catch (error) {
      acc.rejected.push({ path: current, reason: errorMessage(error) })
      continue
    }

    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        if (!recursive) continue
        if (SKIPPED_DIRS.has(entry.name.toLowerCase())) continue
        stack.push(full)
      } else if (entry.isFile()) {
        acc.found.push({ path: full, root })
      }
    }
  }
}

/**
 * Turns a mixed list of files and folders into registered `SourceFile` records.
 *
 * `relPath` is captured relative to whichever folder the user actually dropped,
 * which is what lets the mirror output structure recreate their tree instead of
 * flattening everything into one directory.
 */
export async function addPaths(
  paths: readonly string[],
  options: AddFilesOptions
): Promise<AddFilesResult> {
  const started = Date.now()
  const acc: WalkAccumulator = { found: [], rejected: [], scannedDirs: 0 }
  const visited = new Set<string>()

  for (const target of paths) {
    try {
      const info = await stat(target)
      if (info.isDirectory()) {
        await walkDirectory(target, options.recursive, acc, visited)
      } else if (info.isFile()) {
        // A loose file has no meaningful tree, so it mirrors as a bare name.
        acc.found.push({ path: target, root: dirname(target) })
      }
    } catch (error) {
      acc.rejected.push({ path: target, reason: errorMessage(error) })
    }
  }

  const added: SourceFile[] = []

  for (const candidate of acc.found) {
    const ext = extname(candidate.path).replace(/^\./, '').toLowerCase()

    if (!isReadableExtension(ext)) {
      continue
    }

    if (byPath.has(candidate.path)) {
      continue
    }

    let info: Awaited<ReturnType<typeof stat>>
    try {
      info = await stat(candidate.path)
    } catch (error) {
      acc.rejected.push({ path: candidate.path, reason: errorMessage(error) })
      continue
    }

    if (info.size < options.minBytes) {
      acc.rejected.push({ path: candidate.path, reason: 'file is smaller than the minimum size' })
      continue
    }

    const relFromRoot = relative(candidate.root, candidate.path)
    const file: SourceFile = {
      id: uid('f'),
      path: candidate.path,
      name: basename(candidate.path),
      dir: dirname(candidate.path),
      ext,
      // Guard against a relative path escaping upward, which would otherwise
      // let a mirror write land outside the chosen output folder.
      relPath: relFromRoot.startsWith('..') ? basename(candidate.path) : relFromRoot,
      size: info.size,
      mtimeMs: info.mtimeMs
    }

    registry.set(file.id, file)
    byPath.set(file.path, file.id)
    added.push(file)
  }

  const durationMs = Date.now() - started
  log.info(
    `imported ${added.length} files from ${paths.length} targets in ${durationMs}ms ` +
      `(${acc.scannedDirs} directories scanned, ${acc.rejected.length} rejected)`
  )

  return { files: added, rejected: acc.rejected, scannedDirs: acc.scannedDirs, durationMs }
}

/** Normalises a path for display, collapsing a long home directory prefix. */
export function shortenPath(target: string, maxSegments = 4): string {
  const parts = target.split(sep).filter(Boolean)
  if (parts.length <= maxSegments) return target
  return ['...', ...parts.slice(-maxSegments)].join(sep)
}
