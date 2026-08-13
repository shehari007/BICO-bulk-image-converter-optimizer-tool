/**
 * The settings sidebar.
 *
 * By far the largest body of copy in the app, because almost every control
 * carries an explanatory sentence underneath it. Those sentences are the part
 * that actually teaches the format tradeoffs, so they are translated as
 * carefully as the labels above them.
 *
 * Keys are grouped by the section they belong to. A handful of value formats and
 * position names are shared between sections and live under `settings.value` and
 * `settings.position` rather than being repeated per section.
 */
export const settings = {
  /* ================================================================ */
  /* Shared value formats and anchor names                             */
  /* ================================================================ */

  'settings.value.px': '{value} px',
  'settings.value.percent': '{value}%',
  'settings.value.percentWord': '{value} percent',
  'settings.value.degrees': '{value} degrees',
  'settings.value.deg': '{value} deg',
  'settings.value.megabytes': '{value} MB',
  'settings.value.range': '{min} to {max}',

  'settings.axis.x': 'X',
  'settings.axis.y': 'Y',
  'settings.axis.width': 'W',
  'settings.axis.height': 'H',

  'settings.position.center': 'Centre',
  'settings.position.north': 'Top',
  'settings.position.northeast': 'Top right',
  'settings.position.east': 'Right',
  'settings.position.southeast': 'Bottom right',
  'settings.position.south': 'Bottom',
  'settings.position.southwest': 'Bottom left',
  'settings.position.west': 'Left',
  'settings.position.northwest': 'Top left',
  'settings.position.entropy': 'Busiest area',
  'settings.position.attention': 'Main subject',

  /* ================================================================ */
  /* Sidebar sections and their header badges                          */
  /* ================================================================ */

  'settings.section.format': 'Output format',
  'settings.section.resize': 'Resize',
  'settings.section.transform': 'Transform',
  'settings.section.adjust': 'Adjustments',
  'settings.section.watermark': 'Watermark',
  'settings.section.metadata': 'Metadata',
  'settings.section.output': 'Output',
  'settings.section.variants': 'Variants',
  'settings.section.smart': 'Smart',
  'settings.section.performance': 'Performance',

  'settings.summary.more': '{first} +{count}',

  'settings.summary.format.original': 'Original',
  'settings.summary.format.lossless': '{format} lossless',
  'settings.summary.format.quality': '{format} {quality}',

  'settings.summary.resize.exact': '{width} by {height}',
  'settings.summary.resize.exactUnset': 'Exact size',
  'settings.summary.resize.width': '{value} wide',
  'settings.summary.resize.widthUnset': 'Fixed width',
  'settings.summary.resize.height': '{value} tall',
  'settings.summary.resize.heightUnset': 'Fixed height',
  'settings.summary.resize.longest': '{value} long edge',
  'settings.summary.resize.longestUnset': 'Longest edge',
  'settings.summary.resize.shortest': '{value} short edge',
  'settings.summary.resize.shortestUnset': 'Shortest edge',
  'settings.summary.resize.percentage': '{value} percent',
  'settings.summary.resize.megapixels': '{value} MP',

  'settings.summary.transform.rotated': 'Turned {angle}',
  'settings.summary.transform.flippedBoth': 'Flipped both ways',
  'settings.summary.transform.mirrored': 'Mirrored',
  'settings.summary.transform.flipped': 'Flipped',
  'settings.summary.transform.cropped': 'Cropped',
  'settings.summary.transform.border': '{value} px border',
  'settings.summary.transform.exifIgnored': 'EXIF ignored',

  'settings.summary.adjust.activeOne': '1 active',
  'settings.summary.adjust.active': '{count} active',

  'settings.summary.watermark.text': 'Text',
  'settings.summary.watermark.image': 'Image',

  'settings.summary.metadata.keepAll': 'Keep all',
  'settings.summary.metadata.keepProfile': 'Keep profile',
  'settings.summary.metadata.keepCopyright': 'Keep copyright',
  'settings.summary.metadata.density': '{value} DPI',
  'settings.summary.metadata.customProfile': 'Custom profile',
  'settings.summary.metadata.attributed': 'Attributed',

  'settings.summary.output.zip': 'Into a ZIP',
  'settings.summary.output.inPlace': 'In place',
  'settings.summary.output.mirror': 'Mirrored tree',
  'settings.summary.output.byFormat': 'Split by format',
  'settings.summary.output.byDate': 'Split by date',
  'settings.summary.output.customNames': 'Custom names',
  'settings.summary.output.overwrites': 'Overwrites',
  'settings.summary.output.skipsExisting': 'Skips existing',
  'settings.summary.output.caseChanged': 'Case changed',
  'settings.summary.output.skipsGrowth': 'Skips growth',
  'settings.summary.output.report': 'CSV report',

  'settings.summary.variants.enabledOne': '1 enabled',
  'settings.summary.variants.enabled': '{count} enabled',

  'settings.summary.smart.under': 'Under {value} KB',
  'settings.summary.smart.about': 'About {value} KB',
  'settings.summary.smart.autoFormat': 'Auto format',
  'settings.summary.smart.autoPalette': 'Auto palette',

  'settings.summary.performance.gpuOnly': 'GPU only',
  'settings.summary.performance.cpuOnly': 'CPU only',
  'settings.summary.performance.workerOne': '1 worker',
  'settings.summary.performance.workers': '{count} workers',
  'settings.summary.performance.everyGpu': 'Every GPU',
  'settings.summary.performance.noGpuAssist': 'No GPU assist',
  'settings.summary.performance.cache': '{value} MB cache',

  /* ================================================================ */
  /* Preset bar                                                        */
  /* ================================================================ */

  'settings.preset.select': 'Active preset',
  'settings.preset.groupBuiltin': 'Built in',
  'settings.preset.groupMine': 'Yours',
  'settings.preset.modified': 'Modified',
  'settings.preset.revertTooltip': 'Discard these changes and load the preset again',
  'settings.preset.revertLabel': 'Reset to the saved preset',
  'settings.preset.saveTooltip': 'Save the settings on screen as a preset of your own',
  'settings.preset.save': 'Save',

  /* ================================================================ */
  /* Format section                                                    */
  /* ================================================================ */

  'settings.format.label': 'Output format',
  'settings.format.original.label': 'Keep each original format',
  'settings.format.jpeg.tagline': 'Universal photo format',
  'settings.format.jpeg.description':
    'Opens everywhere. No transparency or animation, but MozJPEG keeps it competitive on photographs.',
  'settings.format.png.tagline': 'Lossless with transparency',
  'settings.format.png.description':
    'Pixel exact with alpha, for screenshots, logos and UI assets. Palette mode cuts flat artwork hard.',
  'settings.format.webp.tagline': 'The safe modern default',
  'settings.format.webp.description':
    'Around 30 percent smaller than JPEG at matching quality, with alpha and animation. Every current browser reads it.',
  'settings.format.avif.tagline': 'Smallest files, slowest encode',
  'settings.format.avif.description':
    'The best compression here, often half the size of WebP. Encoding is slow, so raise effort only when size matters most.',
  'settings.format.tiff.tagline': 'Archival and print',
  'settings.format.tiff.description':
    'For print, scanning and archives. High bit depths, several compression schemes and pyramidal tiling.',
  'settings.format.gif.tagline': 'Legacy animation',
  'settings.format.gif.description':
    'Limited to 256 colours and superseded by animated WebP, but still the safest for short loops in old clients.',
  'settings.format.heif.tagline': 'Apple ecosystem',
  'settings.format.heif.description':
    'What iPhones write by default. Strong compression and wide colour, but playback off Apple platforms is patchy.',
  'settings.format.jxl.tagline': 'Smaller than AVIF, faster to encode',
  'settings.format.jxl.description':
    'Holds detail better than AVIF at the same size and encodes faster. Browser support is limited, and metadata is not carried through.',
  'settings.format.jp2.tagline': 'Wavelet archive format',
  'settings.format.jp2.description':
    'Required in medical imaging, digital cinema and some archives. Files are large, and quality is a signal to noise target, not a percentage.',

  'settings.format.original.tagline': 'Convert nothing, only optimise',
  'settings.format.original.description':
    'Each file is written back to the format it arrived in. Resizing, adjustments and watermarks still apply.',
  'settings.format.unavailable':
    'Not available: this libvips build was compiled without that codec.',

  'settings.format.caps.alpha.on': 'Transparency',
  'settings.format.caps.alpha.off': 'No transparency',
  'settings.format.caps.animation.on': 'Animation',
  'settings.format.caps.animation.off': 'No animation',
  'settings.format.caps.lossless.on': 'Lossless mode',
  'settings.format.caps.lossless.off': 'Lossy only',
  'settings.format.caps.hdr.on': 'High bit depth',
  'settings.format.caps.hdr.off': 'Eight bit only',
  'settings.format.caps.metadata.on': 'Keeps metadata',
  'settings.format.caps.metadata.off': 'Drops metadata',
  'settings.format.caps.gpu.on': 'GPU encodable',
  'settings.format.caps.gpu.off': 'Encodes on CPU',

  'settings.format.quality.label': 'Quality',
  'settings.format.quality.hint':
    'Higher keeps more detail in bigger files. Photos hold up at 75 to 90.',
  'settings.format.lossless.label': 'Lossless',
  'settings.format.lossless.hint': 'Reproduces every pixel exactly. Files get much larger.',
  'settings.format.effort.label': 'Encoder effort',
  'settings.format.effort.hint': 'Higher effort means smaller files and slower encoding.',
  'settings.format.effort.fast': 'Fast',
  'settings.format.effort.small': 'Small',
  'settings.format.chroma.label': 'Chroma subsampling',
  'settings.format.chroma.hint':
    '4:4:4 keeps colour at full resolution. 4:2:0 keeps a quarter of it.',
  'settings.format.alphaQuality.label': 'Alpha quality',
  'settings.format.alphaQuality.hint':
    'How hard the transparency mask is compressed. Leave it at 100.',
  'settings.format.progressive.label': 'Progressive',
  'settings.format.progressive.hint':
    'Shows a rough version first, then refines it as the rest arrives.',
  'settings.format.animated.label': 'Keep animation',
  'settings.format.animated.hint':
    'Converts every frame of an animated source. Off writes the first only.',

  'settings.format.jpeg.title': 'JPEG encoder',
  'settings.format.jpeg.mozjpeg.label': 'MozJPEG',
  'settings.format.jpeg.mozjpeg.hint':
    "Mozilla's tuned encoder. Usually 5 to 15 percent smaller than the standard one at the same quality, and slower.",
  'settings.format.jpeg.trellis.label': 'Trellis quantisation',
  'settings.format.jpeg.trellis.hint':
    'Optimises each coefficient for storage cost. Slow, worth a few percent.',
  'settings.format.jpeg.overshoot.label': 'Overshoot deringing',
  'settings.format.jpeg.overshoot.hint':
    'Suppresses the halo around hard edges that makes text look dirty.',
  'settings.format.jpeg.scans.label': 'Optimise progressive scans',
  'settings.format.jpeg.scans.hint':
    'Searches for a better progressive scan order. Needs Progressive on.',

  'settings.format.png.title': 'PNG encoder',
  'settings.format.png.compression.label': 'Compression level',
  'settings.format.png.compression.hint':
    'Deflate effort from 0 to 9. Level 9 costs more time than level 7.',
  'settings.format.png.palette.label': 'Quantise to a palette',
  'settings.format.png.palette.hint': 'Reduces the image to indexed colour. Photographs posterise.',
  'settings.format.png.colours.label': 'Palette colours',
  'settings.format.png.colours.hint':
    'The number of distinct colours kept. Logos and screenshots survive on 64.',
  'settings.format.png.dither.label': 'Dither',
  'settings.format.png.dither.hint': 'Scatters quantisation error so gradients band less.',
  'settings.format.png.adaptive.label': 'Adaptive filtering',
  'settings.format.png.adaptive.hint':
    'Picks a filter per scanline. Helps photos, hurts flat artwork.',

  'settings.format.webp.title': 'WebP encoder',
  'settings.format.webp.nearLossless.label': 'Near lossless',
  'settings.format.webp.nearLossless.hint':
    'Preprocesses the image so lossless coding compresses it much smaller.',
  'settings.format.webp.smartSubsample.label': 'Smart subsampling',
  'settings.format.webp.smartSubsample.hint':
    'The encoder sets colour resolution per image, not per batch.',

  'settings.format.tiff.title': 'TIFF container',
  'settings.format.tiff.compression.label': 'Compression',
  'settings.format.tiff.compression.hint':
    'LZW and Deflate are lossless. JPEG and WebP are lossy and honour quality.',
  'settings.format.tiff.compression.ccitt': 'CCITT Group 4 fax',
  'settings.format.tiff.predictor.label': 'Predictor',
  'settings.format.tiff.predictor.hint':
    'Stores differences between neighbouring pixels, helping LZW and Deflate.',
  'settings.format.tiff.predictor.horizontal': 'Horizontal',
  'settings.format.tiff.predictor.float': 'Floating point',
  'settings.format.tiff.bitdepth.label': 'Bits per channel',
  'settings.format.tiff.bitdepth.hint':
    'Below 8 writes bilevel or low colour, suited to scanned line art.',
  'settings.format.tiff.pyramid.label': 'Pyramidal tiling',
  'settings.format.tiff.pyramid.hint':
    'Writes several resolutions into one file for viewing large images.',

  'settings.format.gif.title': 'GIF palette',
  'settings.format.gif.colours.label': 'Palette colours',
  'settings.format.gif.colours.hint':
    'GIF holds 256 colours at most. Dropping to 64 often saves a third.',
  'settings.format.gif.dither.label': 'Dither',
  'settings.format.gif.dither.hint': 'Higher hides gradient banding but adds noise and file size.',
  'settings.format.gif.loop.label': 'Loop count',
  'settings.format.gif.loop.hint': 'Zero loops forever. Any other number plays that many times.',

  'settings.format.jxl.title': 'JPEG XL',
  'settings.format.jxl.note':
    'The JPEG XL encoder is WebAssembly, so it runs slower than the others. Metadata is not carried into the output.',

  /* ================================================================ */
  /* Resize section                                                    */
  /* ================================================================ */

  'settings.resize.strategy.label': 'Strategy',
  'settings.resize.strategy.none': 'No resizing',
  'settings.resize.strategy.exact': 'Exact width and height',
  'settings.resize.strategy.width': 'Fixed width',
  'settings.resize.strategy.height': 'Fixed height',
  'settings.resize.strategy.longest': 'Longest edge',
  'settings.resize.strategy.shortest': 'Shortest edge',
  'settings.resize.strategy.percentage': 'Percentage of original',
  'settings.resize.strategy.megapixels': 'Total megapixels',

  'settings.resize.target.label': 'Target size',
  'settings.resize.target.hint': 'Both numbers are in pixels.',
  'settings.resize.width.label': 'Width',
  'settings.resize.width.placeholder': 'Width',
  'settings.resize.height.label': 'Height',
  'settings.resize.height.placeholder': 'Height',
  'settings.resize.edge.hint': 'Measured in pixels.',
  'settings.resize.pixels.placeholder': 'Pixels',
  'settings.resize.scale.label': 'Scale',
  'settings.resize.megapixels.label': 'Megapixels',
  'settings.resize.megapixels.hint': 'Twelve megapixels is roughly 4000 by 3000 pixels.',
  'settings.resize.megapixels.suffix': 'MP',

  'settings.resize.locked': 'Pick a strategy above to unlock fit, position and resampling.',

  'settings.resize.fit.label': 'Fit',
  'settings.resize.fit.hint':
    'Cover crops, Contain pads, Inside and Outside keep the aspect ratio.',
  'settings.resize.fit.cover': 'Cover',
  'settings.resize.fit.contain': 'Contain',
  'settings.resize.fit.fill': 'Fill',
  'settings.resize.fit.inside': 'Inside',
  'settings.resize.fit.outside': 'Outside',

  'settings.resize.position.label': 'Position',
  'settings.resize.position.hint':
    'Which part a Cover crop keeps, and where a Contain pad sits the image.',

  'settings.resize.kernel.label': 'Resampling',
  'settings.resize.kernel.hint':
    'Lanczos 3 is sharpest for photos. Nearest neighbour suits pixel art.',
  'settings.resize.kernel.lanczos3': 'Lanczos 3',
  'settings.resize.kernel.lanczos2': 'Lanczos 2',
  'settings.resize.kernel.mitchell': 'Mitchell',
  'settings.resize.kernel.cubic': 'Cubic',
  'settings.resize.kernel.nearest': 'Nearest neighbour',

  'settings.resize.noEnlarge.label': 'Never enlarge',
  'settings.resize.noEnlarge.hint':
    'Leaves an image alone when it is already smaller than the target.',
  'settings.resize.noReduce.label': 'Never reduce',
  'settings.resize.noReduce.hint':
    'Leaves an image alone when it is already larger than the target.',
  'settings.resize.background.label': 'Background',
  'settings.resize.background.hint':
    'Fills the space Contain leaves. Transparency needs an alpha format.',

  'settings.resize.outcome.unchanged': 'Every image keeps its original pixel dimensions.',
  'settings.resize.outcome.missingTarget':
    'No target size is set, so images keep their original dimensions.',
  'settings.resize.outcome.exact.cover':
    'Every image is scaled and cropped to fill exactly {width} by {height} pixels.',
  'settings.resize.outcome.exact.contain':
    'Each image is fitted inside {width} by {height} and the leftover space takes the background colour.',
  'settings.resize.outcome.exact.fill':
    'Each image is stretched to exactly {width} by {height} pixels, ignoring its aspect ratio.',
  'settings.resize.outcome.exact.inside':
    'Each image is scaled to fit inside {width} by {height} pixels, so one side falls short.',
  'settings.resize.outcome.exact.outside':
    'Each image is scaled until it covers {width} by {height} pixels, so one side overshoots.',
  'settings.resize.outcome.width':
    'Each image is scaled to {width} pixels wide, with the height following its aspect ratio.',
  'settings.resize.outcome.height':
    'Each image is scaled to {height} pixels tall, with the width following its aspect ratio.',
  'settings.resize.outcome.longest':
    'Every image is scaled until its longest edge is {value} pixels.',
  'settings.resize.outcome.shortest':
    'Every image is scaled until its shortest edge is {value} pixels.',
  'settings.resize.outcome.percentage':
    'Every image is scaled to {value} percent of its original size.',
  'settings.resize.outcome.percentageBlockedReducing':
    'Each image is scaled to {value} percent, but the guard against reducing blocks it, so nothing changes.',
  'settings.resize.outcome.percentageBlockedEnlarging':
    'Each image is scaled to {value} percent, but the guard against enlarging blocks it, so nothing changes.',
  'settings.resize.outcome.megapixels':
    'Each image is scaled to about {value} megapixels, keeping its aspect ratio.',
  'settings.resize.guards.both':
    'Both guards are on, which cancels the resize and leaves every image as it was.',
  'settings.resize.guards.noEnlarge': 'No image is ever made larger than it started.',
  'settings.resize.guards.noReduce': 'No image is ever made smaller than it started.',
  'settings.resize.guards.free': 'Sources smaller than the target are enlarged to reach it.',

  /* ================================================================ */
  /* Transform section                                                 */
  /* ================================================================ */

  'settings.transform.autoOrient.label': 'Honour EXIF orientation',
  'settings.transform.autoOrient.hint':
    'Applies the camera orientation flag before any rotation you set below.',
  'settings.transform.rotate.label': 'Rotate',
  'settings.transform.rotate.hint': 'Clockwise, applied after the orientation flag.',
  'settings.transform.flipVertical.label': 'Flip vertically',
  'settings.transform.flipVertical.hint': 'Mirrors the image top to bottom.',
  'settings.transform.flipHorizontal.label': 'Flip horizontally',
  'settings.transform.flipHorizontal.hint': 'Mirrors the image left to right.',

  'settings.transform.crop.title': 'Crop',
  'settings.transform.crop.enable.label': 'Crop before resizing',
  'settings.transform.crop.enable.hint': 'Removes part of the source before the resize step.',
  'settings.transform.crop.mode.label': 'Mode',
  'settings.transform.crop.mode.manual': 'Manual',
  'settings.transform.crop.mode.aspect': 'Aspect',
  'settings.transform.crop.mode.trim': 'Trim edges',
  'settings.transform.crop.manual.hint':
    'A fixed rectangle in source pixels from the top left, used on every file.',
  'settings.transform.crop.offset.label': 'Offset',
  'settings.transform.crop.size.label': 'Size',
  'settings.transform.crop.size.hint': 'Zero carries on to the edge of the image.',
  'settings.transform.crop.aspect.hint':
    'Keeps the largest rectangle of this shape and discards the rest.',
  'settings.transform.crop.ratios.label': 'Common ratios',
  'settings.transform.crop.ratio.label': 'Ratio',
  'settings.transform.crop.ratio.hint':
    'Width divided by height. Above 1 is landscape, below 1 is portrait.',
  'settings.transform.crop.trim.hint': 'Detects a border of near uniform colour and cuts it off.',
  'settings.transform.crop.tolerance.label': 'Tolerance',
  'settings.transform.crop.tolerance.hint':
    'How far a pixel may stray from the corner colour and still be border.',

  'settings.transform.border.title': 'Border',
  'settings.transform.padding.label': 'Padding',
  'settings.transform.padding.hint':
    'A border added after the resize. Output grows by twice this number.',
  'settings.transform.paddingColor.label': 'Padding colour',
  'settings.transform.paddingColor.hint':
    'Transparency needs an alpha format. JPEG flattens it onto black.',

  /* ================================================================ */
  /* Adjust section                                                    */
  /* ================================================================ */

  'settings.adjust.colour.title': 'Colour',
  'settings.adjust.grayscale.label': 'Grayscale',
  'settings.adjust.grayscale.hint':
    'Drops the colour channels, which shrinks palette format files sharply.',
  'settings.adjust.invert.label': 'Invert',
  'settings.adjust.invert.hint': 'Produces a negative of every channel except alpha.',
  'settings.adjust.sepia.label': 'Sepia',
  'settings.adjust.sepia.hint': 'Warm monochrome tone, applied after any grayscale conversion.',
  'settings.adjust.tint.label': 'Tint',
  'settings.adjust.tint.hint': 'Pushes the image towards one colour while keeping its luminance.',
  'settings.adjust.tintColor.label': 'Tint colour',
  'settings.adjust.flatten.label': 'Flatten transparency',
  'settings.adjust.flatten.hint':
    'Composites onto a solid colour. Without it JPEG turns transparency black.',
  'settings.adjust.flattenColor.label': 'Background colour',

  'settings.adjust.tone.title': 'Tone',
  'settings.adjust.tone.hint': 'Sliders below sit at neutral. Nothing applies until you move one.',
  'settings.adjust.brightness.label': 'Brightness',
  'settings.adjust.saturation.label': 'Saturation',
  'settings.adjust.contrast.label': 'Contrast',
  'settings.adjust.hue.label': 'Hue rotation',
  'settings.adjust.hue.hint': 'Spins every colour around the wheel. Keep it small on skin tones.',
  'settings.adjust.lightness.label': 'Lightness',
  'settings.adjust.lightness.hint':
    'Adds a flat offset to lightness. Shadows lift without blowing highlights.',

  'settings.adjust.gamma.label': 'Gamma correction',
  'settings.adjust.gamma.hint': 'Rewrites the midtones without touching pure black or pure white.',
  'settings.adjust.gammaValue.label': 'Gamma',
  'settings.adjust.gammaValue.hint':
    '2.2 matches the sRGB curve. Lower opens the shadows, higher deepens them.',

  'settings.adjust.normalize.label': 'Normalize levels',
  'settings.adjust.normalize.hint':
    'Stretches the histogram so the darkest pixel goes black, brightest white.',
  'settings.adjust.normalizeLower.label': 'Lower percentile',
  'settings.adjust.normalizeLower.hint': 'Share of the darkest pixels allowed to clip to black.',
  'settings.adjust.normalizeUpper.label': 'Upper percentile',
  'settings.adjust.normalizeUpper.hint': 'Point above which pixels clip to white.',

  'settings.adjust.clahe.label': 'Local contrast',
  'settings.adjust.clahe.hint':
    'Contrast Limited Adaptive Histogram Equalisation, applied tile by tile.',
  'settings.adjust.claheWidth.label': 'Tile width',
  'settings.adjust.claheWidth.hint':
    'Smaller tiles find finer detail and are more likely to leave seams.',
  'settings.adjust.claheHeight.label': 'Tile height',
  'settings.adjust.claheSlope.label': 'Maximum slope',
  'settings.adjust.claheSlope.hint':
    'Contrast ceiling per tile. Zero removes the limit and amplifies noise.',

  'settings.adjust.detail.title': 'Detail',
  'settings.adjust.sharpen.label': 'Sharpen',
  'settings.adjust.sharpen.hint': 'Worth turning on when images are scaled down.',
  'settings.adjust.sharpenRadius.label': 'Radius',
  'settings.adjust.sharpenRadius.hint':
    'Width of the edge detected. Around 1 suits screens, higher suits print.',
  'settings.adjust.sharpenFlat.label': 'Flat area strength',
  'settings.adjust.sharpenFlat.hint': 'How hard smooth regions are sharpened. Keep it low.',
  'settings.adjust.sharpenEdge.label': 'Edge strength',
  'settings.adjust.sharpenEdge.hint': 'How hard genuine edges are sharpened. Raise this one.',
  'settings.adjust.blur.label': 'Blur',
  'settings.adjust.blur.hint': 'Gaussian blur across the whole image.',
  'settings.adjust.blurRadius.label': 'Radius',
  'settings.adjust.median.label': 'Median filter',
  'settings.adjust.median.hint':
    'Replaces each pixel with the median of its neighbours, removing speckle.',
  'settings.adjust.medianSize.label': 'Window size',
  'settings.adjust.medianSize.hint':
    'Square of neighbours considered. Larger windows clean more, run slower.',
  'settings.adjust.reset': 'Reset adjustments',

  /* ================================================================ */
  /* Watermark section                                                 */
  /* ================================================================ */

  'settings.watermark.kind.label': 'Watermark',
  'settings.watermark.kind.text': 'Text',
  'settings.watermark.kind.textTooltip': 'Draw a line of text over every image',
  'settings.watermark.kind.image': 'Image',
  'settings.watermark.kind.imageTooltip': 'Composite a logo or badge over every image',
  'settings.watermark.none.hint': 'Nothing is stamped onto the output.',

  'settings.watermark.text.label': 'Text',
  'settings.watermark.text.placeholder': 'For example PROOF or your studio name',
  'settings.watermark.fontSize.label': 'Font size',
  'settings.watermark.fontSize.hint': 'Pixels, measured against the output resolution.',
  'settings.watermark.font.label': 'Font',
  'settings.watermark.colour.label': 'Colour',
  'settings.watermark.colour.hint': 'Transparency comes from the opacity slider, not here.',

  'settings.watermark.image.label': 'Watermark image',
  'settings.watermark.image.hint':
    'A PNG with a transparent background composites cleanly at any opacity.',
  'settings.watermark.image.choose': 'Choose image',
  'settings.watermark.image.change': 'Choose a different image',
  'settings.watermark.image.remove': 'Remove the watermark image',

  'settings.watermark.position.label': 'Position',
  'settings.watermark.position.hint': 'Where the stamp sits when tiling is off.',
  'settings.watermark.opacity.label': 'Opacity',
  'settings.watermark.scale.label': 'Size',
  'settings.watermark.scale.hint': 'Watermark width as a percentage of the output width.',
  'settings.watermark.margins.label': 'Margins',
  'settings.watermark.margins.hint': 'Distance from the chosen edge, in pixels.',
  'settings.watermark.margins.horizontal': 'Horizontal margin in pixels',
  'settings.watermark.margins.vertical': 'Vertical margin in pixels',
  'settings.watermark.rotation.label': 'Rotation',
  'settings.watermark.rotation.hint': 'Negative values turn anticlockwise.',
  'settings.watermark.tile.label': 'Tile across the image',
  'settings.watermark.tile.hint': 'Repeats the watermark edge to edge instead of placing it once.',

  /* ================================================================ */
  /* Metadata section                                                  */
  /* ================================================================ */

  'settings.metadata.policy.label': 'What to keep',
  'settings.metadata.policy.strip': 'Strip',
  'settings.metadata.policy.stripTooltip': 'Remove every tag',
  'settings.metadata.policy.stripHint':
    'Removes every tag, including the GPS coordinates that record where a photo was taken.',
  'settings.metadata.policy.keep': 'Keep all',
  'settings.metadata.policy.keepTooltip': 'Preserve everything, GPS location included',
  'settings.metadata.policy.keepHint':
    'Copies every tag through: camera, timestamps, editing history and GPS location. Only safe for files that stay with you.',
  'settings.metadata.policy.icc': 'ICC only',
  'settings.metadata.policy.iccTooltip': 'Preserve the colour profile and nothing else',
  'settings.metadata.policy.iccHint':
    'Keeps the colour profile and drops the rest. No location or camera data survives.',
  'settings.metadata.policy.rights': 'Rights',
  'settings.metadata.policy.rightsTooltip': 'Preserve the colour profile, copyright and artist',
  'settings.metadata.policy.rightsHint':
    'Keeps the colour profile plus the copyright and artist fields. GPS location is still removed.',

  'settings.metadata.density.label': 'Override the resolution',
  'settings.metadata.density.hint':
    'Rewrites the DPI in the file. Print shops read it, browsers ignore it.',
  'settings.metadata.density.blocked':
    'Available only with Keep all, or when writing TIFF. Elsewhere writing it would restore the tags this policy removes.',
  'settings.metadata.resolution.label': 'Resolution',
  'settings.metadata.resolution.aria': 'Output resolution in dots per inch',

  'settings.metadata.icc.label': 'ICC profile',
  'settings.metadata.icc.hint': 'A profile name such as srgb or p3, or a path to an .icc file.',
  'settings.metadata.icc.placeholder': 'srgb',
  'settings.metadata.copyright.label': 'Copyright',
  'settings.metadata.copyright.placeholder': 'Copyright 2026 Your Studio',
  'settings.metadata.artist.label': 'Artist',
  'settings.metadata.artist.placeholder': 'Your name',
  'settings.metadata.strippedNote':
    'Copyright and artist are disabled because the current policy removes every tag. Switch to Rights to write them.',

  /* ================================================================ */
  /* Output section                                                    */
  /* ================================================================ */

  'settings.output.target.label': 'Write to',
  'settings.output.target.folder': 'Folder',
  'settings.output.target.folderTooltip': 'Write into a folder you choose',
  'settings.output.target.zip': 'ZIP archive',
  'settings.output.target.zipTooltip': 'Collect every output into one archive',
  'settings.output.target.inPlace': 'In place',
  'settings.output.target.inPlaceTooltip': 'Write beside each original file',
  'settings.output.inPlace.title': 'Originals are replaced',
  'settings.output.inPlace.body':
    'Each source file is overwritten with its converted version. Nothing reaches the recycle bin, so back up first.',

  'settings.output.folder.label': 'Destination folder',
  'settings.output.folder.choose': 'Choose folder',
  'settings.output.folder.change': 'Choose a different folder',
  'settings.output.folder.empty': 'No folder chosen yet.',
  'settings.output.archive.label': 'Archive file',
  'settings.output.archive.choose': 'Choose archive',
  'settings.output.archive.change': 'Choose a different archive',
  'settings.output.archive.empty': 'No archive path chosen yet.',

  'settings.output.structure.label': 'Folder structure',
  'settings.output.structure.flat': 'Flat',
  'settings.output.structure.flatDescription':
    'Everything lands in the destination, whatever folder it came from.',
  'settings.output.structure.flatHint':
    'Every file lands directly in the destination folder. Duplicate names follow the collision rule below.',
  'settings.output.structure.mirror': 'Mirror the source tree',
  'settings.output.structure.mirrorDescription': 'Recreates the folder layout of the sources.',
  'settings.output.structure.mirrorHint':
    'The source folder tree is recreated inside the destination, so relative paths keep working.',
  'settings.output.structure.byFormat': 'Folder per format',
  'settings.output.structure.byFormatDescription':
    'Groups the output into one subfolder per format.',
  'settings.output.structure.byFormatHint':
    'Output is grouped into a subfolder named after its format.',
  'settings.output.structure.byDate': 'Folder per date',
  'settings.output.structure.byDateDescription':
    'Groups the output into one subfolder per run date.',
  'settings.output.structure.byDateHint':
    'Output is grouped into a subfolder named after the date of the run.',

  'settings.output.collision.label': 'If a file is already there',
  'settings.output.collision.rename': 'Rename',
  'settings.output.collision.renameHint':
    'A counter is added to the name, so the existing file is never touched.',
  'settings.output.collision.overwrite': 'Overwrite',
  'settings.output.collision.overwriteHint':
    'Whatever is already at that path is replaced. There is no undo and nothing reaches the recycle bin.',
  'settings.output.collision.skip': 'Skip',
  'settings.output.collision.skipHint':
    'The existing file is left alone and the image is reported as skipped in the summary.',

  'settings.output.template.label': 'Filename template',
  'settings.output.template.help':
    'An unknown token is left in the name rather than deleted, so a typo shows up in the preview.',
  'settings.output.template.placeholder': '{name}',
  'settings.output.template.example': 'Example',
  'settings.output.template.firstFile': 'First file',

  'settings.output.token.name': 'Original filename without its extension',
  'settings.output.token.ext': 'Output file extension',
  'settings.output.token.format': 'Output format id, for example webp',
  'settings.output.token.index': 'Position in the queue, zero padded',
  'settings.output.token.total': 'Total number of files in the run',
  'settings.output.token.width': 'Output width in pixels',
  'settings.output.token.height': 'Output height in pixels',
  'settings.output.token.quality': 'Quality value used for this file',
  'settings.output.token.preset': 'Name of the active preset',
  'settings.output.token.variant': 'Suffix of the current size variant',
  'settings.output.token.parent': 'Name of the folder the source came from',
  'settings.output.token.date': 'Run date as YYYYMMDD',
  'settings.output.token.time': 'Run time as HHMMSS',
  'settings.output.token.random': 'Six random characters',

  'settings.output.case.label': 'Letter case',
  'settings.output.case.none': 'Leave as written',
  'settings.output.case.lower': 'lower case',
  'settings.output.case.upper': 'UPPER CASE',
  'settings.output.case.kebab': 'kebab-case',
  'settings.output.case.snake': 'snake_case',

  'settings.output.sanitize.label': 'Clean up filenames',
  'settings.output.sanitize.hint':
    'Replaces what Windows and macOS reject, plus trailing dots and spaces.',
  'settings.output.skipIfLarger.label': 'Keep the original when it is smaller',
  'settings.output.skipIfLarger.hint':
    'Keeps the source file when the converted one would be larger.',

  'settings.output.zipLevel.label': 'Archive compression',
  'settings.output.zipLevel.hint':
    'Encoded images barely recompress, so 0 stores them as they are.',
  'settings.output.zipLevel.store': 'Store',
  'settings.output.zipLevel.max': 'Max',

  'settings.output.report.label': 'Write a CSV report',
  'settings.output.report.hint':
    'Saves a spreadsheet with one row per image: paths, sizes, saving, errors.',
  'settings.output.noFolderNote': 'A run cannot start until a destination folder is set.',

  /* ================================================================ */
  /* Variants section                                                  */
  /* ================================================================ */

  'settings.variants.intro':
    'Variants write extra sizes from one decode: add 480, 960 and 1440 for a responsive srcset. Inherit follows the main settings.',
  'settings.variants.empty':
    'No variants yet. The run writes one file per source using the settings above.',
  'settings.variants.add': 'Add variant',
  'settings.variants.remove': 'Remove this variant',
  'settings.variants.removeNamed': 'Remove {label}',
  'settings.variants.defaultLabel': 'Variant {index}',
  'settings.variants.enable.label': 'Include in the run',
  'settings.variants.name.label': 'Name',
  'settings.variants.name.hint': 'Shown in the queue and in the run report.',
  'settings.variants.name.placeholder': 'Thumbnail',
  'settings.variants.formatQuality.label': 'Format and quality',
  'settings.variants.format.inherit': 'Inherit',
  'settings.variants.format.source': 'Same as source',
  'settings.variants.format.aria': 'Variant output format',
  'settings.variants.quality.aria': 'Variant quality',
  'settings.variants.size.label': 'Size',
  'settings.variants.strategy.none': 'Same size as the main output',
  'settings.variants.strategy.width': 'Fixed width',
  'settings.variants.strategy.height': 'Fixed height',
  'settings.variants.strategy.longest': 'Longest edge',
  'settings.variants.strategy.percentage': 'Percentage of the source',
  'settings.variants.strategy.aria': 'Variant resize strategy',
  'settings.variants.value.aria': 'Variant target size',
  'settings.variants.suffix.label': 'Filename suffix',
  'settings.variants.suffix.hint': 'Added to the name before the extension.',
  'settings.variants.suffix.placeholder': '-960w',
  'settings.variants.problem.empty':
    'An empty suffix matches the main output filename, so one overwrites the other.',
  'settings.variants.problem.duplicate':
    'Another variant uses this suffix. Both write the same filename and the last one wins.',

  /* ================================================================ */
  /* Smart section                                                     */
  /* ================================================================ */

  'settings.smart.sizeTarget.label': 'Size target',
  'settings.smart.sizeTarget.off': 'Off',
  'settings.smart.sizeTarget.offTooltip': 'Encode once at the chosen quality',
  'settings.smart.sizeTarget.offHint':
    'Each image is encoded once at your chosen quality, whatever size results.',
  'settings.smart.sizeTarget.max': 'Stay under',
  'settings.smart.sizeTarget.maxTooltip': 'Treat the budget as a hard ceiling',
  'settings.smart.sizeTarget.maxHint':
    'Output never exceeds the budget; quality drops as far as the range floor.',
  'settings.smart.sizeTarget.aim': 'Aim for',
  'settings.smart.sizeTarget.aimTooltip': 'Land as close to the budget as possible',
  'settings.smart.sizeTarget.aimHint':
    'Output lands as close to the budget as it can from either side.',

  'settings.smart.budget.label': 'Budget per image',
  'settings.smart.budget.hint': '{size} for every file in the run.',
  'settings.smart.budget.aria': 'Size budget per image in kilobytes',
  'settings.smart.quality.label': 'Quality range',
  'settings.smart.quality.hint': 'The search only tries qualities inside this window.',
  'settings.smart.searchNote':
    'Each image is encoded several times, halving the quality window each round, until the result fits the budget.',
  'settings.smart.slow.title': 'This makes a run several times slower',
  'settings.smart.slow.body':
    'Expect four to seven encodes per image instead of one. A large AVIF batch can take close to an hour.',
  'settings.smart.autoFormat.label': 'Choose the format per image',
  'settings.smart.autoFormat.hint':
    'Writes flat artwork and screenshots as PNG, photographs as your format.',
  'settings.smart.autoPalette.label': 'Drop to a palette when it is free',
  'settings.smart.autoPalette.hint':
    'Switches to indexed colour when the image has few enough colours.',

  /* ================================================================ */
  /* Performance section                                               */
  /* ================================================================ */

  'settings.performance.backend.label': 'Processing backend',
  'settings.performance.backend.auto': 'Auto',
  'settings.performance.backend.autoTooltip': 'Use every lane the machine offers',
  'settings.performance.backend.autoHint':
    'Each image takes whichever lane is free, GPU or sharp worker pool.',
  'settings.performance.backend.gpuTooltip': 'Prefer GPU lanes wherever they apply',
  'settings.performance.backend.gpuHint':
    'Prefers GPU lanes, falling back to sharp when the adapter cannot cope.',
  'settings.performance.backend.gpuMissing': 'No usable GPU adapter was found',
  'settings.performance.backend.cpuTooltip': 'Run everything through the sharp workers',
  'settings.performance.backend.cpuHint':
    'Ignores the GPU and runs the batch through the sharp worker pool.',

  'settings.performance.probePending': 'Adapter details appear once the GPU probe has finished.',
  'settings.performance.gpuUnavailable.title': 'GPU acceleration is unavailable',
  'settings.performance.gpuUnavailable.body':
    'No adapter answered the capability probe, so every image runs on the CPU.',

  'settings.performance.adapters.label': 'Adapters',
  'settings.performance.adapter.unnamed': 'Unnamed adapter',
  'settings.performance.adapter.active': 'Active',
  'settings.performance.adapter.discrete': 'Discrete',
  'settings.performance.adapter.integrated': 'Integrated',
  'settings.performance.adapter.software': 'Software',
  'settings.performance.adapter.maxTexture': 'Max texture {value} px',

  'settings.performance.preferDiscrete.label': 'Prefer the discrete adapter',
  'settings.performance.preferDiscrete.hint':
    'Sends work to the dedicated card rather than the integrated one.',
  'settings.performance.useAllGpus.label': 'Use every adapter at once',
  'settings.performance.useAllGpus.hint':
    'Opens a lane per adapter instead of only the preferred one.',
  'settings.performance.gpuAssist.label': 'GPU assisted encoding',
  'settings.performance.gpuAssist.hint':
    'The GPU resizes and filters; sharp writes AVIF, TIFF and JPEG XL.',

  'settings.performance.workers.label': 'Worker threads',
  'settings.performance.workers.hint':
    'Images encoded at once. 0 lets BICO choose from {cores} logical cores.',
  'settings.performance.workers.hintUnknown':
    'Images encoded at once. 0 lets BICO choose from the core count.',
  'settings.performance.workers.auto': 'Auto',
  'settings.performance.vips.label': 'Threads inside each worker',
  'settings.performance.vips.hint': 'Threads libvips uses on one image. 0 lets libvips decide.',
  'settings.performance.cache.label': 'Operation cache',
  'settings.performance.cache.hint': 'Memory libvips may hold for intermediate results.',
  'settings.performance.maxPixels.label': 'Pixel limit',
  'settings.performance.maxPixels.hint':
    'Images that decode to more pixels than this are refused, not loaded.',
  'settings.performance.maxPixels.aria': 'Maximum decoded size in megapixels',
  'settings.performance.megapixels': 'MP'
} as const
