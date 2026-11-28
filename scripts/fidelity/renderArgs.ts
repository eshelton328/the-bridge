// The Chromium flags of every fidelity render (fidelity.ts). Pure.
//
// - `--font-render-hinting=none`: Chromium on Linux hints glyphs with
//   FreeType, which makes text a few px wider than on macOS, where the Figma
//   frames were checked; with hinting off, text widths in CI match a Mac's
//   more closely.
// - `--num-raster-threads=1`: Chromium rasters a page on several threads by
//   default, and on a busy machine it sometimes rasters it as one thread
//   would. The two paths anti-alias some rounded corners one level apart
//   (settings D01 and D02, the top-right corner of each card), so the same
//   commit gave two render hashes and a sealed review went stale (NCC-177).
//   One thread gives the second image every time, under load too.
export const renderArgs: readonly string[] = ['--font-render-hinting=none', '--num-raster-threads=1']
