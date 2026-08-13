/**
 * Colour maths for the theme engine.
 *
 * Split out from the token assembly because it is a different kind of code:
 * pure functions over colour spaces, with no knowledge of Ant Design or of what
 * the app looks like, and worth reading on its own terms.
 */

const HEX_COLOUR = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export const BLACK = '#000000'
export const WHITE = '#ffffff'

/** Channels in the range 0 to 255. */
export type Channels = [number, number, number]

/**
 * Splits a hex colour into channels, or null when the string is not one.
 *
 * Null rather than a guess: the accent is whatever the user picked in the
 * colour picker, and inventing a brightness for a value that cannot be parsed
 * would pick a foreground with false confidence.
 */
export function parseHex(value: string): Channels | null {
  const digits = HEX_COLOUR.exec(value.trim())?.[1]
  if (digits === undefined) return null

  const full = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16)
  ]
}

export function toHex(channels: Channels): string {
  const clamp = (value: number): number => Math.min(255, Math.max(0, Math.round(value)))
  return `#${channels.map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`
}

/* ================================================================== */
/* WCAG 2 luminance                                                    */
/* ================================================================== */

/** Undoes the sRGB transfer function, because the luminance sum needs linear light. */
function expandChannel(value: number): number {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4)
}

/**
 * The WCAG relative luminance of a hex colour, or null when the string is not one.
 *
 * Kept for the icon tone ramps, which are judged against a published compliance
 * threshold rather than chosen between two extremes, and so want the measure
 * the threshold was written for.
 */
export function relativeLuminance(hex: string): number | null {
  const channels = parseHex(hex)
  if (channels === null) return null

  return (
    0.2126 * expandChannel(channels[0]) +
    0.7152 * expandChannel(channels[1]) +
    0.0722 * expandChannel(channels[2])
  )
}

/* ================================================================== */
/* APCA perceptual contrast                                            */
/* ================================================================== */

/*
 * Why the WCAG ratio is the wrong tool for choosing text on a solid colour.
 *
 * WCAG 2 luminance weights green at 0.7152 and blue at 0.0722, so a saturated
 * blue scores as a light colour. The default accent, a mid blue, measures 6.56
 * to 1 against black and only 3.20 to 1 against white, so the ratio test puts
 * black on it. It looks obviously dark to the eye, every mainstream design
 * system puts white on a blue button, and this app shipped black.
 *
 * APCA, the perceptual model drafted for WCAG 3, gets it right: the same accent
 * scores 64.2 with white against 45.2 with black. It is still a draft, so it is
 * used here only to choose between two candidates, and never reported anywhere
 * as a compliance figure.
 */
const APCA_TRC = 2.4
const APCA_BLACK_THRESHOLD = 0.022
const APCA_BLACK_CLAMP = 1.414
const APCA_SCALE = 1.14
const APCA_NORMAL_BACKGROUND = 0.56
const APCA_NORMAL_TEXT = 0.57
const APCA_REVERSE_BACKGROUND = 0.65
const APCA_REVERSE_TEXT = 0.62
const APCA_LOW_CLIP = 0.1
const APCA_LOW_OFFSET = 0.027
const APCA_MIN_DELTA = 0.0005

/** APCA screen luminance, which uses a plain exponent rather than the sRGB piecewise curve. */
function screenLuminance(channels: Channels): number {
  const red = Math.pow(channels[0] / 255, APCA_TRC)
  const green = Math.pow(channels[1] / 255, APCA_TRC)
  const blue = Math.pow(channels[2] / 255, APCA_TRC)

  return 0.2126729 * red + 0.7151522 * green + 0.072175 * blue
}

/** Lifts very dark colours, where the eye stops resolving differences the maths still sees. */
function softClamp(luminance: number): number {
  return luminance > APCA_BLACK_THRESHOLD
    ? luminance
    : luminance + Math.pow(APCA_BLACK_THRESHOLD - luminance, APCA_BLACK_CLAMP)
}

/**
 * APCA lightness contrast, as a magnitude.
 *
 * The sign carries the polarity, light text on dark or the reverse, which is
 * already known from the two colours being compared, so it is dropped to keep
 * the comparisons at the call sites straightforward.
 */
export function perceptualContrast(text: string, background: string): number | null {
  const textChannels = parseHex(text)
  const backgroundChannels = parseHex(background)
  if (textChannels === null || backgroundChannels === null) return null

  const textLuminance = softClamp(screenLuminance(textChannels))
  const backgroundLuminance = softClamp(screenLuminance(backgroundChannels))
  if (Math.abs(backgroundLuminance - textLuminance) < APCA_MIN_DELTA) return 0

  if (backgroundLuminance > textLuminance) {
    const contrast =
      (Math.pow(backgroundLuminance, APCA_NORMAL_BACKGROUND) -
        Math.pow(textLuminance, APCA_NORMAL_TEXT)) *
      APCA_SCALE
    return contrast < APCA_LOW_CLIP ? 0 : (contrast - APCA_LOW_OFFSET) * 100
  }

  const contrast =
    (Math.pow(backgroundLuminance, APCA_REVERSE_BACKGROUND) -
      Math.pow(textLuminance, APCA_REVERSE_TEXT)) *
    APCA_SCALE
  return contrast > -APCA_LOW_CLIP ? 0 : Math.abs(contrast + APCA_LOW_OFFSET) * 100
}

