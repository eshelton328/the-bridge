import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { toolkitStates } from '../states/index.ts'
import { css } from '../../../../styled-system/css/index.js'
import { viewportForWidth } from '../../../lib/viewport.ts'
import { ToolkitScreen } from './ToolkitScreen.tsx'

// One story per Figma state of the Toolkit, named after its state file
// (scripts/checkStates.ts checks it). Each play test checks the state's
// own text, so a story that renders the wrong state fails.
const meta = {
  title: 'Pages/Toolkit/States',
  component: ToolkitScreen,
} satisfies Meta<typeof ToolkitScreen>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The layout the story takes at its canvas's width: a state with a tablet and a phone frame has one story, and a
 * play checks what the frame of that layout shows.
 */
function layoutOf(canvasElement: HTMLElement) {
  return viewportForWidth(canvasElement.clientWidth)
}

export const ToolkitList: Story = {
  name: 'D1: the list of every toolkit item',
  args: { data: toolkitStates.toolkitList.data, ui: toolkitStates.toolkitList.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /All/ })).toBeChecked()
    await expect(canvas.getByRole('heading', { name: 'agents-md' })).toBeVisible()
    await expect(canvas.getByText('agents/pr-description-checker.md')).toBeVisible()
    await expect(canvas.getByText('Read from toolkit/ in the brain')).toBeVisible()
  },
}

export const ToolkitListTablet: Story = {
  name: 'T1: the list of every toolkit item, in two columns',
  args: { data: toolkitStates.toolkitListTablet.data, ui: toolkitStates.toolkitListTablet.ui, viewport: 'tablet' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit' })).toBeVisible()
    if (layoutOf(canvasElement) === 'phone') {
      // M1: one column of rows, each the item's name over its path; the Rules group lies below the frame.
      await expect(canvas.getByText('skills/agents-md/')).toBeVisible()
      await expect(canvas.getByText('commits-and-prs')).toBeVisible()
    } else {
      await expect(canvas.getByRole('heading', { name: 'commits-and-prs' })).toBeVisible()
    }
    await expect(canvas.getByText('rules/writing.md')).toBeVisible()
  },
}

export const MoreDrawer: Story = {
  name: 'M4: the More drawer over the tab bar, with Toolkit after Artifacts',
  args: { data: toolkitStates.moreDrawer.data, ui: toolkitStates.moreDrawer.ui, viewport: 'phone' },
  play: async () => {
    // The drawer renders in a portal, outside the story's canvas.
    const drawer = await within(document.body).findByRole('dialog', { name: 'More' })
    await expect(within(drawer).getByText('Agents, skills, workflows, rules and hooks')).toBeVisible()
    await expect(within(drawer).getByRole('button', { name: /Toolkit/ })).toHaveAttribute('aria-current', 'page')
    await expect(within(drawer).getByRole('button', { name: /Brain/ })).toBeDisabled()
    await expect(within(drawer).getByText('Later')).toBeVisible()
  },
}

export const ToolkitMap: Story = {
  name: 'D2: the map, with writer selected and its links lit',
  args: { data: toolkitStates.toolkitMap.data, ui: toolkitStates.toolkitMap.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: /Map/ })).toBeChecked()
    await expect(canvas.getByText('A line means one file links to another')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /writer/, pressed: true })).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'writer' })).toHaveTextContent('→ links to 7')
    await expect(canvas.getByRole('button', { name: 'Open writer' })).toBeVisible()
  },
}

export const ToolkitMapTablet: Story = {
  name: 'T2: the map on a tablet, with writer selected in the bar at its foot',
  args: { data: toolkitStates.toolkitMapTablet.data, ui: toolkitStates.toolkitMapTablet.ui, viewport: 'tablet' },
  play: async ({ canvas }) => {
    // On the phone the minimap (aria-hidden) draws the headings again; the play checks the map's own heading.
    await expect(canvas.getByText('Rules, hooks', { ignore: 'script, style, [data-minimap] *' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /writer/, pressed: true })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Open writer' })).toBeVisible()
  },
}

export const SkillOpen: Story = {
  name: 'D3: a skill open beside the list',
  args: { data: toolkitStates.skillOpen.data, ui: toolkitStates.skillOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('toolkit/skills/writer/')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Copy toolkit/skills/writer/' })).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 1, name: 'writer' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    // The skill writer's row in the list is the open one; the agent writer's is not.
    await expect(canvas.getByRole('button', { name: 'writer', current: true })).toBeVisible()
  },
}

export const RuleOpen: Story = {
  name: 'D4: a rule open beside the list',
  args: { data: toolkitStates.ruleOpen.data, ui: toolkitStates.ruleOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByText('toolkit/rules/skills.md')).toBeVisible()
    await expect(within(item).getByText('Loads when')).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 2, name: 'Layout' })).toBeVisible()
    // The rule's row in the list is the open one; the list adds the Hooks group.
    await expect(canvas.getByRole('button', { name: 'skills', current: true })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: /Hooks/ })).toBeInTheDocument()
  },
}

export const AgentOpen: Story = {
  name: 'D7: an agent open beside the list',
  args: { data: toolkitStates.agentOpen.data, ui: toolkitStates.agentOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByText('toolkit/agents/writing-reviewer.md')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('opus')).toBeVisible()
    await expect(within(runs).getByText('codex_effort; default model')).toBeVisible()
    await expect(within(runs).getByText('Bash, Read, Grep, Glob')).toBeVisible()
    await expect(within(item).getByText('137 lines · the prompt')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 1, name: 'Prompt' })).toBeVisible()
    // The agent's row is the open one, and the Skills group is closed.
    await expect(canvas.getByRole('button', { name: 'writing-reviewer', current: true })).toBeVisible()
    await expect(canvas.queryByText('skills/writer/')).toBeNull()
  },
}

export const HookOpen: Story = {
  name: 'D9: a hook open beside the list',
  args: { data: toolkitStates.hookOpen.data, ui: toolkitStates.hookOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByText('toolkit/hooks/commit-msg')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('git runs it on every commit')).toBeVisible()
    await expect(within(runs).getByText('Enabled')).toBeVisible()
    await expect(within(runs).getByText('core.hooksPath = toolkit/hooks, set by link.sh')).toBeVisible()
    await expect(within(runs).getByText('test-commit-msg')).toBeVisible()
    // The preview is code, not markdown: the script's lines, with no rendered title.
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
    await expect(within(item).getByText('#!/usr/bin/env bash')).toBeVisible()
    await expect(within(item).getByText('MAX=72')).toBeVisible()
    await expect(within(item).queryByRole('heading', { level: 1 })).toBeNull()
    await expect(within(item).getByText('97 lines')).toBeVisible()
    // The hook's row is the open one, and the list shows no Skills group.
    await expect(canvas.getByRole('button', { name: 'commit-msg', current: true })).toBeInTheDocument()
    await expect(canvas.queryByText('skills/writer/')).toBeNull()
  },
}

export const WorkflowOpen: Story = {
  name: 'D8: a workflow open beside the list, with its steps by phase',
  args: { data: toolkitStates.workflowOpen.data, ui: toolkitStates.workflowOpen.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByText('toolkit/workflows/skill-eval-round.md')).toBeVisible()
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByRole('heading', { name: 'Grade · in parallel' })).toBeVisible()
    await expect(within(flow).getByRole('heading', { name: 'Pre-registered?' })).toBeVisible()
    await expect(within(flow).getByRole('heading', { name: 'Owner decides' })).toBeVisible()
    await expect(within(flow).getByText('hides which runs had the skill')).toBeVisible()
    await expect(within(flow).getByText('new failure')).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'Open full page' })).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
    await expect(within(item).getByText('Gates in amber; G1 and G6 run after step 1.')).toBeVisible()
    await expect(within(item).getByRole('heading', { level: 2, name: 'Purpose and trigger' })).toBeVisible()
    // The workflow's row is the open one.
    await expect(canvas.getByRole('button', { name: 'skill-eval-round', current: true })).toBeVisible()
  },
}

