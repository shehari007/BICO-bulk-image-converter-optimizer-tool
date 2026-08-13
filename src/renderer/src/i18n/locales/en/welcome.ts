/** The first run and post upgrade welcome screen. */
export const welcome = {
  'welcome.version': 'Version {version}',
  'welcome.intro':
    'BICO converts and optimises images in bulk on this machine. Nothing is uploaded, and originals stay untouched unless you ask.',
  'welcome.whatsNew': 'New in {version}',
  'welcome.dontShowAgain': 'Do not show this again',
  'welcome.start': 'Get started',
  'welcome.facts.aria': 'Detected hardware',

  'welcome.fact.processor': 'Processor',
  'welcome.fact.processorValue': '{cpu}, {threads} threads',
  'welcome.fact.workers': 'Worker threads',
  'welcome.fact.workersValue': '{count} running',
  'welcome.fact.graphics': 'Graphics',
  'welcome.fact.graphicsNone': 'No usable adapter, conversions run on the processor',

  'welcome.highlight.threads.title': 'Nothing blocks',
  'welcome.highlight.threads.body':
    'Encoding runs in a pool of native worker threads sized to your processor.',
  'welcome.highlight.gpu.title': 'GPU acceleration',
  'welcome.highlight.gpu.body':
    'Resize, filters and colour work run as compute shaders on your graphics adapter, with a fall back to the processor.',
  'welcome.highlight.formats.title': 'Nine output formats',
  'welcome.highlight.formats.body':
    'From JPEG and PNG to AVIF, JPEG XL and JPEG 2000, each with its own encoder controls.',
  'welcome.highlight.preview.title': 'See it before you run it',
  'welcome.highlight.preview.body':
    'A live before and after comparison at your current settings, with the projected output size.',
  'welcome.highlight.languages.title': 'Three languages',
  'welcome.highlight.languages.body':
    'English, Turkish and Arabic throughout, with the layout mirroring for Arabic.',
  'welcome.highlight.themes.title': 'Eight themes',
  'welcome.highlight.themes.body':
    'Complete palettes rather than accent swaps, each previewed live before you choose.'
} as const
