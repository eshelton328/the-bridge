// For crash stories and tests: throws `error` during render while
// `control.fail` is true. Set it to false, then press Retry, to see the
// boundary recover.

export type ThrowerControl = { fail: boolean }

export function Thrower({ control, error }: { control: ThrowerControl; error: Error }) {
  if (control.fail) throw error
  return <p>Recovered</p>
}
