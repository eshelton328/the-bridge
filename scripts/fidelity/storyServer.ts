// Serves the built Storybook (web/storybook-static) on a free local port and
// finds the story that renders a Figma frame. The fidelity run opens
// iframe.html?id=<story> in Playwright, so it renders the same story that
// `pnpm test` plays.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { z } from 'zod'
import { isStateFile } from '../genRegistry.ts'
import { repoRoot } from './references.ts'

export const storybookDir = join(repoRoot, 'web', 'storybook-static')
const pagesDir = join(repoRoot, 'web', 'src', 'pages')

const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

/** Starts a static server on 127.0.0.1 and returns its origin and a close function. */
export async function serveStatic(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)).replace(
      /^(\.\.[/\\])+/,
      '',
    )
    const file = join(dir, path.endsWith('/') ? `${path}index.html` : path)
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  return {
    origin: `http://127.0.0.1:${String(port)}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve()
        })
      }),
  }
}

const storyIndex = z.object({
  entries: z.record(
    z.string(),
    z.object({ id: z.string(), type: z.string(), importPath: z.string(), exportName: z.string().optional() }),
  ),
})

/** The state file of `page` whose `frames` list the frame code ("D1"), by its file name ("nextStep"). */
export function stateForFrame(page: string, code: string, dir = pagesDir): string | undefined {
  const statesDir = join(dir, page, 'states')
  if (!existsSync(statesDir)) return undefined
  const re = new RegExp(`\\bid:\\s*['"]${code}['"]`)
  return readdirSync(statesDir)
    .filter(isStateFile)
    .find((f) => re.test(readFileSync(join(statesDir, f), 'utf8')))
    ?.replace(/\.ts$/, '')
}

/** The story id that renders `<page>States.<state>`: the story named after the state in the page's screens. */
export function storyForState(page: string, state: string, indexJson: string): string | undefined {
  const exportName = state.charAt(0).toUpperCase() + state.slice(1)
  const entries = Object.values(storyIndex.parse(JSON.parse(indexJson)).entries)
  return entries.find(
    (e) => e.type === 'story' && e.exportName === exportName && e.importPath.includes(`/pages/${page}/screens/`),
  )?.id
}
