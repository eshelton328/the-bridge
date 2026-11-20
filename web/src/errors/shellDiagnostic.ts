// AppShell's run-time diagnostics (audit L-8, library beta.91): a page
// mistake the shell can see only on a device, such as a focused field
// that does not dock on the keyboard. Every AppShell passes
// reportShellDiagnostic, one function for the app's life, so a swapped
// callback never gets a report of its own (library #286).
import type { AppShellDiagnostic } from '@eshelton328/component-library-1701'
import { AppError } from './appError.ts'
import { report } from './reporter.ts'

/** A diagnostic of AppShell as an error; `code` says which mistake. */
export class ShellDiagnosticError extends AppError {
  readonly code: AppShellDiagnostic['code']

  constructor(diagnostic: AppShellDiagnostic) {
    super('bug', diagnostic.message)
    this.name = 'ShellDiagnosticError'
    this.code = diagnostic.code
  }
}

/** AppShell's `onDiagnostic`: sends the diagnostic to report() with the source `shell`. */
export function reportShellDiagnostic(diagnostic: AppShellDiagnostic): void {
  report(new ShellDiagnosticError(diagnostic), 'shell')
}
