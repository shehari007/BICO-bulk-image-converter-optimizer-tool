/**
 * Every WGSL source BICO runs on a GPU lane.
 *
 * All of these are compute shaders. They read through `texture_2d<f32>` with
 * `textureLoad` rather than a sampler, because a resample kernel needs exact
 * texel taps and a colour operation needs the untouched value: hardware
 * filtering would quietly interpolate behind our back.
 *
 * Colour management, which is the part that goes wrong most often:
 *
 *   A PNG or JPEG holds sRGB encoded values. The encoding is a rough perceptual
 *   curve, so averaging two encoded values, which is what any resize or blur
 *   does, is not the same as averaging the light they represent. Doing the maths
 *   on encoded values makes downscaled images visibly darker than the CPU path
 *   produces, and it is the single most common WebGPU imaging bug.
 *
 *   So: the first pass decodes sRGB to linear light, every intermediate texture
 *   is rgba16float in linear light with premultiplied alpha, and the final pass
 *   unpremultiplies and re encodes to sRGB. `SHADER_FLAG` drives which pass does
 *   which conversion, so a single pass run still decodes and encodes correctly.
 *
 * Alpha is premultiplied for the duration of the pipeline because every filter
 * here is a weighted sum, and weighted sums of straight alpha colours bleed the
 * colour of fully transparent texels into their visible neighbours.
 */

/** Threads per workgroup edge. 8 by 8 is 64 lanes, a good fit for both vendors. */
export const WORKGROUP_EDGE = 8

/**
 * Bit flags shared by every shader, kept in the `flags` field of each uniform.
 * The pipeline sets `decodeSrgb` only on the first pass and `encodeSrgb` only on
 * the last, so intermediate textures stay in linear light.
 */
export const SHADER_FLAG = {
  decodeSrgb: 1,
  encodeSrgb: 2,
  /** Input carries straight alpha and must be premultiplied after decoding. */
  premultiplyIn: 4,
  /** Output must carry straight alpha, which is what an encoder expects. */
  unpremultiplyOut: 8,
  flipHorizontal: 16,
  flipVertical: 32
} as const

/** Kernel codes accepted by `RESAMPLE_WGSL`, mirrored by `ResizeKernel`. */
export const KERNEL_CODE = {
  nearest: 0,
  bilinear: 1,
  /** Catmull Rom, the cubic libvips means by `cubic`. */
  cubic: 2,
  mitchell: 3,
  lanczos2: 4,
  lanczos3: 5
} as const

/**
 * Largest number of source texels one resample pass will gather per axis.
 *
 * Support widens with the reduction factor, so an unbounded downscale would ask
 * for an unbounded loop. The pipeline caps the reduction per stage and chains
 * stages instead, which keeps this ceiling comfortable even for a 60x downscale.
 */
export const MAX_RESAMPLE_TAPS = 64

/** Bins in the normalize histogram. 256 keeps the readback at one kilobyte. */
export const HISTOGRAM_BINS = 256

/** Enable bits for `COLOR_OPS_WGSL`, one per stage. */
export const COLOR_STAGE = {
  flatten: 1,
  /** Brightness, lightness, saturation and hue, all applied in OKLab. */
  modulate: 2,
  tint: 4,
  sepia: 8,
  grayscale: 16,
  contrast: 32,
  gamma: 64,
  invert: 128
} as const

/* ================================================================== */
/* Shared prelude                                                      */
/* ================================================================== */

/**
 * Helpers concatenated into every shader below.
 *
 * WGSL has no include mechanism, so the prelude is a plain string prefix. It is
 * written once here so the sRGB curve and the OKLab matrices cannot drift apart
 * between passes.
 */
