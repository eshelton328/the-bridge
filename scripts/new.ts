#!/usr/bin/env node
// Starts a page, screen, block or state from scripts/templates, so each
// one has the same shape (d-081). The one way to add them:
//   pnpm new page <page> --state <id> --frame <D1>   a page folder, its route and first state
//   pnpm new screen <Name> --page <page>      pages/<page>/screens/<Name>.tsx and its stories
//   pnpm new block <Name> [--page <page>]     a page block, or a shared block in blocks/
//   pnpm new state <id> --page <page> --frame <D1>   a state file, its index entry and its story
// It refuses a name that exists or breaks the naming rule, then runs the
// generators. Fill in each TODO it leaves; the checks fail until you do.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { pages } from '../web/src/structure.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = join(root, 'web', 'src')
const templates = join(root, 'scripts', 'templates')

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { page: { type: 'string' }, frame: { type: 'string' }, state: { type: 'string' } },
})
const [kind, name] = positionals

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const camel = /^[a-z][a-zA-Z0-9]*$/
const pascalName = /^[A-Z][a-zA-Z0-9]*$/
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const words = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2')

function fill(template: string, vars: Record<string, string>): string {
  const text = readFileSync(join(templates, template), 'utf8')
  return text.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => vars[key] ?? fail(`Template ${template} uses {{${key}}}, which new.ts does not set.`),
  )
}

