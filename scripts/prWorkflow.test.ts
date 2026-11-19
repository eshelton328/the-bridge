// Tests for the base-branch guard of .github/workflows/pr.yml. Run with
// `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/pr.yml', import.meta.url), 'utf8')
const guard = workflow.slice(workflow.indexOf('- name: Require a ci run after the last base-branch change'))
const step = guard.slice(0, guard.indexOf('\n      - name:'))

void test('the guard runs only on an edit, as a push or reopen starts ci.yml itself', () => {
  assert.match(step, /\n {8}if: github\.event\.action == 'edited'\n/)
})

// The pull_request types of a workflow's `on:` block.
function types(path: string): string[] {
  const text = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const match = /\n {2}pull_request:\n {4}types: \[([^\]]*)\]/.exec(text)
  if (match?.[1] === undefined) throw new Error(`${path} has no pull_request types line`)
  return match[1].split(',').map((type) => type.trim())
}

void test('the guard runs on every pr.yml event that does not start ci.yml, so no such event can pass pr-title after a base change', () => {
  const ci = new Set(types('.github/workflows/ci.yml'))
  const guarded = [...step.matchAll(/github\.event\.action == '([a-z_]+)'/g)].map((m) => m[1])
  for (const type of types('.github/workflows/pr.yml'))
    if (!ci.has(type))
      assert.ok(guarded.includes(type), `pr.yml runs on ${type}, which ci.yml does not; the guard must run on it too`)
})

void test('the guard counts only ci runs of this PR, not of another PR with the same head', () => {
  assert.match(step, /select\(any\(\.pull_requests\[\]; \.number == \$PR\)\)/)
})