const PRELUDE = /* wgsl */ `
const FLAG_DECODE_SRGB: u32 = 1u;
const FLAG_ENCODE_SRGB: u32 = 2u;
const FLAG_PREMULTIPLY_IN: u32 = 4u;
const FLAG_UNPREMULTIPLY_OUT: u32 = 8u;
const FLAG_FLIP_H: u32 = 16u;
const FLAG_FLIP_V: u32 = 32u;

const PI: f32 = 3.141592653589793;

fn hasFlag(flags: u32, bit: u32) -> bool {
  return (flags & bit) != 0u;
}

// IEC 61966 2 1 transfer function. The linear toe below 0.04045 exists so the
// curve has a finite slope at zero; skipping it crushes near black detail.
fn srgbToLinear(c: vec3f) -> vec3f {
  let s = max(c, vec3f(0.0));
  let lo = s / 12.92;
  let hi = pow((s + vec3f(0.055)) / 1.055, vec3f(2.4));
  return select(hi, lo, s <= vec3f(0.04045));
}

fn linearToSrgb(c: vec3f) -> vec3f {
  let s = max(c, vec3f(0.0));
  let lo = s * 12.92;
  let hi = 1.055 * pow(s, vec3f(1.0 / 2.4)) - 0.055;
  return select(hi, lo, s <= vec3f(0.0031308));
}

// Reads a texel and normalises it into the pipeline representation: linear
// light, premultiplied alpha. Intermediate textures are already in that form,
// so both conversions are flag gated.
fn loadTexel(tex: texture_2d<f32>, at: vec2i, flags: u32) -> vec4f {
  var texel = textureLoad(tex, at, 0);
  if (hasFlag(flags, FLAG_DECODE_SRGB)) {
    texel = vec4f(srgbToLinear(texel.rgb), texel.a);
  }
  if (hasFlag(flags, FLAG_PREMULTIPLY_IN)) {
    texel = vec4f(texel.rgb * texel.a, texel.a);
  }
  return texel;
}

// The mirror of loadTexel. Unpremultiplying before the sRGB encode matters:
// encoding a premultiplied colour and dividing afterwards is not the same
// operation, because the transfer function is not linear.
fn storeTexel(value: vec4f, flags: u32) -> vec4f {
  var result = value;
  if (hasFlag(flags, FLAG_UNPREMULTIPLY_OUT)) {
    let a = max(result.a, 1.0e-6);
    result = vec4f(select(result.rgb / a, vec3f(0.0), result.a <= 0.0), result.a);
  }
  if (hasFlag(flags, FLAG_ENCODE_SRGB)) {
    result = vec4f(linearToSrgb(result.rgb), result.a);
  }
  return clamp(result, vec4f(0.0), vec4f(1.0));
}

// Rec. 709 luminance weights, valid only on linear light values. Applying these
// to sRGB encoded numbers is the other half of the classic gamma mistake.
fn luminance(linearRgb: vec3f) -> f32 {
  return dot(linearRgb, vec3f(0.2126, 0.7152, 0.0722));
}

fn cbrtSigned(v: f32) -> f32 {
  return sign(v) * pow(abs(v), 1.0 / 3.0);
}

// OKLab, Bjorn Ottosson 2020. Linear sRGB goes to a cone response space (LMS),
// through a cube root, then to a Lab style opponent space. Chroma and hue live
// in the a and b plane, so scaling or rotating them is a perceptually even
// change; scaling RGB channels directly is not, it drags lightness with it.
//
// Linear sRGB to LMS:
//   l = 0.4122214708 r + 0.5363325363 g + 0.0514459929 b
//   m = 0.2119034982 r + 0.6806995451 g + 0.1073969566 b
//   s = 0.0883024619 r + 0.2817188376 g + 0.6299787005 b
fn linearToOklab(c: vec3f) -> vec3f {
  let l = dot(c, vec3f(0.4122214708, 0.5363325363, 0.0514459929));
  let m = dot(c, vec3f(0.2119034982, 0.6806995451, 0.1073969566));
  let s = dot(c, vec3f(0.0883024619, 0.2817188376, 0.6299787005));

  let lc = cbrtSigned(l);
  let mc = cbrtSigned(m);
  let sc = cbrtSigned(s);

  return vec3f(
    dot(vec3f(lc, mc, sc), vec3f(0.2104542553, 0.7936177850, -0.0040720468)),
    dot(vec3f(lc, mc, sc), vec3f(1.9779984951, -2.4285922050, 0.4505937099)),
    dot(vec3f(lc, mc, sc), vec3f(0.0259040371, 0.7827717662, -0.8086757660))
  );
}

fn oklabToLinear(lab: vec3f) -> vec3f {
  let lc = dot(lab, vec3f(1.0, 0.3963377774, 0.2158037573));
  let mc = dot(lab, vec3f(1.0, -0.1055613458, -0.0638541728));
  let sc = dot(lab, vec3f(1.0, -0.0894841775, -1.2914855480));

  let l = lc * lc * lc;
  let m = mc * mc * mc;
  let s = sc * sc * sc;

  return vec3f(
    dot(vec3f(l, m, s), vec3f(4.0767416621, -3.3077115913, 0.2309699292)),
    dot(vec3f(l, m, s), vec3f(-1.2684380046, 2.6097574011, -0.3413193965)),
    dot(vec3f(l, m, s), vec3f(-0.0041960863, -0.7034186147, 1.7076147010))
  );
}
`

