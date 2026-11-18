// A toolkit item's kind as its library icon in the kind's colour, before an
// item's name in the Activity view: the runs (D11 `icon/agent` 500:12054),
// Most called (500:12072) and the log (500:12147). Props only.
import {
  AgentIcon,
  HookIcon,
  type IconSize,
  RuleIcon,
  SkillIcon,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitKind } from '../types.ts'

const tone = {
  skill: css({ display: 'inline-flex', flexShrink: '0', color: 'kind.skill' }),
  agent: css({ display: 'inline-flex', flexShrink: '0', color: 'kind.agent' }),
  rule: css({ display: 'inline-flex', flexShrink: '0', color: 'kind.rule' }),
  workflow: css({ display: 'inline-flex', flexShrink: '0', color: 'kind.workflow' }),
  hook: css({ display: 'inline-flex', flexShrink: '0', color: 'kind.hook' }),
}

export type ToolkitKindIconProps = {
  kind: ToolkitKind
  /** 12 in Most called and the log (Figma 13), 16 beside a run (Figma 15 or 14). */
  size: IconSize
}

export function ToolkitKindIcon({ kind, size }: ToolkitKindIconProps) {
  const icon =
    kind === 'skill' ? (
      <SkillIcon size={size} />
    ) : kind === 'agent' ? (
      <AgentIcon size={size} />
    ) : kind === 'rule' ? (
      <RuleIcon size={size} />
    ) : kind === 'workflow' ? (
      <WorkflowIcon size={size} />
    ) : (
      <HookIcon size={size} />
    )
  return <span className={tone[kind]}>{icon}</span>
}
