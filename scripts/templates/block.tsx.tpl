// {{Name}}: props only. Data comes in as props; changes go out through callbacks.

export type {{Name}}Props = {
  label: string
}

export function {{Name}}({ label }: {{Name}}Props) {
  return <p>{label}</p>
}