/** Concatenates the prelude in front of a shader body. */
function withPrelude(body: string): string {
  return `${PRELUDE}\n${body}`
}

/** Storage texture formats a pass is allowed to write. */
export type OutputStorageFormat = 'rgba16float' | 'rgba8unorm'

/**
 * Retargets a shader at a different storage texture format.
 *
 * A bind group layout pins the storage format, and the WGSL has to agree with
 * it, so a pass that writes the final 8 bit result cannot share a module with
 * one that writes a 16 bit float intermediate. Rather than keep two hand copies
 * of every shader in sync, the format is substituted here and the resulting
 * module is cached by the pipeline. The token is written out in full in the
 * sources above so this stays a single unambiguous match.
 */
export function withOutputFormat(source: string, format: OutputStorageFormat): string {
  if (format === 'rgba16float') return source
  return source
    .split('texture_storage_2d<rgba16float, write>')
    .join(`texture_storage_2d<${format}, write>`)
}

/* ================================================================== */
/* 1. Separable resample                                               */
/* ================================================================== */

/**
 * One axis of a separable resample. The pipeline runs it twice, horizontal then
 * vertical, with an rgba16float texture in between.
 *
 * Crop and the source rectangle are folded in here because they cost nothing on
 * top of a gather that is already reading arbitrary source texels. The flip
 * bits are honoured as well, though the pipeline mirrors in the geometry pass
 * instead, where the mirror lands after the rotation.
 */
