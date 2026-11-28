// The brain's writes of the Projects app (f-008, increment four). Each write goes only into the files that the spec
// names, follows no symlink, and is committed by path with only those paths; one write runs at a time. A name or a
// purpose goes only to the project-setup helper, never into a commit message, a log or an ErrorBody.
import type { ProjectIcon, ProjectSlug } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** `busy`: another git command runs in the brain, or its index is locked; the caller tries again. */
export type BrainWriteFault = { readonly reason: 'busy' } | { readonly reason: 'failed'; readonly code: string }

export type NewProject = {
  readonly slug: ProjectSlug
  readonly name: string
  /** The description; empty when the owner gave none. */
  readonly purpose: string
  readonly icon: ProjectIcon | null
}

export type BrainWrites = {
  /** True when the brain or the chat root has an entry of this name in its `projects` folder. */
  taken(slug: ProjectSlug): Promise<Result<boolean, BrainWriteFault>>
  /**
   * Makes the brain home with the helper's `init` and the chat-root folder `projects/<slug>/` with its `CLAUDE.md`,
   * then commits the brain paths; `taken` when either folder is there, with nothing written.
   */
  createProject(project: NewProject): Promise<Result<'created' | 'taken', BrainWriteFault>>
}

/** The text of `project_shim` in the brain's `toolkit/layout/ncc`, which `ncc check` asks for in each project folder. */
export const projectShim = (slug: ProjectSlug) => `@../../engine/projects/${slug}/AGENTS.md\n`
