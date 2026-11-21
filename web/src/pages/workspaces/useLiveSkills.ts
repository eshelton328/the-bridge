// The live "/" lists of the Workspaces page (review R34), for its entry: in
// development, while the page reads live, each live Claude chat's list is
// read from the server each time it opens (liveSkills.ts, loaded when first
// used, so a build has no live code). The fixtures have none and keep their
// Figma lists.
import { useMemo } from 'react'
import { report } from '../../errors/reporter.ts'
import { createSkillLists, type SkillLists } from './blocks/skillLists.ts'

/** The page's live skill lists, or none when it shows fixtures. */
export function useLiveSkills(on: boolean): SkillLists | undefined {
  return useMemo(
    () =>
      on
        ? createSkillLists((chat, signal) =>
            import('./liveSkills.ts').then(
              (m) => m.readSkills(chat, signal),
              (error: unknown) => {
                report(error, 'handler')
                return undefined
              },
            ),
          )
        : undefined,
    [on],
  )
}
