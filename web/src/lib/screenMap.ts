// A page's screen map (screen review R10): each screen of the page names
// the state that draws it on each device, so Storybook can show a screen's
// Desktop, Tablet and Phone states side by side. A screen may have only
// some devices, such as a desktop-only state (Artifacts D9) or a
// phone-only sheet (Artifacts M8). Every state belongs to exactly one
// screen; `screenMapProblems` checks that, and each page's
// `states/screens.test.ts` runs it. One state may fill several devices of
// its screen when it has a frame for each, such as Inbox `list` (T1 and
// M1): its story lays out by its width, so each column shows that
// device's layout.
import type { FigmaFrame, Viewport } from './screenState.ts'

/** The devices of a screen, in the order Storybook shows them. */
const screenDevices = ['desktop', 'tablet', 'phone'] as const satisfies readonly Viewport[]

/** The Figma frame size of each device, in CSS px: Storybook's viewport menu and the screen stories use it. */
export const frameSizes = {
  desktop: { width: 1512, height: 982 },
  tablet: { width: 756, height: 1158 },
  phone: { width: 390, height: 844 },
} as const satisfies Record<Viewport, { width: number; height: number }>

/** The iPad in landscape (Settings T3, Projects T10b): a tablet frame of a screen that sets `landscape`. */
const landscapeTabletSize = { width: 1133, height: 744 } as const

/** The frame size of `device` in `screen`: the landscape iPad for a landscape screen's tablet, else the device's. */
export function frameSizeOf(screen: Screen<string>, device: Viewport): { width: number; height: number } {
  return device === 'tablet' && screen.landscape === true ? landscapeTabletSize : frameSizes[device]
}

/** The label Storybook shows over each device's frame. */
export const deviceLabels = { desktop: 'Desktop', tablet: 'Tablet', phone: 'Phone' } as const satisfies Record<
  Viewport,
  string
>

/**
 * One screen: its name and the state id for each device it has. At least
 * one device is set.
 */
export type Screen<State extends string> = {
  readonly title: string
  /** The tablet state is an iPad in landscape, so its frame is `landscapeTabletSize`. */
  readonly landscape?: true
} & (
  | { readonly desktop: State; readonly tablet?: State; readonly phone?: State }
  | { readonly desktop?: undefined; readonly tablet: State; readonly phone?: State }
  | { readonly desktop?: undefined; readonly tablet?: undefined; readonly phone: State }
)

/** A page's screens by key, such as `{ library: { title: 'Library', desktop: 'library', … } }`. */
export type ScreenMap<State extends string> = Readonly<Record<string, Screen<State>>>

/** The state ids of one screen, desktop first. */
export function screenStates<State extends string>(screen: Screen<State>): { device: Viewport; state: State }[] {
  return screenDevices.flatMap((device) => {
    const state = screen[device]
    return state === undefined ? [] : [{ device, state }]
  })
}

/**
 * What is wrong with `map` for `states`: a state in no screen or in two, or
 * a state on a device whose Figma frames are not that device. A state on
 * several devices of one screen is right. Empty when the map is right.
 */
export function screenMapProblems<State extends string>(
  states: Readonly<Record<State, { readonly frames: readonly FigmaFrame[] }>>,
  map: ScreenMap<State>,
): string[] {
  const problems: string[] = []
  const owner = new Map<string, string>()
  for (const [key, screen] of Object.entries(map)) {
    for (const { device, state } of screenStates(screen)) {
      const first = owner.get(state)
      if (first === undefined) owner.set(state, key)
      else if (first !== key) problems.push(`${state} is in the screens ${first} and ${key}`)
      const frames = states[state].frames
      if (!frames.some((frame) => frame.viewport === device))
        problems.push(`${key}.${device} is ${state}, whose frames are ${frames.map((f) => f.viewport).join(', ')}`)
    }
  }
  for (const state of Object.keys(states)) {
    if (!owner.has(state)) problems.push(`${state} is in no screen`)
  }
  return problems
}