export const RESAMPLE_WGSL = withPrelude(/* wgsl */ `
struct ResampleParams {
  // Rectangle of the source this pass is allowed to read, in source texels.
  // Crop is expressed here rather than as its own pass.
  srcOrigin: vec2u,
  srcExtent: vec2u,
  dstSize: vec2u,
  // dstExtent / srcExtent along the axis being filtered.
  scale: f32,
  kernel: u32,
  // 0 filters along x, 1 filters along y.
  axis: u32,
  flags: u32,
}

@group(0) @binding(0) var<uniform> params: ResampleParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var dstTex: texture_storage_2d<rgba16float, write>;

fn cubicFilter(x: f32, b: f32, c: f32) -> f32 {
  let x2 = x * x;
  let x3 = x2 * x;
  if (x < 1.0) {
    return ((12.0 - 9.0 * b - 6.0 * c) * x3
      + (12.0 * b + 6.0 * c - 18.0) * x2
      + (6.0 - 2.0 * b)) / 6.0;
  }
  if (x < 2.0) {
    return (-(b + 6.0 * c) * x3
      + (6.0 * b + 30.0 * c) * x2
      - (12.0 * b + 48.0 * c) * x
      + (8.0 * b + 24.0 * c)) / 6.0;
  }
  return 0.0;
}

fn sinc(x: f32) -> f32 {
  if (x < 1.0e-6) {
    return 1.0;
  }
  let p = PI * x;
  return sin(p) / p;
}

fn lanczos(x: f32, a: f32) -> f32 {
  if (x >= a) {
    return 0.0;
  }
  return sinc(x) * sinc(x / a);
}

fn kernelRadius(kind: u32) -> f32 {
  switch kind {
    case 0u: { return 0.5; }
    case 1u: { return 1.0; }
    case 2u, 3u: { return 2.0; }
    case 4u: { return 2.0; }
    default: { return 3.0; }
  }
}

fn kernelWeight(kind: u32, x: f32) -> f32 {
  let ax = abs(x);
  switch kind {
    // Nearest: a box exactly one source texel wide, half open at the top edge.
    // Closing both edges would accept the pair of taps either side of a tie,
    // which an even integer downscale hits on every destination texel, and the
    // point sample would quietly become a two tap average.
    case 0u: { return select(0.0, 1.0, x >= -0.5 && x < 0.5); }
    case 1u: { return max(0.0, 1.0 - ax); }
    // Catmull Rom, B = 0 and C = 0.5, what libvips calls cubic.
    case 2u: { return cubicFilter(ax, 0.0, 0.5); }
    // Mitchell Netravali, B = C = 1/3, the ringing versus blur compromise.
    case 3u: { return cubicFilter(ax, 1.0 / 3.0, 1.0 / 3.0); }
    case 4u: { return lanczos(ax, 2.0); }
    default: { return lanczos(ax, 3.0); }
  }
}

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.dstSize.x || gid.y >= params.dstSize.y) {
    return;
  }

  let horizontal = params.axis == 0u;
  let srcLen = f32(select(params.srcExtent.y, params.srcExtent.x, horizontal));
  let dstIndex = f32(select(gid.y, gid.x, horizontal));

  // Centre of the destination texel projected back into source texel space.
  let center = (dstIndex + 0.5) / params.scale - 0.5;

  // Widening the support is what stops a downscale from aliasing. When the
  // scale is below one, several source texels land inside one destination
  // texel, so the filter has to average all of them: its footprint in source
  // space grows by 1 / scale and the kernel argument shrinks by the same
  // factor. Upscales keep the native support, where scale is clamped to one.
  // Nearest is a point sample by definition, so it is excluded: widening it
  // would silently turn it into a box filter and defeat the reason anyone
  // picks it, which is pixel art with hard edges.
  let filterScale = select(min(params.scale, 1.0), 1.0, params.kernel == 0u);
  let radius = kernelRadius(params.kernel) / filterScale;

  let first = i32(floor(center - radius + 0.5));
  var last = i32(ceil(center + radius - 0.5));
  if (last - first + 1 > ${MAX_RESAMPLE_TAPS}) {
    // The pipeline chains stages so this never trims a real tap, but a clamp
    // here keeps a malformed uniform from spinning the GPU.
    last = first + ${MAX_RESAMPLE_TAPS} - 1;
  }

  var acc = vec4f(0.0);
  var weightSum = 0.0;

  for (var i = first; i <= last; i = i + 1) {
    let w = kernelWeight(params.kernel, (f32(i) - center) * filterScale);
    if (w == 0.0) {
      continue;
    }
    // Clamp to edge. Wrapping or zero filling would darken the border.
    let tap = clamp(i, 0, i32(srcLen) - 1);
    var coord: vec2i;
    if (horizontal) {
      coord = vec2i(i32(params.srcOrigin.x) + tap, i32(params.srcOrigin.y) + i32(gid.y));
    } else {
      coord = vec2i(i32(params.srcOrigin.x) + i32(gid.x), i32(params.srcOrigin.y) + tap);
    }
    acc = acc + loadTexel(srcTex, coord, params.flags) * w;
    weightSum = weightSum + w;
  }

  if (weightSum > 0.0) {
    acc = acc / weightSum;
  }

  // Lanczos and the cubics have negative lobes, so an overshoot past the valid
  // range is normal and has to be clipped before it reaches an 8 bit store.
  acc = max(acc, vec4f(0.0));
  acc = vec4f(min(acc.rgb, vec3f(acc.a)), min(acc.a, 1.0));

  var dst = vec2u(gid.x, gid.y);
  if (hasFlag(params.flags, FLAG_FLIP_H)) {
    dst.x = params.dstSize.x - 1u - dst.x;
  }
  if (hasFlag(params.flags, FLAG_FLIP_V)) {
    dst.y = params.dstSize.y - 1u - dst.y;
  }

  textureStore(dstTex, vec2i(dst), storeTexel(acc, params.flags));
}
`)

/* ================================================================== */
/* 2. Colour operations                                                */
/* ================================================================== */

/**
 * Every per pixel colour adjustment in one pass.
 *
 * Stage order is fixed and deliberate: flatten first so later stages see opaque
 * pixels, the OKLab modulate block next, then the colour casts, then the tonal
 * curves, and invert last because it is defined on the value the user will
 * actually see.
 */
