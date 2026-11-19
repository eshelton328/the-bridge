// Who may call the API, as the omni server decides (omni src/remote/server.ts,
// d-111): a request through Tailscale Serve carries the viewer's identity
// in Tailscale-User-Login, and only the owner is let in. A request with no
// identity is let in only when it comes straight to localhost, with no
// proxy header: the owner's own browser on this computer.
export type Access =
  | { readonly ok: true; readonly who: string }
  | { readonly ok: false; readonly reason: 'notOwner' | 'proxiedWithoutLogin' | 'unknownHost' }

const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/** May this request call the API? `header` reads one request header by name. */
export function access(header: (name: string) => string | undefined, owner: string): Access {
  const login = header('Tailscale-User-Login')
  if (login) {
    if (login.toLowerCase() !== owner.toLowerCase()) return { ok: false, reason: 'notOwner' }
    return { ok: true, who: header('Tailscale-User-Name') ?? login }
  }
  if (header('X-Forwarded-For') || header('X-Forwarded-Host')) return { ok: false, reason: 'proxiedWithoutLogin' }
  const host = (header('Host') ?? '').replace(/:\d+$/, '').toLowerCase()
  if (localHosts.has(host)) return { ok: true, who: 'this computer' }
  return { ok: false, reason: 'unknownHost' }
}