/**
 * Picks black or white for text painted straight onto a solid colour.
 *
 * White is the fallback for a value that cannot be parsed, since that is what
 * the interface did before and it is safe on the dark themes the app opens in.
 */
export function readableOn(background: string): string {
  const withBlack = perceptualContrast(BLACK, background)
  const withWhite = perceptualContrast(WHITE, background)
  if (withBlack === null || withWhite === null) return WHITE

  return withBlack > withWhite ? BLACK : WHITE
}

/* ================================================================== */
/* Oklab                                                               */
/* ================================================================== */

/*
 * Hover and pressed shades are made by moving lightness in Oklab rather than by
 * mixing towards black or white in sRGB.
 *
 * Mixing towards white is the obvious approach and it desaturates: the mint and
 * yellow accents turned pale and chalky on hover, reading as disabled rather
 * than as a button about to be pressed. Oklab separates lightness from chroma,
 * so the same shift keeps the hue and the vividness and only changes how light
 * the colour is.
 */
type Oklab = { L: number; a: number; b: number }

function toLinear(value: number): number {
  const scaled = value / 255
  return scaled <= 0.04045 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4)
}

function fromLinear(value: number): number {
  const encoded =
    value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(Math.max(value, 0), 1 / 2.4) - 0.055
  return encoded * 255
}

function toOklab(channels: Channels): Oklab {
  const red = toLinear(channels[0])
  const green = toLinear(channels[1])
  const blue = toLinear(channels[2])

  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)

  return {
    L: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short
  }
}

function fromOklab(colour: Oklab): { channels: Channels; inGamut: boolean } {
  const long = Math.pow(colour.L + 0.3963377774 * colour.a + 0.2158037573 * colour.b, 3)
  const medium = Math.pow(colour.L - 0.1055613458 * colour.a - 0.0638541728 * colour.b, 3)
  const short = Math.pow(colour.L - 0.0894841775 * colour.a - 1.291485548 * colour.b, 3)

  const red = 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short
  const green = -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short
  const blue = -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short

  const tolerance = 0.001
  const inGamut = [red, green, blue].every((value) => value >= -tolerance && value <= 1 + tolerance)

  return { channels: [fromLinear(red), fromLinear(green), fromLinear(blue)], inGamut }
}

/**
 * Converts back to sRGB, reducing chroma until the colour fits.
 *
 * Raising the lightness of an already saturated colour walks it out of the sRGB
 * gamut, and letting the channels clip there shifts the hue. Pulling chroma in
 * until it fits keeps the hue and gives up only the saturation that could not
 * have been displayed anyway.
 */
function toDisplayable(colour: Oklab): Channels {
  const direct = fromOklab(colour)
  if (direct.inGamut) return direct.channels

  let low = 0
  let high = 1
  for (let step = 0; step < 16; step += 1) {
    const middle = (low + high) / 2
    const attempt = fromOklab({ L: colour.L, a: colour.a * middle, b: colour.b * middle })
    if (attempt.inGamut) low = middle
    else high = middle
  }

  return fromOklab({ L: colour.L, a: colour.a * low, b: colour.b * low }).channels
}

/**
 * How far the hover and pressed shades move in Oklab lightness.
 *
 * Measured rather than picked by eye: at these values every accent in the
 * registry clears an Oklab colour difference of 0.03 between one state and the
 * next, which is comfortably above the point where a change stops being
 * noticeable, while staying well short of looking like a different colour.
 */
const HOVER_SHIFT = 0.06
const ACTIVE_SHIFT = 0.12

/** Oklab is near enough uniform that plain euclidean distance is a usable difference measure. */
export function colourDifference(first: string, second: string): number | null {
  const a = parseHex(first)
  const b = parseHex(second)
  if (a === null || b === null) return null

  const one = toOklab(a)
  const two = toOklab(b)
  return Math.sqrt(
    Math.pow(one.L - two.L, 2) + Math.pow(one.a - two.a, 2) + Math.pow(one.b - two.b, 2)
  )
}

/**
 * The hover and pressed shades for a surface painted in a solid colour.
 *
 * antd derives these by lightening for hover and darkening for pressed, then
 * paints all three states with one text colour: in
 * node_modules/antd/es/button/style/variant.js the hover and active text
 * colours are both references to the resting one. That holds until a derived
 * shade crosses the point where the other foreground would be better, which is
 * what happened to the pressed shade of Nord, Dracula and Forest. Each landed
 * on a mid tone still wearing the black text chosen for the much lighter
 * resting colour.
 *
 * Moving both shades away from the text colour, rather than in opposite
 * directions, keeps one foreground correct for all three states. Contrast then
 * rises at the moment of interaction rather than falling, which is the better
 * of the two behaviours to be stuck with.
 *
 * Near the top of the lightness scale that direction stops working. There is no
 * room left to move, and the gamut clip pays for the attempt in chroma: the
 * mint accent pressed to a near white and the yellow one hovered to cream, both
 * of which read as disabled. So the direction is chosen rather than assumed,
 * and a shift that would wash the colour out is taken the other way instead.
 */