export const COLOR_OPS_WGSL = withPrelude(/* wgsl */ `
const STAGE_FLATTEN: u32 = 1u;
const STAGE_MODULATE: u32 = 2u;
const STAGE_TINT: u32 = 4u;
const STAGE_SEPIA: u32 = 8u;
const STAGE_GRAYSCALE: u32 = 16u;
const STAGE_CONTRAST: u32 = 32u;
const STAGE_GAMMA: u32 = 64u;
const STAGE_INVERT: u32 = 128u;

struct ColorParams {
  size: vec2u,
  flags: u32,
  stages: u32,
  brightness: f32,
  saturation: f32,
  // Radians, already converted from the degrees the settings hold.
  hue: f32,
  lightness: f32,
  contrast: f32,
  gammaValue: f32,
  pad0: f32,
  pad1: f32,
  // Both are straight, non premultiplied, linear light colours.
  tintColor: vec4f,
  background: vec4f,
}

@group(0) @binding(0) var<uniform> params: ColorParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  var texel = loadTexel(srcTex, vec2i(gid.xy), params.flags);
  let stages = params.stages;

  // Composite over the background. The source is premultiplied, so this is a
  // plain source over with a fully opaque backdrop.
  if (hasFlag(stages, STAGE_FLATTEN)) {
    texel = vec4f(texel.rgb + params.background.rgb * (1.0 - texel.a), 1.0);
  }

  // Work on the unpremultiplied colour from here on: every remaining stage is
  // a function of the colour itself, not of the colour scaled by coverage.
  let alpha = texel.a;
  let inverseAlpha = select(1.0 / max(alpha, 1.0e-6), 0.0, alpha <= 0.0);
  var rgb = texel.rgb * inverseAlpha;

  if (hasFlag(stages, STAGE_MODULATE)) {
    var lab = linearToOklab(rgb);
    // Brightness scales perceptual lightness and lightness offsets it, which
    // is what sharp's modulate does in LCh. The offset arrives in Lab units
    // where 100 is white, so it is rescaled onto the 0 to 1 OKLab range.
    lab.x = lab.x * params.brightness + params.lightness / 100.0;
    // Chroma scale and hue rotation in the a, b plane. Rotating the plane is a
    // true hue rotation; the naive RGB channel swizzle is not.
    let cs = cos(params.hue);
    let sn = sin(params.hue);
    let a = lab.y * params.saturation;
    let b = lab.z * params.saturation;
    lab = vec3f(max(lab.x, 0.0), a * cs - b * sn, a * sn + b * cs);
    rgb = max(oklabToLinear(lab), vec3f(0.0));
  }

  // Tint keeps the image lightness and takes the chroma of the target colour,
  // matching sharp's tint. Doing it as a multiply would darken the result.
  if (hasFlag(stages, STAGE_TINT)) {
    let target = linearToOklab(params.tintColor.rgb);
    let lab = linearToOklab(rgb);
    rgb = max(oklabToLinear(vec3f(lab.x, target.y, target.z)), vec3f(0.0));
  }

  // The classic sepia matrix. It was written for encoded values, but applying
  // it in linear light keeps it consistent with the rest of the pass and the
  // rows still sum close to one, so overall exposure is preserved.
  if (hasFlag(stages, STAGE_SEPIA)) {
    rgb = vec3f(
      dot(rgb, vec3f(0.393, 0.769, 0.189)),
      dot(rgb, vec3f(0.349, 0.686, 0.168)),
      dot(rgb, vec3f(0.272, 0.534, 0.131))
    );
  }

  if (hasFlag(stages, STAGE_GRAYSCALE)) {
    rgb = vec3f(luminance(rgb));
  }

  // Contrast and gamma are curve shaping, and a curve the user recognises is a
  // curve on the encoded value. Both round trip through sRGB on purpose.
  if (hasFlag(stages, STAGE_CONTRAST) || hasFlag(stages, STAGE_GAMMA) || hasFlag(stages, STAGE_INVERT)) {
    var encoded = linearToSrgb(rgb);
    if (hasFlag(stages, STAGE_CONTRAST)) {
      encoded = (encoded - vec3f(0.5)) * params.contrast + vec3f(0.5);
    }
    if (hasFlag(stages, STAGE_GAMMA)) {
      encoded = pow(max(encoded, vec3f(0.0)), vec3f(1.0 / params.gammaValue));
    }
    if (hasFlag(stages, STAGE_INVERT)) {
      // sharp negates the stored 8 bit value, so the inversion belongs here
      // and not in linear light, where mid grey would land in the wrong place.
      encoded = vec3f(1.0) - encoded;
    }
    rgb = srgbToLinear(clamp(encoded, vec3f(0.0), vec3f(1.0)));
  }

  let result = vec4f(clamp(rgb, vec3f(0.0), vec3f(1.0)) * alpha, alpha);
  textureStore(dstTex, vec2i(gid.xy), storeTexel(result, params.flags));
}
`)

