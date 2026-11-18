import { describe, expect, it } from 'vitest'
import { appliedView, discussionEntries, proposalEffect } from './screens/discussionView.ts'
import { artifactsStates } from './states/index.ts'
import type { ArtifactDetail, ArtifactDiscussion } from './types.ts'

const discussionOf = (d: ArtifactDiscussion | undefined): ArtifactDiscussion => {
  if (d === undefined) throw new Error('the state has no discussion')
  return d
}
const artifactOf = (a: ArtifactDetail | undefined): ArtifactDetail => {
  if (a === undefined) throw new Error('the state has no open artifact')
  return a
}
const proposed = discussionOf(artifactsStates.changeProposed.data.discussion)
const types = (ui: Parameters<typeof discussionEntries>[1]) => discussionEntries(proposed, ui).map((e) => e.type)

describe('discussionEntries', () => {
  it('shows the question, the reply and the proposal (D8)', () => {
    expect(types({})).toEqual(['user', 'reply', 'proposal'])
  })

  it('keeps an applied proposal and drops a discarded one', () => {
    expect(types({ discussProposal: 'applied' })).toEqual(['user', 'reply', 'proposal'])
    expect(types({ discussProposal: 'discarded' })).toEqual(['user', 'reply'])
  })

  it('puts the messages Erik sent after the entries', () => {
    expect(discussionEntries(proposed, { discussSent: ['And a legend?'] }).at(-1)).toEqual({
      type: 'user',
      text: 'And a legend?',
    })
  })

  it('shows nothing before the first message (D7)', () => {
    expect(discussionEntries(discussionOf(artifactsStates.discussOpen.data.discussion), {})).toEqual([])
  })
})

describe('proposalEffect', () => {
  it('records Apply and Discard', () => {
    expect(proposalEffect(proposed, 'apply')).toEqual({ discussProposal: 'applied' })
    expect(proposalEffect(proposed, 'discard')).toEqual({ discussProposal: 'discarded' })
  })

  it("closes the tablet's discussion page on Apply, so the artifact's page shows Updated (T5 to T2)", () => {
    const tablet = discussionOf(artifactsStates.changeProposedTablet.data.discussion)
    const effect = proposalEffect(tablet, 'apply', 'page')
    expect(effect).toEqual({ discussProposal: 'applied', discussOpen: false })
    const view = appliedView(artifactOf(artifactsStates.changeProposedTablet.data.open), tablet, effect)
    expect(view.badge).toBe('Updated')
    expect(view.artifact.updated).toBe('updated just now')
    expect(proposalEffect(tablet, 'discard', 'page')).toEqual({ discussProposal: 'discarded' })
  })

  it('puts the added lines in the reply box on Edit first', () => {
    expect(proposalEffect(proposed, 'edit')).toEqual({
      discussDraft: 'Bars sorted from the lowest pass rate to the highest\nA dashed line at the median pass rate, 71%',
    })
  })
})

describe('appliedView', () => {
  const artifact = artifactOf(artifactsStates.changeProposed.data.open)

  it('shows the artifact as it is before Apply (D8)', () => {
    const view = appliedView(artifact, proposed, {})
    expect(view.badge).toBe('New')
    expect(view.artifact.found).toBe('found 12m ago by the Artifact hook')
    expect(view.discussion?.context).toBe(48)
    expect(view.applied).toBe(false)
  })

  it('shows the artifact Updated and the proposal applied after Apply (D9)', () => {
    const view = appliedView(artifact, proposed, proposalEffect(proposed, 'apply'))
    expect(view.badge).toBe('Updated')
    expect(view.artifact.found).toBe('updated just now from the discussion')
    expect(view.artifact.updated).toBe('updated just now')
    // Apply republishes to the same link.
    expect(view.artifact.link).toBe(artifact.link)
    expect(view.discussion?.context).toBe(49)
    expect(view.applied).toBe(true)
  })

  it('changes nothing when the discussion has nothing to apply', () => {
    const view = appliedView(artifact, discussionOf(artifactsStates.discussOpen.data.discussion), {
      discussProposal: 'applied',
    })
    expect(view.badge).toBe('New')
    expect(view.applied).toBe(false)
  })
})
