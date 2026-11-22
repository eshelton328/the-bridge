// The event that app/keyboardProxy.ts sends on the composer's field when its proxy takes the focus for it (detail
// true) and when the proxy goes without giving the field the focus (detail false). The composer expands at the tap,
// as on its own focus (R31), so the later hand-off of the focus changes no layout (R37). It bubbles, so the composer's
// wrapper hears it (ChatPane.tsx).
export const KEYBOARD_PROXY_EVENT = 'bridge-keyboard-proxy'
