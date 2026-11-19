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

void test('the guard counts only ci runs of this PR, not of another PR with the same head', () => {
  assert.match(step, /select\(any\(\.pull_requests\[\]; \.number == \$PR\)\)/)
})