export const SkillOpenTablet: Story = {
  name: 'T3: a skill open on a tablet, in place of the list',
  args: { data: toolkitStates.skillOpenTablet.data, ui: toolkitStates.skillOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('5 cases · open the Evals tab')).toBeVisible()
  },
}

export const SkillOpenPhone: Story = {
  name: 'M2: a skill open on the phone, in place of the list',
  args: { data: toolkitStates.skillOpenPhone.data, ui: toolkitStates.skillOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back, with icon buttons. The play
  // test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'SKILL.md' })).toBeVisible()
  },
}

export const RuleOpenTablet: Story = {
  name: 'T17: a rule open on a tablet, in place of the list',
  args: { data: toolkitStates.ruleOpenTablet.data, ui: toolkitStates.ruleOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the rule in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'rules/skills.md' })).toBeVisible()
  },
}

export const RuleOpenPhone: Story = {
  name: 'M19: a rule open on the phone, in place of the list',
  args: { data: toolkitStates.ruleOpenPhone.data, ui: toolkitStates.ruleOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the rule under Back, with icon buttons. The play
  // test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skills' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(within(item).getByText('a file under toolkit/skills/** or skills/** changes')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'rules/skills.md' })).toBeVisible()
  },
}

export const HookOpenTablet: Story = {
  name: 'T19: a hook open on a tablet, in place of the list',
  args: { data: toolkitStates.hookOpenTablet.data, ui: toolkitStates.hookOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the hook in place of the list, under Back.
  // The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the tablet's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('core.hooksPath = toolkit/hooks, set by link.sh')).toBeVisible()
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
    await expect(within(item).getByText('MAX=72')).toBeVisible()
    await expect(within(item).getByText('97 lines')).toBeVisible()
  },
}

export const HookOpenPhone: Story = {
  name: 'M22: a hook open on the phone, in place of the list',
  args: { data: toolkitStates.hookOpenPhone.data, ui: toolkitStates.hookOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the hook under Back, with icon buttons and its
  // When it runs cards two by two. The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx
  // checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'commit-msg' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'When it runs' })
    await expect(within(runs).getByText('test-commit-msg')).toBeVisible()
    await expect(within(item).getByText('bash · 142 lines')).toBeVisible()
  },
}

export const AgentOpenTablet: Story = {
  name: 'T7: an agent open on a tablet, from the links of a skill',
  args: { data: toolkitStates.agentOpenTablet.data, ui: toolkitStates.agentOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the breadcrumb Toolkit › writer ›
  // writing-reviewer in the back row. The play test checks what every width shows.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('gets only what the task hands it')).toBeVisible()
    await expect(within(item).getByText('137 lines · the prompt')).toBeVisible()
  },
}

export const AgentOpenPhone: Story = {
  name: 'M20: an agent open on the phone, its facts in two columns',
  args: { data: toolkitStates.agentOpenPhone.data, ui: toolkitStates.agentOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the How it runs cards in two columns under
  // Back. The play test checks what every width shows; src/app/ToolkitStickyBack.test.tsx checks the phone's Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'writing-reviewer' })).toBeVisible()
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const runs = within(item).getByRole('region', { name: 'How it runs' })
    await expect(within(runs).getByText('codex_effort; default model')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
  },
}

export const WorkflowOpenTablet: Story = {
  name: 'T18: a workflow open on a tablet, with its steps by phase drawn smaller',
  args: { data: toolkitStates.workflowOpenTablet.data, ui: toolkitStates.workflowOpenTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the smaller flow under Back. The play test
  // checks what every width shows.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByText('hides which runs had the skill')).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
  },
}

export const WorkflowOpenPhone: Story = {
  name: 'M21: a workflow open on the phone, its steps left to How it works',
  args: { data: toolkitStates.workflowOpenPhone.data, ui: toolkitStates.workflowOpenPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the workflow under Back with no flow, and the
  // line that sends the reader to How it works. The play test checks what every width shows;
  // src/app/ToolkitStickyBack.test.tsx checks the phone's rows and Back.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('heading', { level: 2, name: 'skill-eval-round' })).toBeVisible()
    await expect(within(item).getByText('toolkit/workflows/skill-eval-round.md')).toBeVisible()
    const flow = within(item).getByRole('region', { name: 'Steps · from the Mermaid flow in the file' })
    await expect(within(flow).getByRole('button', { name: 'Open full page' })).toBeVisible()
    await expect(within(flow).getByRole('button', { name: 'eval-grader' })).toBeVisible()
  },
}

export const SkillHowItWorks: Story = {
  name: 'D14: a skill open beside the list, on How it works',
  args: { data: toolkitStates.skillHowItWorks.data, ui: toolkitStates.skillHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'Draft the point first' })).toBeVisible()
    await expect(within(steps).getByText('until no fail')).toBeVisible()
    await expect(within(steps).getByText('writing-reviewer')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'A chat answer takes a shorter path' })).toBeVisible()
    await expect(within(item).getByText('--form chat --ste')).toBeVisible()
    // Only the selected tab's panel is drawn: the Overview's side column is not there.
    await expect(within(item).queryByText('Used in workflows')).toBeNull()
  },
}

export const RuleHowItWorks: Story = {
  name: 'D37: a rule open beside the list, on How it works',
  args: { data: toolkitStates.ruleHowItWorks.data, ui: toolkitStates.ruleHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'link.sh links it' })).toBeVisible()
    await expect(within(steps).getByText('paths:')).toBeVisible()
    // What Codex does instead takes the chat path's place.
    await expect(within(item).getByText('In Codex')).toBeVisible()
    await expect(
      within(item).getByText('Codex has no scoped rules, so skills/AGENTS.md tells the agent to read this rule.'),
    ).toBeVisible()
    // The rule's Overview is not drawn: no load box.
    await expect(within(item).queryByText('Loads when')).toBeNull()
  },
}

export const AgentHowItWorks: Story = {
  name: 'D38: an agent open beside the list, on How it works',
  args: { data: toolkitStates.agentHowItWorks.data, ui: toolkitStates.agentHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByRole('heading', { name: 'Grade W1 to W7' })).toBeVisible()
    await expect(within(steps).getByText('ls, grep, git ls-files')).toBeVisible()
    // The only inputs it gets take the chat path's place.
    await expect(within(item).getByText('It gets only')).toBeVisible()
    // The agent's Overview is not drawn: no How it runs cards.
    await expect(within(item).queryByText('How it runs')).toBeNull()
  },
}

