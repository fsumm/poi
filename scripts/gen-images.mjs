// Image optimization pipeline.
//
// Every image frame on the site is a FIXED-HEIGHT box (360px) with
// object-fit/cover, so the dimension that drives sharpness is HEIGHT, not
// width. We therefore generate variants by height and describe them with
// DENSITY (x) descriptors: density = variantHeight / frameHeight. Because the
// rendered height never changes across breakpoints, the browser picks the
// variant purely from the display density (devicePixelRatio) — a 1× display
// gets the 360px-tall file, a Retina 2× display gets the 720px-tall file, etc.
//
// For each /img/*.jpg this generates:
//   1. Height variants (for responsive <img srcset> with x descriptors).
//   2. A tiny inline base64 LQIP that paints instantly while the image loads.
//
// Variants are written to /public/responsive (served verbatim by Vite under the
// configured base path). A manifest is written to src/data/images.js.
//
// Regenerate everything:        npm run images
// Regenerate specific images:   npm run images -- about001.jpg orbiter001.jpg
//   (only the named images' variants + manifest entries are rebuilt; all other
//    entries are preserved, and the output dir is left otherwise untouched.)
//
// Uses macOS `sips` so there are no extra npm dependencies.

import { execFileSync } from 'node:child_process'
import {
  readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IMG_DIR = join(ROOT, 'img')
const OUT_DIR = join(ROOT, 'public', 'responsive')
const OUT_REL = 'responsive' // path under the served base, e.g. /poi/responsive/...
const MANIFEST = join(ROOT, 'src', 'data', 'images.js')

// Frames render at this height everywhere (see the *-img rules in index.css).
// Variant heights are multiples of it so each maps to a clean density.
const FRAME_HEIGHT = 360
const DENSITIES = [1, 1.5, 2, 3] // → heights 360 / 540 / 720 / 1080
const JPEG_QUALITY = 72
const PLACEHOLDER_EDGE = 24
const PLACEHOLDER_QUALITY = 40

function dims(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString()
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)[1])
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)[1])
  return { w, h }
}

// Optional CLI filter: only (re)generate the named images. Without args we do a
// full rebuild and wipe the output dir so renamed/removed sources don't leave
// stale variants; with args we preserve every other image's files + manifest.
const only = process.argv.slice(2).map((a) => basename(a))
const targeted = only.length > 0

let manifest = {}
if (targeted) {
  if (!existsSync(MANIFEST)) {
    throw new Error('No existing manifest to update — run `npm run images` once for a full build first.')
  }
  manifest = { ...(await import(pathToFileURL(MANIFEST).href)).default }
  mkdirSync(OUT_DIR, { recursive: true })
} else {
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })
}
const tmp = mkdtempSync(join(tmpdir(), 'imgopt-'))

try {
  const allFiles = readdirSync(IMG_DIR).filter((f) => /\.jpe?g$/i.test(f)).sort()
  const files = targeted ? allFiles.filter((f) => only.includes(f)) : allFiles
  const missing = only.filter((f) => !allFiles.includes(f))
  if (missing.length) throw new Error(`No such image(s) in /img: ${missing.join(', ')}`)

  for (const file of files) {
    const src = join(IMG_DIR, file)
    const { w: srcW, h: srcH } = dims(src)
    const stem = basename(file).replace(/\.jpe?g$/i, '')

    // Clear this image's previous variants (height set may change with the new
    // source) so no stale files linger.
    for (const f of readdirSync(OUT_DIR)) {
      if (/^(.+)-h\d+\.jpg$/.exec(f)?.[1] === stem) rmSync(join(OUT_DIR, f))
    }

    // Heights to produce, capped so we never upscale past the source height.
    let densities = DENSITIES.filter((d) => Math.round(d * FRAME_HEIGHT) <= srcH)
    if (densities.length === 0) densities = [+(srcH / FRAME_HEIGHT).toFixed(3)]

    const variants = densities.map((density) => {
      const h = Math.round(density * FRAME_HEIGHT)
      const outName = `${stem}-h${h}.jpg`
      execFileSync('sips', [
        '--resampleHeight', String(h),
        '-s', 'format', 'jpeg',
        '-s', 'formatOptions', String(JPEG_QUALITY),
        src, '--out', join(OUT_DIR, outName),
      ], { stdio: 'ignore' })
      return { density, src: `${OUT_REL}/${outName}` }
    })

    // Tiny inline placeholder.
    const phOut = join(tmp, `${stem}-ph.jpg`)
    execFileSync('sips', [
      '-Z', String(PLACEHOLDER_EDGE),
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', String(PLACEHOLDER_QUALITY),
      src, '--out', phOut,
    ], { stdio: 'ignore' })
    const placeholder = `data:image/jpeg;base64,${readFileSync(phOut).toString('base64')}`

    manifest[file] = { width: srcW, height: srcH, variants, placeholder }
  }

  const body =
    '// AUTO-GENERATED by scripts/gen-images.mjs — do not edit by hand.\n' +
    '// Run `npm run images` to regenerate after adding/replacing images in /img.\n\n' +
    'const images = ' + JSON.stringify(manifest, null, 2) + '\n\n' +
    '// Resolve a responsive <img> prop bundle for an image (keyed by its /img\n' +
    '// filename, e.g. "about001.jpg"). Frames are fixed-height + cover, so the\n' +
    '// variants are described by DENSITY (x) descriptors keyed off height: the\n' +
    '// browser selects by display density (Retina → 2×/3×), independent of width.\n' +
    'export function imgProps(file) {\n' +
    '  const base = import.meta.env.BASE_URL\n' +
    '  const entry = images[file]\n' +
    '  if (!entry) throw new Error(`No optimized image for "${file}" — run npm run images`)\n' +
    '  const srcSet = entry.variants.map((v) => `${base}${v.src} ${v.density}x`).join(", ")\n' +
    '  return {\n' +
    '    src: `${base}${entry.variants[0].src}`,\n' +
    '    srcSet,\n' +
    '    width: entry.width,\n' +
    '    height: entry.height,\n' +
    '    placeholder: entry.placeholder,\n' +
    '  }\n' +
    '}\n\n' +
    'export default images\n'

  writeFileSync(MANIFEST, body)

  const builtVariants = files.reduce((n, f) => n + manifest[f].variants.length, 0)
  const scope = targeted ? `${files.join(', ')}` : `all ${files.length} images`
  console.log(`Generated ${builtVariants} height variants for ${scope} → public/${OUT_REL}/`)
  console.log(`Wrote manifest → src/data/images.js`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
