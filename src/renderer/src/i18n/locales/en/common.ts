/**
 * Strings shared across the whole interface.
 *
 * English is the source of truth. Every other language is typed against this
 * file, so adding a key here makes Turkish and Arabic fail to compile until
 * they are translated, which is exactly the reminder a release needs.
 */
export const common = {
  'app.name': 'BICO',
  'app.tagline': 'Bulk Image Converter and Optimizer',

  'action.ok': 'OK',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.save': 'Save',
  'action.delete': 'Delete',
  'action.remove': 'Remove',
  'action.apply': 'Apply',
  'action.reset': 'Reset',
  'action.copy': 'Copy',
  'action.copied': 'Copied',
  'action.open': 'Open',
  'action.browse': 'Browse',
  'action.import': 'Import',
  'action.export': 'Export',
  'action.duplicate': 'Duplicate',
  'action.retry': 'Retry',
  'action.clear': 'Clear',
  'action.showInFolder': 'Show in file manager',
  'action.learnMore': 'Learn more',

  'state.on': 'On',
  'state.off': 'Off',
  'state.automatic': 'Automatic',
  'state.none': 'None',
  'state.unknown': 'Unknown',
  'state.loading': 'Loading',
  'state.unavailable': 'Not available',

  'unit.byte': 'B',
  'unit.kb': 'KB',
  'unit.mb': 'MB',
  'unit.gb': 'GB',
  'unit.tb': 'TB',
  'unit.pixels': 'px',
  'unit.dpi': 'DPI',
  'unit.perSecond': 'per second',
  'unit.mbPerSecond': 'MB/s',
  'unit.imagesPerSecond': 'images/s',
  'unit.milliseconds': 'ms',
  'unit.seconds': 's',
  'unit.percent': 'percent',

  'time.hoursMinutes': '{hours}h {minutes}m',
  'time.minutesSeconds': '{minutes}m {seconds}s',
  'time.seconds': '{seconds}s',
  'time.milliseconds': '{ms}ms',

  'backend.gpu': 'GPU',
  'backend.cpu': 'CPU',

  'status.queued': 'Queued',
  'status.running': 'Running',
  'status.done': 'Done',
  'status.failed': 'Failed',
  'status.skipped': 'Skipped',
  'status.cancelled': 'Cancelled'
} as const