export const HookHowItWorks: Story = {
  name: 'D39: a hook open beside the list, on How it works',
  args: { data: toolkitStates.hookHowItWorks.data, ui: toolkitStates.hookHowItWorks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    // Five steps: the fifth starts a second row.
    await expect(within(steps).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    await expect(within(steps).getByRole('heading', { name: 'Pass or block' })).toBeVisible()
    await expect(within(steps).getByText('commits-and-prs')).toBeVisible()
    await expect(within(steps).getByText('git commit')).toBeVisible()
    // Its tests take the chat path's place.
    await expect(within(item).getByText('Tests')).toBeVisible()
    await expect(
      within(item).getByText('test-commit-msg runs 43 cases through the hook. The last run passed all 43.'),
    ).toBeVisible()
    // The hook's Overview is not drawn: no When it runs cards.
    await expect(within(item).queryByText('When it runs')).toBeNull()
  },
}

export const SkillHowItWorksTablet: Story = {
  name: 'T10: a skill open on a tablet, on How it works',
  args: {
    data: toolkitStates.skillHowItWorksTablet.data,
    ui: toolkitStates.skillHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the steps in one column under Back. The play
  // test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Who reads it and what they do next.')).toBeVisible()
    await expect(within(steps).getByText('Fix every fail; run it again after an edit.')).toBeVisible()
    await expect(within(item).getByText('Loads when a task writes text that another person reads')).toBeVisible()
  },
}

export const SkillHowItWorksPhone: Story = {
  name: 'M12: a skill open on the phone, on How it works',
  args: {
    data: toolkitStates.skillHowItWorksPhone.data,
    ui: toolkitStates.skillHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the steps in one column under Back. The play
  // test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the phone's back row, title and column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Only the draft, the form and the source paths.')).toBeVisible()
    await expect(within(item).getByText('Loads when a task writes text that another person reads')).toBeVisible()
  },
}

export const RuleHowItWorksTablet: Story = {
  name: 'T36: a rule open on a tablet, on How it works',
  args: {
    data: toolkitStates.ruleHowItWorksTablet.data,
    ui: toolkitStates.ruleHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the rule's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('The rule has paths, so link.sh links it into .claude/rules/.')).toBeVisible()
    await expect(
      within(item).getByText('Loads when a file under toolkit/skills/** or skills/** changes.'),
    ).toBeVisible()
    await expect(within(item).queryByText('In Codex')).toBeNull()
  },
}

export const AgentHowItWorksTablet: Story = {
  name: 'T37: an agent open on a tablet from a skill, on How it works',
  args: {
    data: toolkitStates.agentHowItWorksTablet.data,
    ui: toolkitStates.agentHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the agent's steps in one column under its
  // header and the breadcrumb. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx
  // checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Each fail is a lead for W1. Read the sentence to confirm it.')).toBeVisible()
    await expect(
      within(item).getByText('Starts when step 7 of the writer skill runs it, or when a task asks to review a draft.'),
    ).toBeVisible()
    await expect(within(item).queryByText('It gets only')).toBeNull()
  },
}

export const HookHowItWorksTablet: Story = {
  name: 'T38: a hook open on a tablet, on How it works',
  args: {
    data: toolkitStates.hookHowItWorksTablet.data,
    ui: toolkitStates.hookHowItWorksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the hook's five steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getAllByRole('heading', { level: 4 })).toHaveLength(5)
    await expect(within(steps).getByText('Exit 0 commits. Exit 1 prints one line for each problem.')).toBeVisible()
    await expect(within(item).getByText(/^Runs on every git commit in the brain/)).toBeVisible()
    // T38 draws nothing under the steps: no tests line.
    await expect(within(item).queryByText('Tests')).toBeNull()
  },
}

export const RuleHowItWorksPhone: Story = {
  name: 'M39: a rule open on the phone, on How it works',
  args: {
    data: toolkitStates.ruleHowItWorksPhone.data,
    ui: toolkitStates.ruleHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the rule's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Layout, description, evals and baselines apply to the skill.')).toBeVisible()
    await expect(within(item).queryByText('In Codex')).toBeNull()
  },
}

export const AgentHowItWorksPhone: Story = {
  name: 'M40: an agent open on the phone, on How it works',
  args: {
    data: toolkitStates.agentHowItWorksPhone.data,
    ui: toolkitStates.agentHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the agent's steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('PASS, FAIL or NA for each, returned as JSON.')).toBeVisible()
  },
}

export const HookHowItWorksPhone: Story = {
  name: 'M41: a hook open on the phone, on How it works',
  args: {
    data: toolkitStates.hookHowItWorksPhone.data,
    ui: toolkitStates.hookHowItWorksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the hook's five steps in one column under its
  // header. The play test checks what every width shows; src/app/ToolkitHowItWorks.test.tsx checks the column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'How it works' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('changed 6 days ago')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show on map' })).toBeVisible()
    const steps = within(item).getByRole('list', { name: 'Steps' })
    await expect(within(steps).getByText('Exit 0 commits. Exit 1 prints one line for each problem.')).toBeVisible()
    await expect(within(item).queryByText('Tests')).toBeNull()
  },
}

export const WorkflowFullPage: Story = {
  name: 'D13: a workflow on a page of its own, with its flow and step 4 selected',
  args: { data: toolkitStates.workflowFullPage.data, ui: toolkitStates.workflowFullPage.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Workflows')
    await expect(within(item).getByText('changed 6 days ago · run by hand')).toBeVisible()
    await expect(
      within(item).getByRole('heading', { name: 'Steps · from the Mermaid flow and the steps table' }),
    ).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeVisible()
    await expect(within(item).getByRole('heading', { name: 'Step 4 · Primary grades' })).toBeVisible()
    await expect(within(item).getByText('grade.py <round> <skill> primary')).toBeVisible()
    await expect(within(item).getByText('stop: run skill-eval-cases')).toBeVisible()
    await expect(within(item).getByText('writer · round 6')).toBeVisible()
    // The page has no list beside it.
    await expect(canvas.queryByRole('button', { name: 'agents-md' })).toBeNull()
  },
}

export const WorkflowFullPageTablet: Story = {
  name: 'T08: a workflow on a page of its own on a tablet, its flow as a column of steps',
  args: {
    data: toolkitStates.workflowFullPageTablet.data,
    ui: toolkitStates.workflowFullPageTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the steps in one column under the breadcrumb.
  // The play test checks what every width shows; src/app/ToolkitWorkflowPage.test.tsx checks the tablet's column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(canvas.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Workflows')
    await expect(within(item).getByRole('button', { name: 'Pre-registered in the ledger?' })).toBeVisible()
    await expect(within(item).getByText('Each case, model and repeat. Then G1 and G6.')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeVisible()
    await expect(within(item).getByText('one more try for each group, then by hand')).toBeInTheDocument()
    // T8 has no stop box and no hint on the step's panel.
    await expect(within(item).queryByText('stop: run skill-eval-cases')).toBeNull()
    await expect(within(item).queryByText('select a step to see it')).toBeNull()
  },
}

export const WorkflowFullPagePhone: Story = {
  name: 'M09: a workflow on a page of its own on the phone, its flow as a column of steps',
  args: {
    data: toolkitStates.workflowFullPagePhone.data,
    ui: toolkitStates.workflowFullPagePhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the column under the breadcrumb Toolkit ›
  // skill-eval-round. The play test checks what every width shows; src/app/ToolkitWorkflowPage.test.tsx checks the
  // phone's breadcrumb, meta row and column.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByText('Hides which runs had the skill.')).toBeVisible()
    await expect(within(item).getByText('Own family, 20 runs or more.')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Blinding' })).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Primary grades', pressed: true })).toBeInTheDocument()
  },
}

export const SkillFiles: Story = {
  name: 'D6: a skill open beside the list, on Files',
  args: { data: toolkitStates.skillFiles.data, ui: toolkitStates.skillFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByText('Read on demand')).toBeVisible()
    await expect(within(tree).getByText('chat-sourced-first-person/')).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /check/, selected: true })).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'scripts/check' })
    await expect(within(viewer).getByText('Python · 437 lines · run, not read')).toBeVisible()
    await expect(within(viewer).getByText('Step 6 of SKILL.md runs this script on the draft.')).toBeVisible()
    // Only the selected tab's panel is drawn: the Overview's side column is not there.
    await expect(within(item).queryByText('Used in workflows')).toBeNull()
  },
}

export const ScriptExplained: Story = {
  name: 'D10: a skill’s script explained, on Files',
  args: { data: toolkitStates.scriptExplained.data, ui: toolkitStates.scriptExplained.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    const viewer = within(item).getByRole('region', { name: 'scripts/check' })
    // A script with an explanation opens on Explain: the overview, the walkthrough and who wrote it.
    await expect(within(viewer).getByRole('radio', { name: 'Explain' })).toBeChecked()
    await expect(within(viewer).getByText('437 lines')).toBeVisible()
    await expect(within(viewer).getByText('0 pass · 1 a rule fails · 2 bad input')).toBeVisible()
    await expect(within(viewer).getByText('Exit 1 if any file has a fail. Otherwise exit 0.')).toBeVisible()
    await expect(within(viewer).getByText(/^Written by Claude from this version of the file/)).toBeVisible()
    await expect(within(viewer).queryByText('#!/usr/bin/env python3')).toBeNull()
    // Each step links to its line; the play test does not press one, so the render stays on Explain (the fidelity
    // check draws the story after its play). src/app/ToolkitFiles.test.tsx presses the switch and the links.
    await expect(within(viewer).getByRole('button', { name: 'line 433' })).toBeVisible()
  },
}

