# scripts/secrets

The tests of the secret and privacy scan. `secretScan.test.ts` runs
gitleaks 8.30.1 on planted files with the rules and exceptions in
`.gitleaks.toml` and checks the gitleaks flags of the two CI scans. Only
the `secrets` job in `.github/workflows/ci.yml` runs it, as
`node --test scripts/secrets/secretScan.test.ts`, because it needs
gitleaks; `pnpm test:scripts` does not include this folder. Build each
planted value from parts, so this folder has no line that the scan finds.

`mergePrefix.ts` is the job's step "No files under b/". The exception
paths also match `b/<path>`, the name gitleaks gives the file of a merge
conflict hunk, so the step fails a PR that adds or changes a file under a
top-level `b/` folder.
