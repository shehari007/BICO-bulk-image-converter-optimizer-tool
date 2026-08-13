import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import { savingsPercent } from '@shared/utils'
import type { BackendUsed, JobOutput, SourceFile } from '@shared/types'

interface ReportRow {
  file: SourceFile
  ok: boolean
  skipped: boolean
  backend: BackendUsed
  device: string
  outputs: JobOutput[]
  originalSize: number
  outputSize: number
  durationMs: number
  error: string | null
}

/**
 * Quotes a value for CSV.
 *
 * A leading equals, plus, minus or at sign is prefixed with a single quote,
 * because spreadsheet applications treat those as the start of a formula. A
 * filename beginning with one of them would otherwise execute on open, which is
 * the CSV injection class of bug.
 */
function csvCell(value: string | number): string {
  const text = String(value)
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`
  }
  return guarded
}

const HEADER = [
  'source_path',
  'source_name',
  'status',
  'backend',
  'device',
  'original_bytes',
  'output_bytes',
  'saved_bytes',
  'saved_percent',
  'duration_ms',
  'outputs',
  'error'
]

/**
 * Excel guesses the local code page unless the file opens with a byte order
 * mark, which mangles any filename outside ASCII. Built from a code point so
 * the source file itself stays plain ASCII.
 */
const BOM = String.fromCharCode(0xfeff)

/**
 * Writes a per file audit of the run.
 *
 * The report lands next to the output when there is a folder to write into, and
 * falls back to the user data directory when the run targeted a ZIP or wrote in
 * place, so the file is never dropped somewhere the user cannot find it.
 */
export async function writeCsvReport(
  runId: string,
  outputLocation: string,
  rows: readonly ReportRow[]
): Promise<string> {
  const looksLikeFolder =
    outputLocation.length > 0 && !outputLocation.toLowerCase().endsWith('.zip')
  const directory = looksLikeFolder ? outputLocation : join(app.getPath('userData'), 'reports')

  await mkdir(directory, { recursive: true })
  const target = join(directory, `bico-report-${runId}.csv`)

  const lines: string[] = [HEADER.join(',')]

  for (const row of rows) {
    const saved = row.originalSize - row.outputSize
    lines.push(
      [
        csvCell(row.file.path),
        csvCell(row.file.name),
        csvCell(row.skipped ? 'skipped' : row.ok ? 'ok' : 'failed'),
        csvCell(row.backend),
        csvCell(row.device),
        csvCell(row.originalSize),
        csvCell(row.outputSize),
        csvCell(saved),
        csvCell(savingsPercent(row.originalSize, row.outputSize).toFixed(2)),
        csvCell(Math.round(row.durationMs)),
        csvCell(row.outputs.map((output) => output.path).join(' | ')),
        csvCell(row.error ?? '')
      ].join(',')
    )
  }

  await writeFile(target, `${BOM}${lines.join('\r\n')}\r\n`, 'utf8')
  return target
}
