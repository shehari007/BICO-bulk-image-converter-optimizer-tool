import type { DeepPartial } from './types'

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/** Renders a byte count the way a file manager would. */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  const unit = BYTE_UNITS[exponent] ?? 'B'
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${unit}`
}

/** Compact form for dense table cells, for example `1.4 MB`. */
export function formatBytesShort(bytes: number): string {
  return formatBytes(bytes, bytes >= 1024 * 1024 ? 1 : 0)
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0s'
  if (ms < 1000) return `${Math.round(ms)}ms`
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0
  return clamp((part / whole) * 100, 0, 100)
}

/** Savings as a signed percentage. Negative means the output grew. */
export function savingsPercent(before: number, after: number): number {
  if (before <= 0) return 0
  return ((before - after) / before) * 100
}

let counter = 0

/** Short, collision resistant id. Good enough for queue keys and job ids. */
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 0xffff
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${random}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Recursively overlays `patch` on top of `base` without mutating either.
 *
 * Arrays are replaced rather than merged, which is what presets and variant
 * lists want: choosing a preset with two variants should not leave a third one
 * behind from whatever was selected before.
 */
export function deepMerge<T>(base: T, patch: DeepPartial<T> | undefined | null): T {
  if (!patch) return base
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch as unknown as T) ?? base
  }

  const result: Record<string, unknown> = { ...base }
  for (const [key, patchValue] of Object.entries(patch)) {
    if (patchValue === undefined) continue
    const baseValue = result[key]
    if (isPlainObject(baseValue) && isPlainObject(patchValue)) {
      result[key] = deepMerge(baseValue, patchValue as DeepPartial<typeof baseValue>)
    } else {
      result[key] = patchValue
    }
  }
  return result as T
}

/** Structured clone that also works across the IPC boundary for plain data. */
export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Turns `#rrggbb` or `#rrggbbaa` into the object sharp expects. */
export function parseColor(input: string): { r: number; g: number; b: number; alpha: number } {
  const fallback = { r: 0, g: 0, b: 0, alpha: 0 }
  if (typeof input !== 'string') return fallback

  let hex = input.trim().replace(/^#/, '')
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (hex.length !== 6 && hex.length !== 8) return fallback
  if (!/^[0-9a-fA-F]+$/.test(hex)) return fallback

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
  }
}

/** Normalised RGBA in the 0 to 1 range, which is what WGSL shaders want. */
export function parseColorFloat(input: string): [number, number, number, number] {
  const { r, g, b, alpha } = parseColor(input)
  return [r / 255, g / 255, b / 255, alpha]
}

/** Trailing edge debounce that survives React re renders when kept in a ref. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = (...args: A): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, waitMs)
  }
  wrapped.cancel = (): void => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return wrapped
}

/** Splits an array into fixed size chunks. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [items.slice()]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

/** Wraps a value so a `switch` over a union is provably exhaustive. */
export function assertNever(value: never, context: string): never {
  throw new Error(`Unhandled ${context}: ${String(value)}`)
}

/** Extracts a readable message from anything a catch block can receive. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/** Pads a number with leading zeroes, used by the {index} filename token. */
export function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

/** Bytes per second expressed in megabytes per second. */
export function toMbps(bytes: number, ms: number): number {
  if (ms <= 0) return 0
  return bytes / 1024 / 1024 / (ms / 1000)
}
