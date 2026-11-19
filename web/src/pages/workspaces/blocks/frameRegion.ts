// Names a ScrollFrame as a region, as a `<section aria-label>` around it
// did: a frame that docks on the keyboard is the AppShell detail's own
// child (library beta.61), and ScrollFrame takes no aria props.

/** A ref for an element inside a ScrollFrame: the frame's root becomes a region named `label`. */
export function frameRegion(label: string) {
  return (el: HTMLElement | null) => {
    const root = el?.closest('.scroll-frame__root')
    if (root === null || root === undefined) return
    root.setAttribute('role', 'region')
    root.setAttribute('aria-label', label)
  }
}
