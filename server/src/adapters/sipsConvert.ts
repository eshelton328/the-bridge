// Converts a HEIC photo to JPEG with macOS's own `sips` (slice W1b), so
// a chat can read it. It runs sips with an argument list, never a shell,
// and gives false when sips fails, is missing or takes over 60 s.
import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'

const timeoutMs = 60_000

export function sipsConvert(heic: string, jpeg: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('sips', ['-s', 'format', 'jpeg', heic, '--out', jpeg], { timeout: timeoutMs }, (error) => {
      if (error !== null) {
        resolve(false)
        return
      }
      stat(jpeg).then(
        (found) => {
          resolve(found.size > 0)
        },
        () => {
          resolve(false)
        },
      )
    })
  })
}
