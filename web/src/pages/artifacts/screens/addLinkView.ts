// What Add a link sends, from the form and what the owner typed (the live
// library): the link with `https://` when he typed none, the source read
// from the link (a claude.ai artifact link is a Claude artifact, any other
// web address a Codex site) unless he picked one, the title trimmed and the
// project, null for Not in a project. Pure; tested in addLinkView.test.ts.
import type { AddLinkEntry } from '../blocks/AddLinkFields.tsx'
import { type AddLinkForm, type AddLinkInput, type ArtifactsUi, noProject } from '../types.ts'

const claudeLink = /^(?:https:\/\/)?claude\.ai\/(?:code\/)?artifact\//

/** The source a typed link is read as: Claude for a claude.ai artifact link, else a Codex site; none when blank. */
export function sourceOfLink(text: string): AddLinkInput['source'] | undefined {
  const link = text.trim()
  if (link === '') return undefined
  return claudeLink.test(link) ? 'claude' : 'codex'
}

/** The link with its scheme: `https://` before a link typed without one. */
export const fullLink = (text: string): string => {
  const link = text.trim()
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(link) ? link : `https://${link}`
}

/** What Add sends for `form` and the owner's `ui`. */
export function addLinkInput(form: AddLinkForm, ui: ArtifactsUi): AddLinkInput {
  const link = ui.addLinkLink ?? form.link.value
  const project = ui.addLinkProject ?? form.project.value
  return {
    link: fullLink(link),
    source: ui.addLinkSource ?? sourceOfLink(link) ?? 'claude',
    title: (ui.addLinkTitle ?? form.name.value).trim(),
    project: project === noProject || project === '' ? null : project,
  }
}

/** The source the form's switch shows: the owner's pick, else the one read from the typed link, else Claude. */
export const shownSource = (form: AddLinkForm, ui: ArtifactsUi): AddLinkInput['source'] =>
  ui.addLinkSource ?? sourceOfLink(ui.addLinkLink ?? form.link.value) ?? 'claude'

/** The fields' typed link and title for the live library, each change going to `onUiChange`, and the miss's line. */
export function addLinkEntry(
  form: AddLinkForm,
  ui: ArtifactsUi,
  onUiChange: ((change: Partial<ArtifactsUi>) => void) | undefined,
  error: string | undefined,
): AddLinkEntry {
  return {
    link: ui.addLinkLink ?? form.link.value,
    title: ui.addLinkTitle ?? form.name.value,
    onLinkChange: (addLinkLink) => {
      onUiChange?.({ addLinkLink })
    },
    onTitleChange: (addLinkTitle) => {
      onUiChange?.({ addLinkTitle })
    },
    error,
  }
}
