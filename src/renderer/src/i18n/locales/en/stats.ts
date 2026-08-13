/**
 * The lifetime statistics panel.
 *
 * The long sentences here are the point of the panel rather than decoration:
 * a counter without an explanation of what it counted is a number nobody can
 * trust. Anything with a count in it that changes the wording carries a second
 * key, because the interpolation helper has no plural rules by design.
 */
export const stats = {
  'stats.title': 'Lifetime statistics',
  'stats.since': 'Counting on this computer since {date}.',
  'stats.sinceUnknown': 'Counting on this computer across every run you have finished.',

  'stats.action.refresh': 'Refresh',
  'stats.action.reset': 'Reset',

  'stats.reset.title': 'Erase every lifetime counter?',
  'stats.reset.description':
    'Permanently deletes the totals, the ninety day chart and the best run. This cannot be undone. Your images and run history are untouched.',
  'stats.reset.ok': 'Erase them',
  'stats.reset.cancel': 'Keep them',
  'stats.reset.done': 'Every lifetime counter is back to zero.',
  'stats.reset.failed': 'The counters could not be reset.',
  'stats.load.failed': 'The statistics could not be read from disk.',

  'stats.empty.title': 'Nothing counted yet',
  'stats.empty.description':
    'Totals appear once your first run finishes: images written, bytes saved, time taken and the engine used.',

  'stats.headline.images': 'Images converted',
  'stats.headline.imagesOne': 'Image converted',
  'stats.headline.saved': 'Space saved',
  'stats.headline.added': 'Space added',
  'stats.headline.time': 'Time converting',
  'stats.headline.runs': 'Runs finished',
  'stats.headline.runsOne': 'Run finished',

  'stats.activity.title': 'Activity',
  'stats.activity.hint': 'Images finished on each of the last ninety days.',
  'stats.activity.chart':
    'Images converted per day over the last ninety days. Busiest day {date} with {images} images, {total} across the window.',
  'stats.activity.chartQuiet':
    'Images converted per day over the last ninety days. Nothing was converted.',
  'stats.activity.peak': 'Busiest day {date}, {images} images',
  'stats.activity.peakOne': 'Busiest day {date}, one image',
  'stats.activity.quiet': 'Nothing converted in the last ninety days',
  'stats.activity.windowTotal': '{images} in this window',

  'stats.formats.title': 'Output formats',
  'stats.formats.hint': 'Images written per format, with what each saved against the originals.',
  'stats.formats.original': 'Same as the source',
  'stats.formats.images': '{images} images',
  'stats.formats.imagesOne': '1 image',
  'stats.formats.saved': '{bytes} saved',
  'stats.formats.added': '{bytes} added',
  'stats.formats.bar': '{format}, {images} images written, {saved}.',
  'stats.formats.empty': 'No output format has been written yet.',

  'stats.backend.title': 'GPU against CPU',
  'stats.backend.hint': 'Which engine did the work on each file.',
  'stats.backend.chart':
    '{gpu} images finished on the GPU and {cpu} on the CPU, a GPU share of {share}.',
  'stats.backend.centre': 'on GPU',
  'stats.backend.empty': 'No image has been attributed to an engine yet.',
  'stats.backend.images': '{images} images',

  'stats.best.title': 'Best run',
  'stats.best.saved': '{bytes} saved',
  'stats.best.detail': '{images} images written as {format} on {date}',
  'stats.best.detailOne': 'One image written as {format} on {date}',
  'stats.best.percent': '{percent} smaller',
  'stats.best.none': 'No run has saved anything yet, so there is no best run to show.',

  'stats.derived.title': 'Derived figures',
  'stats.derived.hint': 'Worked out from the totals above rather than stored.',
  'stats.derived.averageSaving': 'Average saving',
  'stats.derived.imagesPerRun': 'Images per run',
  'stats.derived.msPerImage': 'Time per image',
  'stats.derived.gpuShare': 'GPU share',
  'stats.derived.activeDays': 'Active days',
  'stats.derived.activeDaysValue': '{days} days',
  'stats.derived.activeDaysValueOne': '1 day',
  'stats.derived.volume': 'Bytes handled',
  'stats.derived.volumeValue': '{read} read, {written} written',
  'stats.derived.failed': 'Images that failed',
  'stats.derived.skipped': 'Images skipped'
} as const