export const RuleFiles: Story = {
  name: 'D33: a rule open beside the list, on Files',
  args: { data: toolkitStates.ruleFiles.data, ui: toolkitStates.ruleFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // A rule is one file: the tree has its one row, selected, with what it is.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByRole('treeitem', { name: /skills\.md/, selected: true })).toBeVisible()
    await expect(
      within(tree).getByText('The rule. Claude Code loads it by the paths in its frontmatter.'),
    ).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'skills.md' })
    await expect(within(viewer).getByText('Markdown · 104 lines · the rule')).toBeVisible()
    // The file's first lines as written: the paths frontmatter, then the rule's text.
    await expect(within(viewer).getByText(/^\s*- "toolkit\/skills\/\*\*"$/)).toBeVisible()
    await expect(
      within(viewer).getByText('Loads when a file under toolkit/skills/** or skills/** changes.'),
    ).toBeVisible()
  },
}

export const AgentFiles: Story = {
  name: 'D34: an agent open beside the list, on Files',
  args: { data: toolkitStates.agentFiles.data, ui: toolkitStates.agentFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // An agent is one file, its prompt: the tree has its one row, selected, with what it is.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByRole('treeitem', { name: /writing-reviewer\.md/, selected: true })).toBeVisible()
    await expect(within(tree).getByText('The prompt. Its model and tools are in the frontmatter.')).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'writing-reviewer.md' })
    await expect(within(viewer).getByText('Markdown · 137 lines · the prompt')).toBeVisible()
    // The frontmatter holds the model and the tools.
    await expect(within(viewer).getByText('model: opus')).toBeVisible()
    await expect(within(viewer).getByText('tools: Bash, Read, Grep, Glob')).toBeVisible()
    await expect(
      within(viewer).getByText(
        'Step 7 of the writer skill starts this agent with the draft, the form and the sources.',
      ),
    ).toBeVisible()
  },
}

export const WorkflowFiles: Story = {
  name: 'D35: a workflow open beside the list, on Files',
  args: { data: toolkitStates.workflowFiles.data, ui: toolkitStates.workflowFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The workflow is one design doc, selected; the harness scripts its steps run are outside the toolkit.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByRole('treeitem', { name: /skill-eval-round\.md/, selected: true })).toBeVisible()
    await expect(within(tree).getByText('Design doc, run by hand. No script yet.')).toBeVisible()
    await expect(
      within(tree).getByText('Outside the toolkit, in projects/skill-evals/. One script for each step.'),
    ).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /^aggregate\.py/ })).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'skill-eval-round.md' })
    await expect(within(viewer).getByText('Markdown · 93 lines · design doc')).toBeVisible()
    await expect(within(viewer).getByText('The steps table names the harness script for each step.')).toBeVisible()
  },
}

export const HookFiles: Story = {
  name: 'D36: a hook open beside the list, on Files',
  args: { data: toolkitStates.hookFiles.data, ui: toolkitStates.hookFiles.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // A hook is the script and its tests; the tests are selected.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(2)
    await expect(within(tree).getByText('The hook. Git runs it on every commit.')).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /^test-commit-msg/, selected: true })).toBeVisible()
    const viewer = within(item).getByRole('region', { name: 'test-commit-msg' })
    await expect(within(viewer).getByText('bash · 97 lines · run, not read')).toBeVisible()
    await expect(within(viewer).getByText('Last run on Nov 14: 43 of 43 pass.')).toBeVisible()
  },
}

export const SkillFilesTablet: Story = {
  name: 'T4: a skill’s files on a tablet, a doc rendered under the tree',
  args: { data: toolkitStates.skillFilesTablet.data, ui: toolkitStates.skillFilesTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the viewer under the tree, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const viewer = within(item).getByRole('region', { name: 'references/doc.md' })
    // A Markdown file opens rendered, with the Rendered and Source switch under its text.
    await expect(within(viewer).getByText('56 lines · read on demand')).toBeVisible()
    await expect(within(viewer).getByRole('heading', { name: 'Docs' })).toBeVisible()
    await expect(within(viewer).getByRole('radio', { name: 'Rendered' })).toBeChecked()
    await expect(within(viewer).getByRole('radio', { name: 'Source' })).not.toBeChecked()
  },
}

export const ScriptExplainedTablet: Story = {
  name: 'T6: a skill’s script explained on a tablet, on a page of its own',
  args: {
    data: toolkitStates.scriptExplainedTablet.data,
    ui: toolkitStates.scriptExplainedTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the script on a page of its own, under Back to
  // Files. The play test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's page.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The script opens on Explain: its language and length, the overview, the walkthrough and who wrote it.
    await expect(within(item).getByRole('radio', { name: 'Explain' })).toBeChecked()
    await expect(within(item).getByText('Python · 437 lines')).toBeVisible()
    await expect(within(item).getByText('0 pass · 1 a rule fails · 2 bad input')).toBeVisible()
    await expect(within(item).getByText(/^Written by Claude from this version of the file/)).toBeVisible()
    await expect(within(item).queryByText('Step 6 of SKILL.md runs this script on the draft.')).toBeNull()
    await expect(within(item).getByRole('button', { name: 'line 433' })).toBeVisible()
  },
}

export const RuleFilesTablet: Story = {
  name: 'T32: a rule’s files on a tablet, the rule rendered under the tree',
  args: { data: toolkitStates.ruleFilesTablet.data, ui: toolkitStates.ruleFilesTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the viewer under the tree, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(
      within(tree).getByText('The rule. Claude Code loads it by the paths in its frontmatter. 104 lines.'),
    ).toBeVisible()
    // The rule opens rendered, with the Rendered and Source switch under its text.
    const viewer = within(item).getByRole('region', { name: 'skills.md' })
    await expect(within(viewer).getByRole('heading', { name: 'Skills' })).toBeVisible()
    await expect(within(viewer).getByRole('radio', { name: 'Rendered' })).toBeChecked()
  },
}

export const AgentFilesTablet: Story = {
  name: 'T33: an agent’s files on a tablet, from the links of a skill',
  args: { data: toolkitStates.agentFilesTablet.data, ui: toolkitStates.agentFilesTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the viewer under the tree, under the
  // breadcrumb. The play test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(
      within(tree).getByText('The prompt. Its model and tools are in the frontmatter. 137 lines.'),
    ).toBeVisible()
    // The prompt opens rendered, with the Rendered and Source switch under its text.
    const viewer = within(item).getByRole('region', { name: 'writing-reviewer.md' })
    await expect(
      within(viewer).getByText('You review one draft for a reader who has none of its author’s context.'),
    ).toBeVisible()
    await expect(within(viewer).getByRole('radio', { name: 'Rendered' })).toBeChecked()
  },
}

export const WorkflowFilesTablet: Story = {
  name: 'T34: a workflow’s files on a tablet, the design doc rendered under the tree',
  args: { data: toolkitStates.workflowFilesTablet.data, ui: toolkitStates.workflowFilesTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the viewer under the tree, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByText('Design doc, run by hand. No script yet. 93 lines.')).toBeVisible()
    await expect(within(tree).getByText('156 lines')).toBeVisible()
    // The design doc opens rendered, with the Rendered and Source switch under its text.
    const viewer = within(item).getByRole('region', { name: 'skill-eval-round.md' })
    await expect(within(viewer).getByRole('heading', { name: 'skill-eval-round' })).toBeVisible()
    await expect(within(viewer).getByRole('radio', { name: 'Rendered' })).toBeChecked()
  },
}

export const HookFilesTablet: Story = {
  name: 'T35: a hook’s files on a tablet, its tests summed up under the tree',
  args: { data: toolkitStates.hookFilesTablet.data, ui: toolkitStates.hookFilesTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the viewer under the tree, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByText('The hook. Git runs it on every commit. 142 lines.')).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /^test-commit-msg/, selected: true })).toBeVisible()
    // The tests are summed up rendered, with no Rendered and Source switch.
    const viewer = within(item).getByRole('region', { name: 'test-commit-msg' })
    await expect(within(viewer).getByRole('heading', { name: 'test-commit-msg' })).toBeVisible()
    await expect(within(viewer).queryByRole('radio', { name: 'Source' })).toBeNull()
  },
}

