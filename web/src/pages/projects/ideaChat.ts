// "Chat about this idea" (NCC-132 AC2): the first prompt of a chat that
// Quick chat's start (liveQuickChat.ts) opens in the project's place. The
// chat starts in `<chat root>/projects/<slug>` and the brain is
// `<chat root>/engine`, as the server's project shim writes it
// (`@../../engine/projects/<slug>/AGENTS.md`), so the prompt names the record
// from there. The record's file goes only into this prompt's text, never
// into a URL, a log or an error (contract/src/AGENTS.md).
import type { IdeaPage } from './types.ts'

/** The prompt that names the idea's record; with no file it names the ideas folder and the idea's ID. */
export function ideaPrompt(slug: string, idea: IdeaPage): string {
  const folder = `../../engine/projects/${slug}`
  const record =
    idea.file === null
      ? `Its record is in ${folder}/ideas/, with \`id: ${idea.row.id}\` in its front matter.`
      : `Its record is ${folder}/${idea.file}.`
  return `Let's talk about the idea "${idea.row.title}". ${record} Read it first, then ask me what I want to do with it.`
}
