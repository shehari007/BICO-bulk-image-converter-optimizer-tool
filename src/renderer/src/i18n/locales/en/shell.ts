/**
 * The application shell: the settings drawer that stands in for the docked
 * sidebar once the window is narrow, the drag and drop overlay, and the toasts
 * raised by the import and conversion actions.
 *
 * The compare slider strings sit here too, under `preview.compare`, because that
 * is the area a translator reads them in. `panels.ts` owns the rest of
 * `preview.*` and defines nothing under that subtree, so the flat merge cannot
 * collide.
 *
 * Counts carry a singular and a plural key rather than a placeholder the caller
 * pluralises, because `interpolate` has no plural rules and Arabic has more
 * categories than English does.
 */
export const shell = {
  /* ================================================================ */
  /* Shell                                                             */
  /* ================================================================ */

  'shell.settings.title': 'Conversion settings',

  'shell.drop.title': 'Drop to add',
  'shell.drop.body': 'Images and folders are both accepted',

  /* ================================================================ */
  /* Import                                                            */
  /* ================================================================ */

  'shell.import.unreadable': 'Those items could not be read from disk.',
  'shell.import.dropEmpty': 'No supported images were found in that drop.',
  'shell.import.folderEmpty': 'That folder contained no supported images.',
  'shell.import.added.one': 'Added one image.',
  'shell.import.added.many': 'Added {count} images.',

  /* ================================================================ */
  /* Conversion                                                        */
  /* ================================================================ */

  'shell.convert.empty': 'Add some images first.',
  'shell.convert.needsFolder': 'Choose an output folder before starting.',
  'shell.convert.cancelling': 'Finishing the images already in progress, then stopping.',

  /* ================================================================ */
  /* Compare slider                                                    */
  /* ================================================================ */

  'preview.error.unsupported': 'This image could not be previewed at these settings.',

  'preview.compare.subject': 'the selected image',
  'preview.compare.altBefore': '{subject} before conversion',
  'preview.compare.altAfter': '{subject} after conversion',
  'preview.compare.converted': 'Converted',
  'preview.compare.original': 'Original',
  'preview.compare.aria': 'Comparison wipe position',
  'preview.compare.ariaValue': '{percent} percent converted'
} as const