function write(path: string, text: string): void {
  if (existsSync(path)) fail(`${path.slice(root.length)} exists already.`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
  console.log(`wrote ${path.slice(root.length)}`)
}

type PageVars = { page: string; Page: string; Title: string }

function pageVars(page: string | undefined): PageVars {
  if (page === undefined) fail('Name the page with --page <page>.')
  if (!existsSync(join(src, 'pages', page))) fail(`There is no page "${page}". Start it with: pnpm new page ${page}`)
  return { page, Page: pascal(page), Title: pascal(words(page).toLowerCase()) }
}

function stateIds(page: string): string[] {
  const dir = join(src, 'pages', page, 'states')
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
        .map((f) => f.slice(0, -3))
        .sort()
    : []
}

function run(script: string): void {
  execFileSync(process.execPath, [join(root, 'scripts', script)], { stdio: 'inherit' })
}

function storyFor(vars: PageVars, id: string, frame: string): string {
  return fill('state.story.tpl', { ...vars, id, frame, Story: pascal(id) })
}

function newPage(page: string): void {
  const id = values.state ?? fail('Name the first state with --state <id>, such as --state nextStep.')
  const frame = values.frame ?? fail('Name its Figma frame with --frame, such as --frame D1.')
  if (!camel.test(id)) fail('A state id is camelCase, such as nextStep.')
  const known: readonly string[] = pages
  if (!known.includes(page))
    fail(`"${page}" is not a page in web/src/structure.ts (${known.join(', ')}). Add it there first.`)
  const base = { page, Page: pascal(page), Title: pascal(words(page).toLowerCase()) }
  const vars = {
    ...base,
    Name: `${base.Page}Screen`,
    up: '../../../',
    id,
    frame,
    data: "{ title: 'TODO: Figma copy' }",
    ui: '{}',
    stories: storyFor(base, id, frame),
  }
  const dir = join(src, 'pages', page)
  if (existsSync(dir)) fail(`web/src/pages/${page}/ exists already.`)
  const files: [string, string][] = [
    ['AGENTS.md', 'page/AGENTS.md.tpl'],
    ['CLAUDE.md', 'page/CLAUDE.md.tpl'],
    ['index.ts', 'page/index.ts.tpl'],
    ['types.ts', 'page/types.ts.tpl'],
    ['search.ts', 'page/search.ts.tpl'],
    [`load${vars.Page}State.ts`, 'page/loadPageState.ts.tpl'],
    [`${vars.Page}Page.tsx`, 'page/PagePage.tsx.tpl'],
    ['definition.ts', 'page/definition.ts.tpl'],
    [join('states', 'index.ts'), 'page/states.index.ts.tpl'],
    [join('states', `${id}.ts`), 'state.ts.tpl'],
    [join('screens', `${vars.Name}.tsx`), 'screen.tsx.tpl'],
    [join('screens', `${vars.Name}.stories.tsx`), 'screen.stories.tsx.tpl'],
  ]
  for (const [file, template] of files) write(join(dir, file), fill(template, vars))
  write(join(src, 'routes', `${page}.tsx`), fill('page/route.tsx.tpl', vars))
  console.log(`Link pages/${page}/AGENTS.md from web/src/pages/AGENTS.md and fill in each TODO.`)
  run('genRoutes.ts')
  run('genRegistry.ts')
}

function newScreen(screen: string): void {
  if (!pascalName.test(screen) || !screen.endsWith('Screen'))
    fail('A screen name is PascalCase and ends with Screen, such as InboxDetailScreen.')
  const page = pageVars(values.page)
  const [first] = stateIds(page.page)
  if (first === undefined)
    fail(`pages/${page.page} has no state yet. Add one first: pnpm new state <id> --page ${page.page} --frame <D1>`)
  const stories = `\nexport const ${pascal(first)}: Story = {\n  args: { data: ${page.page}States.${first}.data, ui: ${page.page}States.${first}.ui, viewport: 'desktop' },\n  globals: { viewport: { value: 'desktop', isRotated: false } },\n  play: async ({ canvas }) => {\n    // TODO: check text this screen shows.\n    await expect(canvas.getByText('TODO: text this screen shows')).toBeVisible()\n  },\n}\n`
  const vars = { ...page, Name: screen, up: '../../../', stories }
  const dir = join(src, 'pages', vars.page, 'screens')
  write(join(dir, `${screen}.tsx`), fill('screen.tsx.tpl', vars))
  write(join(dir, `${screen}.stories.tsx`), fill('screen.stories.tsx.tpl', vars))
}

function newBlock(block: string): void {
  if (!pascalName.test(block)) fail('A block name is PascalCase, such as InboxRow.')
  const page = values.page
  const vars =
    page === undefined
      ? { Name: block, storyGroup: 'Blocks' }
      : { ...pageVars(page), Name: block, storyGroup: `Pages/${pageVars(page).Title}/Blocks` }
  const dir = page === undefined ? join(src, 'blocks') : join(src, 'pages', page, 'blocks')
  write(join(dir, `${block}.tsx`), fill('block.tsx.tpl', vars))
  write(join(dir, `${block}.stories.tsx`), fill('block.stories.tsx.tpl', vars))
}

function newState(id: string): void {
  if (!camel.test(id)) fail('A state id is camelCase, such as filterOpen.')
  const frame = values.frame ?? fail('Name the Figma frame with --frame, such as --frame D4.')
  const vars = pageVars(values.page)
  const statesDir = join(src, 'pages', vars.page, 'states')
  const existing = stateIds(vars.page)
  const [first] = existing
  const data = first === undefined ? "{ title: 'TODO' }" : `{ ...${first}.data }`
  const ui = first === undefined ? '{}' : `{ ...${first}.ui }`
  let state = fill('state.ts.tpl', { ...vars, id, frame, data, ui })
  if (first !== undefined)
    state = state.replace(
      'import type { ScreenState }',
      `import { ${first} } from './${first}.ts'\nimport type { ScreenState }`,
    )
  write(join(statesDir, `${id}.ts`), state)

  const ids = [...existing, id].sort()
  writeFileSync(
    join(statesDir, 'index.ts'),
    [
      `// Every Figma state of the ${vars.Title} page, by id. scripts/genRegistry.ts reads the`,
      '// file names in this folder; each must be a key here and a story.',
      ...ids.map((s) => `import { ${s} } from './${s}.ts'`),
      '',
      `export const ${vars.page}States = {`,
      ...ids.map((s) => `  ${s},`),
      '}',
      '',
    ].join('\n'),
  )
  console.log(`updated web/src/pages/${vars.page}/states/index.ts`)

  const stories = join(src, 'pages', vars.page, 'screens', `${vars.Page}Screen.stories.tsx`)
  if (!existsSync(stories)) fail(`No ${stories.slice(root.length)} to add the story to; add it by hand.`)
  let text = readFileSync(stories, 'utf8')
  const header: string[] = []
  if (!text.includes("from 'storybook/test'")) header.push("import { expect } from 'storybook/test'")
  if (!text.includes(`${vars.page}States }`)) header.push(`import { ${vars.page}States } from '../states/index.ts'`)
  if (header.length > 0)
    text = text.replace(
      /(import type \{ Meta, StoryObj \} from '@storybook\/react-vite'\n)/,
      `$1${header.join('\n')}\n`,
    )
  if (!text.includes('type Story = ')) text = `${text.trimEnd()}\ntype Story = StoryObj<typeof meta>\n`
  text = `${text.trimEnd()}\n${storyFor(vars, id, frame)}`
  writeFileSync(stories, text)
  console.log(`added the story ${pascal(id)} to ${stories.slice(root.length)}`)
  run('genRegistry.ts')
}

switch (kind) {
  case 'page':
    newPage(name ?? fail('pnpm new page <page> --state <id> --frame <D1>'))
    break
  case 'screen':
    newScreen(name ?? fail('pnpm new screen <Name> --page <page>'))
    break
  case 'block':
    newBlock(name ?? fail('pnpm new block <Name> [--page <page>]'))
    break
  case 'state':
    newState(name ?? fail('pnpm new state <id> --page <page> --frame <D1>'))
    break
  case undefined:
  default:
    fail('Usage: pnpm new page|screen|block|state <name> [--page <page>] [--state <id>] [--frame <D1>]')
}
