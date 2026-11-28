// The pure parts of keyboardCheck.ts: the keyboard's easing, the checks on the sampled frames and the contact
// sheet's ffmpeg arguments. keyboardCheck.test.ts tests them in Node.

/** One animation frame of the served page while the fake keyboard opens or closes. */
export type Frame = {
  /** Milliseconds since the field took the focus. */
  t: number
  phase: 'open' | 'close'
  /** The fake keyboard's height in this frame. */
  keyboard: number
  /** The top of the chat's header (the ScrollFrame header in the shell detail). */
  headerTop: number
  scrollY: number
  /** The bottom of the lowest text, image or icon in the chat's message list. */
  lastBottom: number
  /** The top and bottom of the composer (the ScrollFrame footer). */
  footerTop: number
  footerBottom: number
  /** The bottom of the screen above the keyboard: the layout's height less the keyboard. */
  keyboardTop: number
  /** The lowest opacity of the document, the shell and the chat's header, body and footer, multiplied down the tree. */
  opacity: number
}

export type CheckResult = {
  name: string
  ok: boolean
  bad: number
  worst?: { t: number; phase: string; value: number }
}

const tolerance = 0.5

/**
 * Checks the owner's acceptance rules of screen review R20 to R22 on each frame: the header's top never moves, the window
 * never scrolls, the last message stays above the composer and nothing on the shell fades.
 */
export function checkFrames(frames: readonly Frame[]): CheckResult[] {
  const first = frames[0]
  if (first === undefined) return [{ name: 'frames', ok: false, bad: 0 }]
  // `worse` says how far a value is from good, so `worst` is the frame that failed most.
  const rule = (
    name: string,
    value: (f: Frame) => number,
    good: (v: number) => boolean,
    worse: (v: number) => number = Math.abs,
    among: readonly Frame[] = frames,
  ): CheckResult => {
    const bad = among.filter((f) => !good(value(f)))
    const worst = bad.reduce<Frame | undefined>(
      (w, f) => (w === undefined || worse(value(f)) > worse(value(w)) ? f : w),
      undefined,
    )
    return {
      name,
      ok: among.length > 0 && bad.length === 0,
      bad: bad.length,
      ...(worst === undefined ? {} : { worst: { t: worst.t, phase: worst.phase, value: value(worst) } }),
    }
  }
  // The frames with the keyboard all the way open: there the composer must sit on it.
  const full = Math.max(...frames.map((f) => f.keyboard))
  const open = frames.filter((f) => f.phase === 'open' && f.keyboard === full)
  return [
    rule(
      'header top stays put (px moved)',
      (f) => f.headerTop - first.headerTop,
      (v) => Math.abs(v) <= tolerance,
    ),
    rule(
      'window scrollY is 0',
      (f) => f.scrollY,
      (v) => v === 0,
    ),
    rule(
      'last message above the composer (px under it)',
      (f) => f.lastBottom - f.footerTop,
      (v) => v <= tolerance,
    ),
    rule(
      'no fade on the shell (lowest opacity)',
      (f) => f.opacity,
      (v) => v >= 1,
      (v) => 1 - v,
    ),
    rule(
      'composer above the open keyboard (px under its top)',
      (f) => f.footerBottom - f.keyboardTop,
      (v) => v <= tolerance,
      Math.abs,
      open,
    ),
  ]
}

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress 0 to 1, solved for x by bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (at(x1, x2, mid) < x) lo = mid
      else hi = mid
    }
    return at(y1, y2, (lo + hi) / 2)
  }
}

/**
 * The ffmpeg arguments that tile `count` frames, evenly spread over `seconds` from `start`, of a recording into one
 * contact sheet, `columns` across, each frame `width` px wide.
 */
export function sheetArgs(o: {
  video: string
  out: string
  start: number
  seconds: number
  count: number
  columns: number
  width: number
}): string[] {
  const rows = Math.ceil(o.count / o.columns)
  const fps = o.count / o.seconds
  return [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    o.start.toFixed(3),
    '-t',
    o.seconds.toFixed(3),
    '-i',
    o.video,
    '-vf',
    `fps=${fps.toFixed(4)},scale=${String(o.width)}:-1,tile=${String(o.columns)}x${String(rows)}:padding=4:color=white`,
    '-frames:v',
    '1',
    o.out,
  ]
}

/**
 * The app's URL: `--url` first, then the `SERVED_APP_URL` environment variable. The repo holds no host, so with
 * neither set the check stops with a message that names both. It must be a dev server (`devServerProblem`).
 */
export function servedUrl(
  flag: string | undefined,
  env: string | undefined,
): { ok: true; url: string } | { ok: false; error: string } {
  const value = (flag ?? env ?? '').trim()
  if (value === '') {
    return {
      ok: false,
      error:
        'keyboard:served needs the URL of a dev server: pass --url <url> or set SERVED_APP_URL to a `pnpm dev` in a worktree.',
    }
  }
  return { ok: true, url: value.replace(/\/+$/, '') }
}

/**
 * Whether an answer to `/@vite/client` comes from a Vite dev server: a 200 with JavaScript. `vite preview` sends its
 * `index.html` for any path, so a build answers 200 with HTML.
 */
export function isViteClient(status: number | undefined, contentType: string | null | undefined): boolean {
  return status === 200 && /javascript/i.test(contentType ?? '')
}

/**
 * The message when the URL is not a Vite dev server. The check opens `?state=` pages, and a build ignores `?state=`
 * (d-134), so the served app, a build, would show its live homes in their place.
 */
export function devServerProblem(url: string): string {
  return `keyboard:served opens ?state= pages, which only a dev server reads, and ${url} is not one (no /@vite/client; the served app is a build, d-134). Run \`pnpm dev\` in a worktree with its own BRIDGE_SERVER_URL and pass its URL.`
}
