# scripts/secrets

The tests of the secret and privacy scan in `.gitleaks.toml`, and the
scan's helper steps for the CI job `secrets`.

- Only the CI job `secrets` runs this folder; `pnpm test:scripts` leaves
  it out. Locally, `node --test scripts/secrets/secretScan.test.ts` needs
  gitleaks 8.30.1 on the PATH or in `GITLEAKS`.
- Build each planted value from parts, so this folder has no line that
  the scan finds.
- `mergePrefix.ts` fails a PR that adds or changes a file under a
  top-level `b/` folder: the exception paths also match `b/<path>`, the
  name gitleaks gives a merge conflict hunk's file.