/* ================================================================== */
/* 3. Separable gaussian blur                                          */
/* ================================================================== */

/**
 * One axis of a gaussian blur, run twice by the pipeline.
 *
 * Weights are evaluated in the loop instead of being uploaded, which trades a
 * handful of exp calls for one less buffer and one less bind group per image.
 */
export const GAUSSIAN_WGSL = withPrelude(/* wgsl */ `
struct BlurParams {
  size: vec2u,
  sigma: f32,
  // Radius in texels, derived on the host as ceil(sigma * 3).
  radius: i32,
  axis: u32,
  flags: u32,
}

@group(0) @binding(0) var<uniform> params: BlurParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  let horizontal = params.axis == 0u;
  let limit = i32(select(params.size.y, params.size.x, horizontal)) - 1;
  let along = i32(select(gid.y, gid.x, horizontal));

  // Three sigma captures 99.7 percent of the kernel energy, so truncating
  // there is invisible while keeping the loop short.
  let denom = 2.0 * params.sigma * params.sigma;
  var acc = vec4f(0.0);
  var weightSum = 0.0;

  for (var i = -params.radius; i <= params.radius; i = i + 1) {
    let d = f32(i);
    let w = exp(-(d * d) / denom);
    let tap = clamp(along + i, 0, limit);
    let coord = select(vec2i(i32(gid.x), tap), vec2i(tap, i32(gid.y)), horizontal);
    acc = acc + loadTexel(srcTex, coord, params.flags) * w;
    weightSum = weightSum + w;
  }

  if (weightSum > 0.0) {
    acc = acc / weightSum;
  }
  textureStore(dstTex, vec2i(gid.xy), storeTexel(acc, params.flags));
}
`)

/* ================================================================== */
/* 4. Unsharp mask                                                     */
/* ================================================================== */

/**
 * Unsharp mask matching the intent of sharp's `sharpen({ sigma, m1, m2 })`.
 *
 * libvips sharpens the L channel of LAB only, never the colour channels, which
 * is why its output has no coloured fringes around edges. This does the same in
 * OKLab: the lightness difference against the blurred copy is amplified, and the
 * colour is carried along by scaling, so hue and chroma are untouched.
 */
export const UNSHARP_WGSL = withPrelude(/* wgsl */ `
struct SharpenParams {
  size: vec2u,
  // Slope applied where the neighbourhood is flat, sharp's m1.
  m1: f32,
  // Slope applied where the neighbourhood is already an edge, sharp's m2.
  m2: f32,
  // Lightness difference, in Lab units, separating flat from jagged. libvips
  // fixes this at 2 and sharp does not expose it.
  threshold: f32,
  // Brightening and darkening limits in Lab units, libvips y2 and y3.
  maxBrighten: f32,
  maxDarken: f32,
  flags: u32,
  // The blurred copy is always a working intermediate, so it needs its own
  // conversion flags: the original may still be an sRGB encoded upload while
  // the blur output is already linear and premultiplied.
  blurFlags: u32,
}

@group(0) @binding(0) var<uniform> params: SharpenParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var blurTex: texture_2d<f32>;
@group(0) @binding(3) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  let at = vec2i(gid.xy);
  let original = loadTexel(srcTex, at, params.flags);
  let blurred = loadTexel(blurTex, at, params.blurFlags);

  let alpha = original.a;
  let inverseAlpha = select(1.0 / max(alpha, 1.0e-6), 0.0, alpha <= 0.0);
  let rgb = original.rgb * inverseAlpha;
  let blurRgb = blurred.rgb * select(1.0 / max(blurred.a, 1.0e-6), 0.0, blurred.a <= 0.0);

  let l = linearToOklab(rgb).x;
  let lBlur = linearToOklab(blurRgb).x;

  // OKLab lightness runs 0 to 1, libvips thresholds are in 0 to 100 Lab units.
  let diff = (l - lBlur) * 100.0;
  let slope = select(params.m2, params.m1, abs(diff) < params.threshold);
  let boost = clamp(diff * slope, -params.maxDarken, params.maxBrighten);
  let target = clamp(l + boost / 100.0, 0.0, 1.0);

  // Scaling linear RGB by the lightness ratio moves L without moving a or b.
  // OKLab lightness is a cube root of a cone response, so a ratio of r on L is
  // a ratio of r cubed on the linear values.
  let ratio = select(pow(target / max(l, 1.0e-5), 3.0), 0.0, l <= 1.0e-5);
  let sharpened = clamp(rgb * ratio, vec3f(0.0), vec3f(1.0));

  let result = vec4f(sharpened * alpha, alpha);
  textureStore(dstTex, at, storeTexel(result, params.flags));
}
`)

