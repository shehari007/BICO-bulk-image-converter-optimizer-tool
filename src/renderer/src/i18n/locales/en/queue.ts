/**
 * The queue region: the table, the grid, the filter header and the empty state
 * that stands in for all of it while nothing has been imported.
 *
 * Column titles are short on purpose. They sit above cells that are already
 * narrow, and a translation that runs long will wrap the header rather than
 * widen the column.
 */
export const queue = {
  /* ================================================================ */
  /* Header                                                            */
  /* ================================================================ */

  'queue.count.one': 'One image',
  'queue.count.many': '{count} images',
  'queue.count.filtered': '{shown} of {total} images',

  'queue.view.table': 'Table view',
  'queue.view.grid': 'Grid view',

  'queue.search.placeholder': 'Filter by filename',
  'queue.filter.aria': 'Filter the queue by status',
  'queue.filter.all': 'All images',
  'queue.filter.pending': 'Pending',
  'queue.filter.done': 'Done',
  'queue.filter.failed': 'Failed',
  'queue.filter.skipped': 'Skipped',

  'queue.clear': 'Clear',
  'queue.clear.title': 'Clear the queue',
  'queue.clear.description': 'Every image leaves the list. Nothing on disk is deleted.',
  'queue.clear.confirm': 'Clear',
  'queue.clear.keep': 'Keep',

  /* ================================================================ */
  /* Table                                                             */
  /* ================================================================ */

  'queue.column.thumbnail': 'Preview',
  'queue.column.file': 'File',
  'queue.column.dimensions': 'Dimensions',
  'queue.column.source': 'Source',
  'queue.column.output': 'Output',
  'queue.column.status': 'Status',
  'queue.column.backend': 'Backend',
  'queue.column.actions': 'Actions',

  'queue.dimensions.value': '{width} x {height}',
  'queue.dimensions.reading': 'Reading',
  'queue.dimensions.readingHint': "BICO is still reading this file's header.",

  'queue.output.pending': 'Pending',
  'queue.output.none': 'None',
  'queue.output.smaller': '-{percent}%',
  'queue.output.larger': '+{percent}%',

  'queue.backend.gpuHint': 'Graphics adapter',
  'queue.backend.cpuHint': 'Worker thread',

  'queue.row.remove': 'Remove from the queue',
  'queue.row.removeNamed': 'Remove {name}',
  'queue.row.thumbnailAlt': 'Thumbnail of {name}',

  'queue.empty.filtered': 'No images match this filter.',
  'queue.empty.filteredHint': 'Clear the search field or pick a different status.',
  'queue.grid.limited':
    'Showing the first {count} images. Switch to table view for the whole queue.',

  /* ================================================================ */
  /* Empty state                                                       */
  /* ================================================================ */

  'dropzone.title': 'Drop images here to get started',
  'dropzone.body':
    'Drag in files or folders. Folders are scanned all the way down and originals stay untouched.',
  'dropzone.formats': 'Readable formats: {list}',
  'dropzone.feature.recursive': 'Subfolders included',
  'dropzone.feature.nondestructive': 'Originals untouched',
  'dropzone.feature.formats': '{count} input formats'
} as const