export const SkillFilesPhone: Story = {
  name: 'M5: a skill’s files on the phone, the tree with a file per row',
  args: { data: toolkitStates.skillFilesPhone.data, ui: toolkitStates.skillFilesPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the tree with no viewer, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The phone's shorter role lines, only scripts/ open, and check marked with its count in lines.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getByText('When to use, steps, rules')).toBeVisible()
    await expect(within(tree).getByText('Never loaded into a session')).toBeVisible()
    await expect(within(tree).getByRole('treeitem', { name: /^check/, selected: true })).toBeVisible()
    await expect(within(tree).getByText('437 lines')).toBeVisible()
    await expect(within(tree).queryByRole('treeitem', { name: /^doc\.md/ })).toBeNull()
  },
}

export const ScriptCodePhone: Story = {
  name: 'M6: a skill’s script on the phone, on a page of its own, on Code',
  args: { data: toolkitStates.scriptCodePhone.data, ui: toolkitStates.scriptCodePhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the script on a page of its own, under Back to
  // Files. The play test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's page.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The script opens on Code: the phone's source, as Figma numbers its lines, and what runs it.
    await expect(within(item).getByRole('radio', { name: 'Code' })).toBeChecked()
    await expect(within(item).getByText('draft against toolkit/rules/writing.md.')).toBeVisible()
    await expect(within(item).getByText(/Step 6 of SKILL\.md runs this script\.$/)).toBeVisible()
  },
}

export const ScriptExplainedPhone: Story = {
  name: 'M8: a skill’s script explained on the phone, on a page of its own',
  args: { data: toolkitStates.scriptExplainedPhone.data, ui: toolkitStates.scriptExplainedPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the explanation with no box, under Back to
  // Files. The play test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's page.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The script opens on Explain, with the phone's meta line: the overview and each step's line link.
    await expect(within(item).getByRole('radio', { name: 'Explain' })).toBeChecked()
    await expect(within(item).getByText('Python · 437 lines · run, not read')).toBeVisible()
    await expect(within(item).getByText('one JSON line for each file')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'line 406' })).toBeVisible()
    await expect(within(item).queryByText('draft against toolkit/rules/writing.md.')).toBeNull()
  },
}

// The characters of `text` in `holder`'s text, as one range: the flag may sit in its own element.
function rangeOf(holder: Element, text: string): Range {
  const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) if (node instanceof Text) nodes.push(node)
  const full = nodes.map((n) => n.data).join('')
  let start = full.indexOf(text)
  if (start < 0) throw new Error(`no "${text}" in "${full}"`)
  let end = start + text.length
  const range = document.createRange()
  for (const node of nodes) {
    if (start >= 0 && start <= node.length) range.setStart(node, start)
    if (end >= 0 && end <= node.length) {
      range.setEnd(node, end)
      break
    }
    start -= node.length
    end -= node.length
  }
  return range
}

// The owner's phone (390, as LaunchView and ChatEmpty stories draw it).
const phoneLarge = css({ w: '[390px]' })

export const ScriptExplainedPhoneLarge: Story = {
  name: 'M8 at the Large text size: a flag in the In row stays on one line (NCC-145)',
  args: { data: toolkitStates.scriptExplainedPhone.data, ui: toolkitStates.scriptExplainedPhone.ui, viewport: 'phone' },
  // The phone's width at Large, where the row "one or more files, --form, --ste" wraps: the line may break between
  // the flags but never inside one (the owner's phone showed "--" and "ste" on two lines).
  decorators: [
    (Story) => (
      <div className={`text-large ${phoneLarge}`}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    const value = within(item).getByText(
      (_, el) => el?.tagName === 'DD' && el.textContent === 'one or more files, --form, --ste',
    )
    await expect(value).toBeVisible()
    // The row wraps at this width, so the check below is a real one.
    const lines = (range: Range) => new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
    await expect(lines(rangeOf(value, 'one or more files, --form, --ste'))).toBeGreaterThan(1)
    for (const flag of ['--form', '--ste']) await expect(lines(rangeOf(value, flag))).toBe(1)
  },
}

export const RuleFilesPhone: Story = {
  name: 'M35: a rule’s files on the phone, its one file in the tree',
  args: { data: toolkitStates.ruleFilesPhone.data, ui: toolkitStates.ruleFilesPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the tree with no viewer, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The rule's one file, with the phone's role line: its length and kind.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByText('104 lines · markdown')).toBeVisible()
  },
}

export const AgentFilesPhone: Story = {
  name: 'M36: an agent’s files on the phone, its prompt in the tree',
  args: { data: toolkitStates.agentFilesPhone.data, ui: toolkitStates.agentFilesPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the tree with no viewer, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The prompt, with the phone's role line: its length and kind.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(1)
    await expect(within(tree).getByText('137 lines · markdown')).toBeVisible()
  },
}

export const WorkflowFilesPhone: Story = {
  name: 'M37: a workflow’s files on the phone, its doc and the harness scripts',
  args: { data: toolkitStates.workflowFilesPhone.data, ui: toolkitStates.workflowFilesPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the tree with no viewer, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The doc and harness/ with the phone's role lines, and the scripts with their counts in lines.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(8)
    await expect(within(tree).getByText('93 lines · markdown')).toBeVisible()
    await expect(within(tree).getByText('Outside the toolkit')).toBeVisible()
    await expect(within(tree).getByText('208 lines')).toBeVisible()
  },
}

export const HookFilesPhone: Story = {
  name: 'M38: a hook’s files on the phone, the script and its tests',
  args: { data: toolkitStates.hookFilesPhone.data, ui: toolkitStates.hookFilesPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the tree with no viewer, under Back. The play
  // test checks what every width shows; src/app/ToolkitFiles.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    // The script and its tests, with the phone's role lines: each one's length and kind.
    const tree = within(item).getByRole('tree', { name: 'Files' })
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(2)
    await expect(within(tree).getByText('142 lines · script')).toBeVisible()
    await expect(within(tree).getByText('97 lines · script')).toBeVisible()
  },
}

export const SkillLinks: Story = {
  name: 'D19: a skill open beside the list, on Links',
  args: { data: toolkitStates.skillLinks.data, ui: toolkitStates.skillLinks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 11' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 4' })
    await expect(within(from).getByRole('button', { name: 'agents/writing-reviewer.md:30' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 7' })
    await expect(within(to).getByText('then the audit-slop skill’s deslop steps (step 8)')).toBeInTheDocument()
    await expect(within(item).getByRole('group', { name: 'writer links' })).toBeVisible()
  },
}

export const RuleLinks: Story = {
  name: 'D29: a rule open beside the list, on Links',
  args: { data: toolkitStates.ruleLinks.data, ui: toolkitStates.ruleLinks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 1' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 0' })
    await expect(within(from).getByText(/No toolkit item names this rule/)).toBeVisible()
    await expect(within(item).getByText(/No item links here/)).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 1' })
    await expect(within(to).getByRole('button', { name: 'skills.md:72' })).toBeVisible()
  },
}

export const AgentLinks: Story = {
  name: 'D30: an agent open beside the list, on Links',
  args: { data: toolkitStates.agentLinks.data, ui: toolkitStates.agentLinks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 7' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 4' })
    await expect(within(from).getByRole('button', { name: 'skills/writer/SKILL.md:107' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 3' })
    await expect(within(to).getByRole('button', { name: 'writing-reviewer.md:102' })).toBeVisible()
  },
}

export const WorkflowLinks: Story = {
  name: 'D31: a workflow open beside the list, on Links',
  args: { data: toolkitStates.workflowLinks.data, ui: toolkitStates.workflowLinks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 4' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 2' })
    await expect(within(from).getByRole('button', { name: 'workflows/skill-eval-cases.md:5' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 2' })
    await expect(within(to).getByRole('button', { name: 'skill-eval-round.md:46' })).toBeVisible()
  },
}

export const HookLinks: Story = {
  name: 'D32: a hook open beside the list, on Links',
  args: { data: toolkitStates.hookLinks.data, ui: toolkitStates.hookLinks.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 2' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 1' })
    await expect(within(from).getByRole('button', { name: 'rules/commits-and-prs.md:182' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 1' })
    await expect(within(to).getByRole('button', { name: 'commit-msg:3' })).toBeVisible()
  },
}

export const SkillLinksTablet: Story = {
  name: 'T15: a skill’s links on a tablet, the panels under the graph',
  args: { data: toolkitStates.skillLinksTablet.data, ui: toolkitStates.skillLinksTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the panels under the graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 11' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 4' })
    await expect(within(from).getByRole('button', { name: 'rules/ste100.md:21' })).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'writer links' })).toBeVisible()
  },
}

