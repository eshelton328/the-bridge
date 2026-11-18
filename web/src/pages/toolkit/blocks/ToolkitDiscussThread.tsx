// The messages of an item's discussion (D5, T5, M7), 12 apart, in the
// ScrollFrame body of the desktop panel or the tablet's and phone's page.
// When a message is added, such as one Erik sent, the body scrolls to it, so
// it shows above the reply box even when the messages overflow. Props only.
import { Stack } from '@eshelton328/component-library-1701'
import { useEffect, useRef } from 'react'
import type { ToolkitDiscussEntry as Entry } from '../types.ts'
import { ToolkitDiscussEntry } from './ToolkitDiscussEntry.tsx'

export type ToolkitDiscussThreadProps = {
  entries: readonly Entry[]
  onCopy?: ((text: string) => void) | undefined
}

export function ToolkitDiscussThread({ entries, onCopy }: ToolkitDiscussThreadProps) {
  const lastRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(entries.length)
  useEffect(() => {
    // Only a message added after the first render scrolls: a state opens at the top, as Figma draws it.
    if (entries.length > shownRef.current) lastRef.current?.scrollIntoView({ block: 'nearest' })
    shownRef.current = entries.length
  }, [entries.length])
  return (
    <Stack gap="12">
      {entries.map((entry, i) => (
        <ToolkitDiscussEntry
          key={`${String(i)}:${entry.type}`}
          ref={i === entries.length - 1 ? lastRef : undefined}
          entry={entry}
          onCopy={onCopy}
        />
      ))}
    </Stack>
  )
}