/* ================================================================== */
/* 5. Normalize: histogram reduction plus the levels stretch           */
/* ================================================================== */

/**
 * Builds a 256 bin histogram of perceptual lightness with atomic increments.
 *
 * Percentiles need the whole distribution, not just the extremes, so this is
 * the honest reduction: every invocation bumps one bin, and the host reads the
 * finished buffer back. That readback is one kilobyte, which is small enough
 * that a full GPU side prefix scan would cost more than it saves.
 *
 * Bins are counted in OKLab lightness because sharp normalises the L channel of
 * LAB, and a histogram over raw RGB would pick different percentile bounds.
 */
export const HISTOGRAM_WGSL = withPrelude(/* wgsl */ `
struct HistogramParams {
  size: vec2u,
  flags: u32,
  pad0: u32,
}

@group(0) @binding(0) var<uniform> params: HistogramParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> bins: array<atomic<u32>, ${HISTOGRAM_BINS}>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  let texel = loadTexel(srcTex, vec2i(gid.xy), params.flags);
  // Fully transparent texels carry no meaningful colour, so they must not drag
  // the black point down to zero.
  if (texel.a <= 0.0) {
    return;
  }

  let rgb = texel.rgb / max(texel.a, 1.0e-6);
  let l = clamp(linearToOklab(rgb).x, 0.0, 1.0);
  let bin = min(u32(l * ${HISTOGRAM_BINS}.0), ${HISTOGRAM_BINS}u - 1u);
  atomicAdd(&bins[bin], 1u);
}
`)

/**
 * Applies the levels stretch the histogram pass measured.
 *
 * `low` and `high` are OKLab lightness values chosen on the host from the bin
 * counts. The stretch is applied to lightness only, again to avoid shifting hue
 * the way an independent per channel stretch does.
 */
export const NORMALIZE_WGSL = withPrelude(/* wgsl */ `
struct NormalizeParams {
  size: vec2u,
  low: f32,
  high: f32,
  flags: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

@group(0) @binding(0) var<uniform> params: NormalizeParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  let at = vec2i(gid.xy);
  let texel = loadTexel(srcTex, at, params.flags);
  let alpha = texel.a;
  let inverseAlpha = select(1.0 / max(alpha, 1.0e-6), 0.0, alpha <= 0.0);
  let rgb = texel.rgb * inverseAlpha;

  let span = max(params.high - params.low, 1.0e-4);
  let l = linearToOklab(rgb).x;
  let target = clamp((l - params.low) / span, 0.0, 1.0);
  let ratio = select(pow(target / max(l, 1.0e-5), 3.0), 0.0, l <= 1.0e-5);

  let stretched = clamp(rgb * ratio, vec3f(0.0), vec3f(1.0));
  textureStore(dstTex, at, storeTexel(vec4f(stretched * alpha, alpha), params.flags));
}
`)

/* ================================================================== */
/* 6. Watermark composite                                              */
/* ================================================================== */

/**
 * Composites an overlay, either once at a fixed offset or tiled across the
 * whole image, with a global opacity multiplier.
 *
 * The overlay arrives already rasterised: text watermarks are drawn to an
 * OffscreenCanvas by the worker, so this shader only ever sees pixels.
 */