export const RuleLinksTablet: Story = {
  name: 'T28: a rule’s links on a tablet, under the rule’s header',
  args: { data: toolkitStates.ruleLinksTablet.data, ui: toolkitStates.ruleLinksTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the panels under the graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 1' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 1' })
    await expect(within(to).getByRole('button', { name: 'skills.md:72' })).toBeVisible()
    await expect(within(item).getByText(/No item links here/)).toBeVisible()
  },
}

export const AgentLinksTablet: Story = {
  name: 'T29: an agent’s links on a tablet, opened from writer',
  args: { data: toolkitStates.agentLinksTablet.data, ui: toolkitStates.agentLinksTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the panels under the graph, under the
  // breadcrumb. src/app/ToolkitLinks.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 7' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 4' })
    await expect(within(from).getByRole('button', { name: 'skills/writer/SKILL.md:107' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 3' })
    await expect(within(to).getByRole('button', { name: 'writing-reviewer.md:102' })).toBeVisible()
  },
}

export const WorkflowLinksTablet: Story = {
  name: 'T30: a workflow’s links on a tablet, under the workflow’s header',
  args: {
    data: toolkitStates.workflowLinksTablet.data,
    ui: toolkitStates.workflowLinksTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the panels under the graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 4' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 2' })
    await expect(within(from).getByRole('button', { name: 'workflows/skill-eval-cases.md:5' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 2' })
    await expect(within(to).getByRole('button', { name: 'skill-eval-round.md:46' })).toBeVisible()
  },
}

export const HookLinksTablet: Story = {
  name: 'T31: a hook’s links on a tablet, under the hook’s header',
  args: { data: toolkitStates.hookLinksTablet.data, ui: toolkitStates.hookLinksTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the panels under the graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the tablet's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 2' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 1' })
    await expect(within(from).getByRole('button', { name: 'rules/commits-and-prs.md:182' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 1' })
    await expect(within(to).getByRole('button', { name: 'commit-msg:3' })).toBeVisible()
  },
}

export const SkillLinksPhone: Story = {
  name: 'M17: a skill’s links on the phone, the graph upright',
  args: { data: toolkitStates.skillLinksPhone.data, ui: toolkitStates.skillLinksPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the upright graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 11' })).toBeVisible()
    const to = within(item).getByRole('region', { name: 'Links to 7' })
    await expect(within(to).getByRole('button', { name: 'SKILL.md:118' })).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'writer links' })).toBeVisible()
  },
}

export const RuleLinksPhone: Story = {
  name: 'M31: a rule’s links on the phone, under the rule’s header',
  args: { data: toolkitStates.ruleLinksPhone.data, ui: toolkitStates.ruleLinksPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the upright graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 1' })).toBeVisible()
    await expect(within(item).getByText(/No item links here/)).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'skills links' })).toBeVisible()
  },
}

export const AgentLinksPhone: Story = {
  name: 'M32: an agent’s links on the phone, under the agent’s header',
  args: { data: toolkitStates.agentLinksPhone.data, ui: toolkitStates.agentLinksPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the upright graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 7' })).toBeVisible()
    const from = within(item).getByRole('region', { name: 'Linked from 4' })
    await expect(within(from).getByRole('button', { name: 'agents/writer.md:35' })).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'writing-reviewer links' })).toBeVisible()
  },
}

export const WorkflowLinksPhone: Story = {
  name: 'M33: a workflow’s links on the phone, under the workflow’s header',
  args: {
    data: toolkitStates.workflowLinksPhone.data,
    ui: toolkitStates.workflowLinksPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the upright graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 4' })).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'skill-eval-round links' })).toBeVisible()
  },
}

export const HookLinksPhone: Story = {
  name: 'M34: a hook’s links on the phone, under the hook’s header',
  args: { data: toolkitStates.hookLinksPhone.data, ui: toolkitStates.hookLinksPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the upright graph, under Back.
  // src/app/ToolkitLinks.test.tsx checks the phone's layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'Links 2' })).toBeVisible()
    await expect(within(item).getByRole('group', { name: 'commit-msg links' })).toBeVisible()
  },
}

export const SkillEvals: Story = {
  name: 'D20: a skill open beside the list, on Evals',
  args: { data: toolkitStates.skillEvals.data, ui: toolkitStates.skillEvals.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('region', { name: 'Cases · 5' })).toBeVisible()
    await expect(within(item).getByRole('figure', { name: 'Opus pass rate by round' })).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'D5 Reviewer passed' })).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'Open the ledger' })).toBeDisabled()
  },
}

export const RuleEvals: Story = {
  name: 'D25: a rule open beside the list, on Evals',
  args: { data: toolkitStates.ruleEvals.data, ui: toolkitStates.ruleEvals.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'No evals for rules' })).toBeVisible()
    await expect(within(item).getByText('4 ledgers')).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'agents-md' })).toBeVisible()
  },
}

export const AgentEvals: Story = {
  name: 'D26: an agent open beside the list, on Evals',
  args: { data: toolkitStates.agentEvals.data, ui: toolkitStates.agentEvals.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('region', { name: 'Drafts · 9' })).toBeVisible()
    await expect(within(item).getByText('r4 Opus artifact')).toBeVisible()
    await expect(within(item).getByText('reviewer-1')).toBeVisible()
  },
}

export const WorkflowEvals: Story = {
  name: 'D27: a workflow open beside the list, on Evals',
  args: { data: toolkitStates.workflowEvals.data, ui: toolkitStates.workflowEvals.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('heading', { name: 'No evals for workflows' })).toBeVisible()
    await expect(within(item).getByRole('button', { name: 'from the file' })).toBeEnabled()
    await expect(within(item).getByText('After step 6')).toBeVisible()
  },
}

export const HookEvals: Story = {
  name: 'D28: a hook open beside the list, on Evals',
  args: { data: toolkitStates.hookEvals.data, ui: toolkitStates.hookEvals.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('43 of 43 pass')).toBeVisible()
    await expect(within(item).getByRole('region', { name: 'Test groups · 5' })).toBeVisible()
    await expect(within(item).getByText('what git adds')).toBeVisible()
  },
}

export const SkillEvalsTablet: Story = {
  name: 'T16: a skill’s evals on a tablet, the cases under the chart',
  args: { data: toolkitStates.skillEvalsTablet.data, ui: toolkitStates.skillEvalsTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByRole('region', { name: 'Cases · 5' })).toBeVisible()
    await expect(within(item).getByText('x1, graded by Codex')).toBeVisible()
  },
}

export const RuleEvalsTablet: Story = {
  name: 'T24: a rule’s evals on a tablet, under the rule’s header',
  args: { data: toolkitStates.ruleEvalsTablet.data, ui: toolkitStates.ruleEvalsTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('Cites rule 6: run the task without the skill first.')).toBeVisible()
  },
}

export const AgentEvalsTablet: Story = {
  name: 'T25: an agent’s evals on a tablet, opened from writer',
  args: { data: toolkitStates.agentEvalsTablet.data, ui: toolkitStates.agentEvalsTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('expected / its verdict')).toBeVisible()
  },
}

export const WorkflowEvalsTablet: Story = {
  name: 'T26: a workflow’s evals on a tablet, under the workflow’s header',
  args: { data: toolkitStates.workflowEvalsTablet.data, ui: toolkitStates.workflowEvalsTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('G1 and G6')).toBeVisible()
  },
}

export const HookEvalsTablet: Story = {
  name: 'T27: a hook’s evals on a tablet, under the hook’s header',
  args: { data: toolkitStates.hookEvalsTablet.data, ui: toolkitStates.hookEvalsTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('cases, all pass')).toBeVisible()
  },
}

export const SkillEvalsPhone: Story = {
  name: 'M18: a skill’s evals on the phone, the badges in two rows',
  args: { data: toolkitStates.skillEvalsPhone.data, ui: toolkitStates.skillEvalsPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('x1, Codex grader')).toBeVisible()
    await expect(within(item).getByRole('heading', { name: 'V1 done criteria' })).toBeVisible()
  },
}