const CHROMA_FLOOR = 0.65
const NEAR_GREY = 0.02

function chroma(colour: Oklab): number {
  return Math.sqrt(colour.a * colour.a + colour.b * colour.b)
}

/**
 * Moves the lightness and reports what the gamut charged for it.
 *
 * A colour that is already near grey has no chroma to lose, so retention is
 * reported as intact rather than as a ratio of nearly nothing.
 */
function shift(base: Oklab, distance: number): { hex: string; keptChroma: boolean } {
  const target = { ...base, L: Math.min(1, Math.max(0, base.L + distance)) }
  const channels = toDisplayable(target)
  const before = chroma(base)
  const after = chroma(toOklab(channels))

  return {
    hex: toHex(channels),
    keptChroma: before < NEAR_GREY || after >= before * CHROMA_FLOOR
  }
}

/** Below this an Oklab difference stops being something the eye reports as a change. */
const NOTICEABLE = 0.03

function distance(one: Oklab, two: Oklab): number {
  return Math.sqrt(
    Math.pow(one.L - two.L, 2) + Math.pow(one.a - two.a, 2) + Math.pow(one.b - two.b, 2)
  )
}

interface Candidate {
  hex: string
  lab: Oklab
  /** Whether the gamut clip left the colour as vivid as it started. */
  vivid: boolean
}

/**
 * The furthest shade in one direction that keeps the foreground.
 *
 * Backing off in steps matters because the full shift can cross the point where
 * the other foreground would win, and a slightly smaller step usually does not.
 * The loop always terminates on something usable: the smallest step is barely
 * distinguishable from the colour it started at, whose foreground is the one
 * being preserved.
 */
function reachFor(base: Oklab, amount: number, foreground: string): Candidate {
  for (let scale = 1; scale > 0; scale -= 0.125) {
    const candidate = shift(base, amount * scale)
    if (readableOn(candidate.hex) !== foreground) continue

    return {
      hex: candidate.hex,
      lab: toOklab(parseHex(candidate.hex) as Channels),
      vivid: candidate.keptChroma
    }
  }

  return { hex: toHex(toDisplayable(base)), lab: base, vivid: true }
}

interface Plan {
  hover: string
  active: string
  /** Whether all three states can be told apart from each other. */
  separated: boolean
  vivid: boolean
  /** How far the three states span, for choosing between two plans that both fall short. */
  spread: number
}

/**
 * Both shades in one direction, judged as a set.
 *
 * Judging them one at a time was not enough. A near white accent has both
 * shades clamped to white, and an accent sitting near the point where the
 * foreground changes has both shades backed off to nearly the same place; in
 * each case every shade differs from the resting colour while being identical
 * to the other one, so the pressed state is invisible.
 */
function planFor(base: Oklab, direction: number, foreground: string): Plan {
  const hover = reachFor(base, direction * HOVER_SHIFT, foreground)
  const active = reachFor(base, direction * ACTIVE_SHIFT, foreground)

  const fromBase = distance(base, hover.lab)
  const between = distance(hover.lab, active.lab)

  return {
    hover: hover.hex,
    active: active.hex,
    separated: fromBase >= NOTICEABLE && between >= NOTICEABLE,
    vivid: hover.vivid && active.vivid,
    spread: fromBase + between
  }
}

export function interactionShades(
  colour: string,
  foreground: string
): { hover: string; active: string } {
  const channels = parseHex(colour)
  if (channels === null) return { hover: colour, active: colour }

  const base = toOklab(channels)
  const away = foreground === WHITE ? -1 : 1

  /*
   * One direction is chosen for both shades. Deciding it per shade let an
   * accent hover lighter and press darker, which reads as two unrelated
   * effects rather than one gesture getting firmer.
   *
   * Away from the text colour is the first choice, because contrast then rises
   * as the button is used rather than falling. It is given up in a set order:
   * being able to see the state change outranks keeping the colour vivid, and
   * both outrank the preferred direction. The lavender accent is the case that
   * settles the last of those, having no room to darken without demanding white
   * text, so it lightens and accepts the chroma the gamut takes for it.
   */
  const forward = planFor(base, away, foreground)
  const backward = planFor(base, -away, foreground)

  const ranked = [
    forward.separated && forward.vivid,
    backward.separated && backward.vivid,
    forward.separated,
    backward.separated
  ]

  const winner = ranked[0]
    ? forward
    : ranked[1]
      ? backward
      : ranked[2]
        ? forward
        : ranked[3]
          ? backward
          : forward.spread >= backward.spread
            ? forward
            : backward

  return { hover: winner.hover, active: winner.active }
}
