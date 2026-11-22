// The live library's writes for ArtifactsPage (liveArtifacts.ts): Add a
// link, a project pick and Remove, one at a time. Each that goes through
// reads the list again (`reload`), so the page shows the server's library;
// each that misses leaves the page as it was and shows its line: under Add a
// link's link field, or in the artifact's status line (`notice`).
// - Add: a new link (201) closes the form and shows under "Found since you
//   last looked"; a link the library had (200) closes it and opens that
//   artifact, as no error says it twice.
// - A project pick shows at once; a miss puts the artifact's own project back.
// - Remove closes the artifact on a tablet or phone; on the desktop the list
//   read drops it, and the library shows.
import { useRef, useState } from 'react'
import { addArtifact, fileArtifact, removeArtifact } from './liveArtifacts.ts'
import type { AddLinkInput, ArtifactsNotice, ArtifactsUi } from './types.ts'

export type ArtifactWrites = {
  notice: ArtifactsNotice | undefined
  onAddLink: (input: AddLinkInput) => void
  onFile: (id: string, project: string) => void
  onRemove: (id: string) => void
  /** Add a link opened again: the last Add's line goes. */
  clearAddLink: () => void
}

/** The closed form with no link and no title; a source or project the owner picked stays for the next link. */
const formCleared = { addLinkOpen: false, addLinkLink: '', addLinkTitle: '' } satisfies Partial<ArtifactsUi>

export function useArtifactWrites(
  onUiChange: (change: Partial<ArtifactsUi>) => void,
  reload: () => Promise<void>,
): ArtifactWrites {
  const [notice, setNotice] = useState<ArtifactsNotice | undefined>(undefined)
  const busyRef = useRef(false)
  const run = (work: () => Promise<void>) => {
    if (busyRef.current) return
    busyRef.current = true
    setNotice(undefined)
    void work().finally(() => {
      busyRef.current = false
    })
  }
  return {
    notice,
    onAddLink: (input) => {
      run(async () => {
        const added = await addArtifact(input)
        if (!added.ok) {
          setNotice({ at: 'addLink', text: added.error })
          return
        }
        await reload()
        onUiChange(added.value.added ? formCleared : { ...formCleared, openId: added.value.id, artifactClosed: false })
      })
    },
    onFile: (id, project) => {
      run(async () => {
        const filed = await fileArtifact(id, project)
        if (filed.ok) {
          await reload()
          return
        }
        // The pick was for this artifact; with no artifact named, the chip shows its own project again.
        onUiChange({ fileFor: '' })
        setNotice({ at: 'artifact', id, text: filed.error })
      })
    },
    onRemove: (id) => {
      run(async () => {
        const removed = await removeArtifact(id)
        if (!removed.ok) {
          setNotice({ at: 'artifact', id, text: removed.error })
          return
        }
        onUiChange({ fileOpen: false, artifactClosed: true })
        await reload()
      })
    },
    clearAddLink: () => {
      setNotice((n) => (n?.at === 'addLink' ? undefined : n))
    },
  }
}