export const RuleEvalsPhone: Story = {
  name: 'M27: a rule’s evals on the phone, under the rule’s header',
  args: { data: toolkitStates.ruleEvalsPhone.data, ui: toolkitStates.ruleEvalsPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('ambitious.md:58')).toBeVisible()
  },
}

export const AgentEvalsPhone: Story = {
  name: 'M28: an agent’s evals on the phone, under the agent’s header',
  args: { data: toolkitStates.agentEvalsPhone.data, ui: toolkitStates.agentEvalsPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('Nov 8, 9 drafts')).toBeVisible()
  },
}

export const WorkflowEvalsPhone: Story = {
  name: 'M29: a workflow’s evals on the phone, under the workflow’s header',
  args: { data: toolkitStates.workflowEvalsPhone.data, ui: toolkitStates.workflowEvalsPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('Before step 1')).toBeVisible()
  },
}

export const HookEvalsPhone: Story = {
  name: 'M30: a hook’s evals on the phone, under the hook’s header',
  args: { data: toolkitStates.hookEvalsPhone.data, ui: toolkitStates.hookEvalsPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitEvals.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Evals' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('run Nov 14')).toBeVisible()
  },
}

export const SkillActivity: Story = {
  name: 'D17: a skill open beside the list, on Activity',
  args: { data: toolkitStates.skillActivity.data, ui: toolkitStates.skillActivity.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No calls on the other 13 days.')).toBeVisible()
  },
}

export const RuleActivity: Story = {
  name: 'D21: a rule open beside the list, on Activity',
  args: { data: toolkitStates.ruleActivity.data, ui: toolkitStates.ruleActivity.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No sessions on the other 12 days.')).toBeVisible()
  },
}

export const AgentActivity: Story = {
  name: 'D22: an agent open beside the list, on Activity',
  args: { data: toolkitStates.agentActivity.data, ui: toolkitStates.agentActivity.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No runs on the other 12 days.')).toBeVisible()
  },
}

export const WorkflowActivity: Story = {
  name: 'D23: a workflow open beside the list, on Activity',
  args: { data: toolkitStates.workflowActivity.data, ui: toolkitStates.workflowActivity.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No rounds on the other 14 days.')).toBeVisible()
  },
}

export const HookActivity: Story = {
  name: 'D24: a hook open beside the list, on Activity',
  args: { data: toolkitStates.hookActivity.data, ui: toolkitStates.hookActivity.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No commits from a session on the other 13 days.')).toBeVisible()
  },
}

export const SkillActivityTablet: Story = {
  name: 'T13: a skill’s activity on a tablet, the bar panels one under the other',
  args: { data: toolkitStates.skillActivityTablet.data, ui: toolkitStates.skillActivityTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No calls on the other 13 days.')).toBeVisible()
  },
}

export const RuleActivityTablet: Story = {
  name: 'T20: a rule’s activity on a tablet, under the rule’s header',
  args: { data: toolkitStates.ruleActivityTablet.data, ui: toolkitStates.ruleActivityTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No sessions on the other 12 days.')).toBeVisible()
  },
}

export const AgentActivityTablet: Story = {
  name: 'T21: an agent’s activity on a tablet, opened from writer',
  args: { data: toolkitStates.agentActivityTablet.data, ui: toolkitStates.agentActivityTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No runs on the other 12 days.')).toBeVisible()
  },
}

export const WorkflowActivityTablet: Story = {
  name: 'T22: a workflow’s activity on a tablet, under the workflow’s header',
  args: {
    data: toolkitStates.workflowActivityTablet.data,
    ui: toolkitStates.workflowActivityTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No rounds on the other 14 days.')).toBeVisible()
  },
}

export const HookActivityTablet: Story = {
  name: 'T23: a hook’s activity on a tablet, under the hook’s header',
  args: { data: toolkitStates.hookActivityTablet.data, ui: toolkitStates.hookActivityTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No commits from a session on the other 13 days.')).toBeVisible()
  },
}

export const SkillActivityPhone: Story = {
  name: 'M15: a skill’s activity on the phone, the tabs scrolled to Activity',
  args: { data: toolkitStates.skillActivityPhone.data, ui: toolkitStates.skillActivityPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No calls on the other 13 days.')).toBeVisible()
  },
}

export const RuleActivityPhone: Story = {
  name: 'M23: a rule’s activity on the phone, under the rule’s header',
  args: { data: toolkitStates.ruleActivityPhone.data, ui: toolkitStates.ruleActivityPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skills' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No sessions on the other 12 days.')).toBeVisible()
  },
}

export const AgentActivityPhone: Story = {
  name: 'M24: an agent’s activity on the phone, under the agent’s header',
  args: { data: toolkitStates.agentActivityPhone.data, ui: toolkitStates.agentActivityPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'writing-reviewer' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No runs on the other 12 days.')).toBeVisible()
  },
}

export const WorkflowActivityPhone: Story = {
  name: 'M25: a workflow’s activity on the phone, under the workflow’s header',
  args: {
    data: toolkitStates.workflowActivityPhone.data,
    ui: toolkitStates.workflowActivityPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'skill-eval-round' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No rounds on the other 14 days.')).toBeVisible()
  },
}

export const HookActivityPhone: Story = {
  name: 'M26: a hook’s activity on the phone, under the hook’s header',
  args: { data: toolkitStates.hookActivityPhone.data, ui: toolkitStates.hookActivityPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the item under Back.
  // src/app/ToolkitActivity.test.tsx checks the layout.
  play: async ({ canvas }) => {
    const item = canvas.getByRole('article', { name: 'commit-msg' })
    await expect(within(item).getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await expect(within(item).getByText('No commits from a session on the other 13 days.')).toBeVisible()
  },
}

export const SkillDiscuss: Story = {
  name: 'D5: a skill with its discussion open beside it',
  args: { data: toolkitStates.skillDiscuss.data, ui: toolkitStates.skillDiscuss.ui, viewport: 'desktop' },
  // src/app/ToolkitDiscuss.test.tsx checks the layout and the taps through the route.
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('complementary', { name: 'Discuss writer' })
    await expect(within(panel).getByRole('heading', { level: 2, name: 'Discuss' })).toBeVisible()
    await expect(within(panel).getByText('toolkit/skills/writer/ attached')).toBeVisible()
    await expect(
      within(panel).getByText('Why does writer hand a draft to writing-reviewer instead of checking it itself?'),
    ).toBeVisible()
    await expect(within(panel).getByText('skills/writer/SKILL.md:106')).toBeVisible()
    await expect(within(panel).getByRole('button', { name: /Open in Workbench/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(canvas.getByRole('article', { name: 'writer' })).toBeVisible()
    // Figma draws the reply box focused (438:50, its light-blue border), as the owner sees it after Discuss. The story
    // puts the focus there; the screen's props do not hold focus.
    const reply = within(panel).getByRole('textbox', { name: 'Ask about writer' })
    reply.focus()
    await expect(reply).toHaveFocus()
  },
}

export const SkillDiscussTablet: Story = {
  name: 'T5: a skill’s discussion on a tablet, in place of the item',
  args: { data: toolkitStates.skillDiscussTablet.data, ui: toolkitStates.skillDiscussTablet.ui, viewport: 'tablet' },
  // Storybook opens at desktop, where the discussion is D5's side panel; pick Tablet in the viewport menu to see T5's
  // page with its empty state. The play test checks the layout of its width; src/app/ToolkitDiscuss.test.tsx checks
  // the tablet's page.
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('textbox', { name: 'Ask about writer' })).toBeVisible()
    // Figma draws the reply box focused (464:379, its border and a caret), as the owner sees it after Discuss.
    const reply = canvas.getByRole('textbox', { name: 'Ask about writer' })
    reply.focus()
    await expect(reply).toHaveFocus()
    await expect(canvas.getByRole('button', { name: /Open in Workbench/ })).toHaveAttribute('aria-disabled', 'true')
    if (layoutOf(canvasElement) === 'desktop') {
      await expect(canvas.getByRole('button', { name: /Back to writer|Close the discussion/ })).toBeVisible()
    } else {
      // T5's page: the nav's back (writer) and the chevron on writer's card (464:334) both go back to the item.
      const backs = canvas.getAllByRole('button', { name: 'Back to writer' })
      await expect(backs).toHaveLength(2)
      for (const back of backs) await expect(back).toBeVisible()
    }
  },
}

export const SkillDiscussPhone: Story = {
  name: 'M7: a skill’s discussion on the phone, full screen',
  args: { data: toolkitStates.skillDiscussPhone.data, ui: toolkitStates.skillDiscussPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop, where the discussion is D5's side panel; pick Phone in the viewport menu to see M7's
  // full-screen page, with the suggestions under Try. The play test checks the layout of its width;
  // src/app/ToolkitDiscuss.test.tsx checks the phone's page.
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('textbox', { name: 'Ask about writer' })).toBeVisible()
    // Figma draws the reply box focused (464:214, its border and a caret), as the owner sees it after Discuss.
    const reply = canvas.getByRole('textbox', { name: 'Ask about writer' })
    reply.focus()
    await expect(reply).toHaveFocus()
    await expect(canvas.getByRole('button', { name: /Workbench/ })).toHaveAttribute('aria-disabled', 'true')
    if (layoutOf(canvasElement) === 'desktop') {
      await expect(canvas.getByRole('button', { name: /Back to writer|Close the discussion/ })).toBeVisible()
    } else {
      // M7's page: the nav's back (writer) and the chevron on writer's card (464:150) both go back to the item.
      const backs = canvas.getAllByRole('button', { name: 'Back to writer' })
      await expect(backs).toHaveLength(2)
      for (const back of backs) await expect(back).toBeVisible()
    }
  },
}

export const ToolkitActivity: Story = {
  name: 'D11: the Activity view, all sessions',
  args: { data: toolkitStates.toolkitActivity.data, ui: toolkitStates.toolkitActivity.ui, viewport: 'desktop' },
  // src/app/ToolkitActivityView.test.tsx checks the layout and the taps through the route.
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'All sessions' })).toBeChecked()
    await expect(canvas.getByText('Read from session files on this Mac')).toBeVisible()
    await expect(canvas.getByText('skill-eval-round started · writer round 7')).toBeVisible()
  },
}

