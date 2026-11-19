// Which artifact the screen shows open, and what it shows of it. A state's
// `data.open` (D2, T2, M2 and the states after them) opens as it is, with
// its discussion. A card Erik opens from the library (`ui.openId`, a card
// on D1 or T1, a row on M1 or D2's list) opens the same way; when it is not
// the artifact `data.open` describes, its detail is built from its own card
// fields and the words the detail states already use: "found 12m ago" and
// "updated 12m ago" from the card's age (M2 and D2), and the source chip's
// "Claude artifact" or "Codex site" (D2, T2; the phone's chip keeps the
// card's "Claude", M2). Such a card has no chat that made it, so no Made in,
// no discussion, and a link only when its card has one. On a tablet or
// phone Back (`ui.artifactClosed`) closes it; the desktop has no Back.
// Pure; tested in openView.test.ts.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactCard, ArtifactDetail, ArtifactDiscussion, ArtifactsData, ArtifactsUi } from '../types.ts'

/** The source chip's label on the desktop and tablet (D2, T2 "chip · Claude artifact"; D5's source choices). */
const chipLabel: Record<ArtifactCard['source'], string> = { claude: 'Claude artifact', codex: 'Codex site' }

/** A card's detail: its own fields, in the words the detail states use, with no Made in. */
export function cardDetail(card: ArtifactCard, layout: Viewport): ArtifactDetail {
  return {
    id: card.id,
    isNew: card.isNew,
    found: `found ${card.age} ago`,
    title: card.title,
    description: card.description,
    source: card.source,
    sourceLabel: layout === 'phone' ? card.sourceLabel : chipLabel[card.source],
    project: card.project,
    updated: `updated ${card.age} ago`,
    preview: card.preview,
    ...(card.link === undefined ? {} : { link: card.link }),
  }
}

export type OpenArtifact = {
  artifact: ArtifactDetail
  /** The open artifact's discussion: the state's, for `data.open` only. */
  discussion: ArtifactDiscussion | undefined
}

/** The artifact the screen shows open at `layout`, or undefined when the library shows. */
export function openArtifact(data: ArtifactsData, ui: ArtifactsUi, layout: Viewport): OpenArtifact | undefined {
  // T2 and M2: Back closes it on a tablet or phone; the desktop keeps it beside the list (D2).
  if (layout !== 'desktop' && ui.artifactClosed === true) return undefined
  const id = ui.openId ?? data.open?.id
  if (id === undefined) return undefined
  if (data.open?.id === id) return { artifact: data.open, discussion: data.discussion }
  const card = data.groups.flatMap((group) => group.cards).find((c) => c.id === id)
  return card === undefined ? undefined : { artifact: cardDetail(card, layout), discussion: undefined }
}
