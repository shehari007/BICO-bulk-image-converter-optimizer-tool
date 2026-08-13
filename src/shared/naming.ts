import type { CaseTransform, ConversionSettings, SourceFile } from './types'
import { outputExtension } from './formats'
import { pad } from './utils'

/**
 * Characters that no supported filesystem accepts inside a single path
 * component. Built from escapes rather than literals so the source file stays
 * plain ASCII: the ASCII control range is the second half of the class.
 */
// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS = new RegExp('[<>:"/\\\\|?*\\u0000-\\u001F]', 'g')

/** Windows refuses these names regardless of the extension attached to them. */
const RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9'
])

/**
 * Makes a single path segment safe to write on Windows, macOS and Linux.
 *
 * Trailing dots and spaces are stripped because Explorer silently drops them,
 * which would otherwise turn `image .jpg` into a file the app cannot find again.
 */
export function sanitizeSegment(segment: string): string {
  let out = segment.replace(ILLEGAL_CHARS, '_').replace(/\s+/g, ' ').trim()
  out = out.replace(/[. ]+$/g, '')
  if (out.length === 0) out = 'image'
  if (RESERVED_NAMES.has(out.toLowerCase())) out = `_${out}`
  // NTFS caps a component at 255 characters, leave room for a collision suffix.
  if (out.length > 200) out = out.slice(0, 200)
  return out
}

export function applyCase(value: string, transform: CaseTransform): string {
  switch (transform) {
    case 'lower':
      return value.toLowerCase()
    case 'upper':
      return value.toUpperCase()
    case 'kebab':
      return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
    case 'snake':
      return value
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase()
    case 'none':
    default:
      return value
  }
}

export interface NameContext {
  file: SourceFile
  settings: ConversionSettings
  presetName: string
  index: number
  total: number
  width: number
  height: number
  /** Suffix contributed by a variant, empty for the primary output. */
  variant: string
  now: Date
}

/** Strips the extension from a filename, keeping any interior dots intact. */
export function baseName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0) return fileName
  return fileName.slice(0, lastDot)
}

function twoDigit(value: number): string {
  return pad(value, 2)
}

/**
 * Expands a filename template into a real name, without the extension.
 *
 * Unknown tokens are left untouched rather than deleted, so a typo in the
 * template is visible in the output instead of silently swallowing part of the
 * filename.
 */
export function resolveTemplate(template: string, ctx: NameContext): string {
  const { file, settings, now } = ctx
  const ext = outputExtension(settings.format, file.ext)
  const indexWidth = Math.max(String(ctx.total).length, 3)

  const tokens: Record<string, string> = {
    name: baseName(file.name),
    ext,
    format: settings.format === 'original' ? file.ext : settings.format,
    index: pad(ctx.index + 1, indexWidth),
    total: String(ctx.total),
    width: String(ctx.width || ''),
    height: String(ctx.height || ''),
    quality: String(settings.quality),
    preset: ctx.presetName || 'custom',
    variant: ctx.variant,
    parent: file.dir.split(/[\\/]/).filter(Boolean).pop() ?? '',
    date: `${now.getFullYear()}${twoDigit(now.getMonth() + 1)}${twoDigit(now.getDate())}`,
    time: `${twoDigit(now.getHours())}${twoDigit(now.getMinutes())}${twoDigit(now.getSeconds())}`,
    random: Math.random().toString(36).slice(2, 8)
  }

  const expanded = template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = tokens[token.toLowerCase()]
    return value === undefined ? match : value
  })

  const cased = applyCase(expanded, settings.output.caseTransform)
  const withVariant = ctx.variant && !template.includes('{variant}') ? cased + ctx.variant : cased

  return settings.output.sanitize ? sanitizeSegment(withVariant) : withVariant
}

/**
 * Every token the template field understands, used to build the UI hint list.
 *
 * Only the names live here. What each token does is explained in a tooltip, and
 * that sentence has to follow the interface language, which this module cannot
 * reach: the main process compiles it too and has no renderer dictionary. The
 * renderer maps these names onto its own translation keys.
 */
export const TEMPLATE_TOKENS = [
  'name',
  'ext',
  'format',
  'index',
  'total',
  'width',
  'height',
  'quality',
  'preset',
  'variant',
  'parent',
  'date',
  'time',
  'random'
] as const

export type TemplateToken = (typeof TEMPLATE_TOKENS)[number]