export const ToolkitActivityRun: Story = {
  name: 'D12: the Activity view with a run open beside it',
  args: { data: toolkitStates.toolkitActivityRun.data, ui: toolkitStates.toolkitActivityRun.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('complementary', { name: 'writing-reviewer' })
    await expect(within(panel).getByText('the workspace, or the branch name')).toBeVisible()
    await expect(within(panel).getByRole('button', { name: /Open the session in Workbench/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

export const ToolkitActivityTablet: Story = {
  name: 'T9: the Activity view on a tablet',
  args: {
    data: toolkitStates.toolkitActivityTablet.data,
    ui: toolkitStates.toolkitActivityTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the page under Back to Toolkit.
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Headless' })).toBeVisible()
    await expect(canvas.getByText('started by writer, step 7 · omni-brain · f-005 the-bridge')).toBeVisible()
  },
}

export const ToolkitActivityPhone: Story = {
  name: 'M10: the Activity view on the phone',
  args: { data: toolkitStates.toolkitActivityPhone.data, ui: toolkitStates.toolkitActivityPhone.ui, viewport: 'phone' },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the phone's header.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('omni-brain · f-005')).toBeVisible()
    await expect(canvas.queryByText('pr-description-checker', { selector: '.list-row__title' })).toBeNull()
  },
}

export const ToolkitActivityChats: Story = {
  name: 'D15: the Activity view, chats',
  args: {
    data: toolkitStates.toolkitActivityChats.data,
    ui: toolkitStates.toolkitActivityChats.ui,
    viewport: 'desktop',
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole('region', { name: 'Chats that used the toolkit' })
    await expect(within(list).getByText('Deep research on evals')).toBeVisible()
    await expect(canvas.getByText('Most called in chats')).toBeVisible()
  },
}

export const ToolkitActivityHeadless: Story = {
  name: 'D16: the Activity view, headless runs',
  args: {
    data: toolkitStates.toolkitActivityHeadless.data,
    ui: toolkitStates.toolkitActivityHeadless.ui,
    viewport: 'desktop',
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole('region', { name: 'By skill eval' })
    await expect(within(list).getByText('945 sessions · 348 loaded an item · Nov 8–9')).toBeVisible()
    await expect(canvas.getByText('readme-cold-reader')).toBeVisible()
  },
}

export const ToolkitActivityChat: Story = {
  name: 'D18: the Activity view with a chat open beside it',
  args: { data: toolkitStates.toolkitActivityChat.data, ui: toolkitStates.toolkitActivityChat.ui, viewport: 'desktop' },
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('complementary', { name: 'Writer rules, skills, and agents' })
    await expect(within(panel).getByText('122 from Erik · 991 replies')).toBeVisible()
    await expect(within(panel).getByRole('button', { name: /Open the session in Workbench/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

export const ToolkitActivityChatsTablet: Story = {
  name: 'T11: the Activity view on a tablet, chats',
  args: {
    data: toolkitStates.toolkitActivityChatsTablet.data,
    ui: toolkitStates.toolkitActivityChatsTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the page under Back.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Harness status in omni brain')).toBeVisible()
    // At any width Show all 8 chats waits with a title: the data knows five of the eight chats.
    await expect(canvas.getByRole('button', { name: 'Show all 8 chats' }).getAttribute('title')).toContain('5 of the 8')
  },
}

export const ToolkitActivityHeadlessTablet: Story = {
  name: 'T12: the Activity view on a tablet, headless runs',
  args: {
    data: toolkitStates.toolkitActivityHeadlessTablet.data,
    ui: toolkitStates.toolkitActivityHeadlessTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the page under Back.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('404 sessions · 55 loaded an item · Oct 31 to Nov 9')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Show all 7 evals' })).toBeNull()
  },
}

export const ToolkitActivityChatTablet: Story = {
  name: 'T14: a chat open on a tablet',
  args: {
    data: toolkitStates.toolkitActivityChatTablet.data,
    ui: toolkitStates.toolkitActivityChatTablet.ui,
    viewport: 'tablet',
  },
  // Storybook opens at desktop; pick Tablet in the viewport menu to see the page under Activity › Chats.
  play: async ({ canvas }) => {
    // At the desktop width the chat opens in the side panel; at the tablet's, on its own page.
    await expect(canvas.getByText('the session’s folder and branch')).toBeVisible()
    await expect(canvas.getByText('SendMessage')).toBeVisible()
  },
}

export const ToolkitActivityChatsPhone: Story = {
  name: 'M13: the Activity view on the phone, chats',
  args: {
    data: toolkitStates.toolkitActivityChatsPhone.data,
    ui: toolkitStates.toolkitActivityChatsPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the phone's header.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Linear workflow setup for NCC team')).toBeVisible()
    await expect(canvas.queryByText('pr-description-checker', { selector: '.list-row__title' })).toBeNull()
  },
}

export const ToolkitActivityHeadlessPhone: Story = {
  name: 'M14: the Activity view on the phone, headless runs',
  args: {
    data: toolkitStates.toolkitActivityHeadlessPhone.data,
    ui: toolkitStates.toolkitActivityHeadlessPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the phone's header.
  play: async ({ canvas }) => {
    await expect(canvas.getByText('step 4 of 8 · writer round 7')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show all 7 evals' })).toBeVisible()
  },
}

export const ToolkitActivityChatPhone: Story = {
  name: 'M16: a chat open on the phone',
  args: {
    data: toolkitStates.toolkitActivityChatPhone.data,
    ui: toolkitStates.toolkitActivityChatPhone.ui,
    viewport: 'phone',
  },
  // Storybook opens at desktop; pick Phone in the viewport menu to see the page under Activity › Chats.
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('A chat from the Claude Code CLI. Every value is real, from its session file.'),
    ).toBeVisible()
    await expect(canvas.queryByText('hook messages')).toBeNull()
  },
}
