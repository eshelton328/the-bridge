#!/usr/bin/env node
// `pnpm check:reviews`: fails when a built PNG frame (d-119) has no
// committed fidelity-reviewer record, or its record is stale (the
// reference, the page source or the library changed since the review),
// edited by hand or holds a P1 or P2 finding (reviewSeal.ts). CI runs it
// and never runs the reviewer agent. Prints one JSON line; exits 1 on a
// problem.
import { repoRoot } from './references.ts'
import { checkReviews } from './reviewSeal.ts'

const frames = checkReviews(repoRoot)
const failed = frames.filter((f) => !f.ok)
console.log(JSON.stringify({ ok: failed.length === 0, checked: frames.length, failed }))
process.exit(failed.length ? 1 : 0)