export const WATERMARK_WGSL = withPrelude(/* wgsl */ `
struct WatermarkParams {
  size: vec2u,
  overlaySize: vec2u,
  // Top left of the overlay for the single placement, in destination texels.
  offset: vec2i,
  // Tile pitch, which is the overlay size plus the gap between repeats.
  pitch: vec2u,
  opacity: f32,
  tile: u32,
  flags: u32,
  // The overlay is uploaded as sRGB encoded straight alpha, like any image.
  overlayFlags: u32,
}

@group(0) @binding(0) var<uniform> params: WatermarkParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var overlayTex: texture_2d<f32>;
@group(0) @binding(3) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.size.x || gid.y >= params.size.y) {
    return;
  }

  let at = vec2i(gid.xy);
  let base = loadTexel(srcTex, at, params.flags);

  var local = vec2i(-1, -1);
  if (params.tile != 0u) {
    // Modulo against the pitch repeats the overlay across the image. Where the
    // pitch is wider than the overlay the coordinate falls outside it and the
    // texel is left alone, which is what produces the gap between repeats.
    let pitch = vec2i(max(params.pitch, vec2u(1u)));
    local = vec2i(at.x % pitch.x, at.y % pitch.y);
  } else {
    local = at - params.offset;
  }

  let extent = vec2i(params.overlaySize);
  let inside = local.x >= 0 && local.y >= 0 && local.x < extent.x && local.y < extent.y;

  var result = base;
  if (inside) {
    let overlay = loadTexel(overlayTex, local, params.overlayFlags);
    // Premultiplied source over, with opacity folded into the coverage.
    let src = overlay * clamp(params.opacity, 0.0, 1.0);
    result = src + base * (1.0 - src.a);
  }

  textureStore(dstTex, at, storeTexel(result, params.flags));
}
`)

/* ================================================================== */
/* 7. Orientation and padding                                          */
/* ================================================================== */

/**
 * Rotation in ninety degree steps, the mirrors, the letterbox and the border.
 *
 * This is not one of the filtering passes: it is a pure gather with a
 * coordinate remap, so it is exact and needs no kernel. It runs whenever the
 * geometry of the canvas differs from the geometry of the resampled image, and
 * it is separate from the resample pass because a separable filter cannot
 * express a transposition.
 */
export const ORIENT_WGSL = withPrelude(/* wgsl */ `
struct OrientParams {
  srcSize: vec2u,
  dstSize: vec2u,
  // Where the rotated image starts inside the padded destination.
  pad: vec2u,
  // The box a contain fit reserved, in destination texels. Inside it but
  // outside the image is letterbox, outside it is the padding border. An empty
  // box means there is no letterbox at all.
  boxOrigin: vec2u,
  boxSize: vec2u,
  // 0, 1, 2 and 3 mean 0, 90, 180 and 270 degrees clockwise.
  quarterTurns: u32,
  flags: u32,
  // Premultiplied linear light fill colours.
  border: vec4f,
  letterbox: vec4f,
}

@group(0) @binding(0) var<uniform> params: OrientParams;
@group(0) @binding(1) var srcTex: texture_2d<f32>;
@group(0) @binding(2) var dstTex: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${WORKGROUP_EDGE}, ${WORKGROUP_EDGE})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.dstSize.x || gid.y >= params.dstSize.y) {
    return;
  }

  let at = vec2i(gid.xy);
  let inner = at - vec2i(params.pad);
  let rotatedSize = vec2i(select(
    vec2u(params.srcSize.y, params.srcSize.x),
    params.srcSize,
    (params.quarterTurns & 1u) == 0u
  ));

  let boxOrigin = vec2i(params.boxOrigin);
  let boxEnd = boxOrigin + vec2i(params.boxSize);
  let inBox = at.x >= boxOrigin.x && at.y >= boxOrigin.y && at.x < boxEnd.x && at.y < boxEnd.y;

  var result = select(params.border, params.letterbox, inBox);
  if (inner.x >= 0 && inner.y >= 0 && inner.x < rotatedSize.x && inner.y < rotatedSize.y) {
    var source = inner;
    switch params.quarterTurns {
      case 1u: { source = vec2i(inner.y, rotatedSize.x - 1 - inner.x); }
      case 2u: { source = vec2i(rotatedSize.x - 1 - inner.x, rotatedSize.y - 1 - inner.y); }
      case 3u: { source = vec2i(rotatedSize.y - 1 - inner.y, inner.x); }
      default: { source = inner; }
    }
    result = loadTexel(srcTex, source, params.flags);
  }

  // The mirror is applied to the finished canvas rather than to the gather, so
  // it lands after the rotation. Everything above is addressed in unmirrored
  // destination space, which is why only the store coordinate moves.
  var dst = vec2u(gid.x, gid.y);
  if (hasFlag(params.flags, FLAG_FLIP_H)) {
    dst.x = params.dstSize.x - 1u - dst.x;
  }
  if (hasFlag(params.flags, FLAG_FLIP_V)) {
    dst.y = params.dstSize.y - 1u - dst.y;
  }

  textureStore(dstTex, vec2i(dst), storeTexel(result, params.flags));
}
`)
