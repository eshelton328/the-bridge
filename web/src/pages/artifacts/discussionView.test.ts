import { describe, expect, it } from 'vitest'
import { discussionEntries, proposalEffect } from './screens/discussionView.ts'
import { artifactsStates } from './states/index.ts'
import type { ArtifactDiscussion } from './types.ts'

const discussionOf = (d: ArtifactDiscussion | undefined): ArtifactDiscussion => {
  if (d === undefined) throw new Error('the state has no discussion')
  return d
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

  it('puts the added lines in the reply box on Edit first', () => {
    expect(proposalEffect(proposed, 'edit')).toEqual({
      discussDraft: 'Bars sorted from the lowest pass rate to the highest\nA dashed line at the median pass rate, 71%',
    })
  })
})
