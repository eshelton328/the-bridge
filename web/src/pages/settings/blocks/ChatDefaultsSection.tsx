// Settings' New chat defaults (d-119): the model, the effort and the
// permission mode a new chat starts with, saved on this device. No chat
// reads them yet, and the section says so. Props only.
import { Panel, SelectField } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import { type ChatDefaults, chatEfforts, chatModels, chatPermissions } from '../../../lib/deviceSettings.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import { note, rows } from './settingsParts.ts'

const modelLabel = { fable: 'Fable', opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku' } as const
const permissionLabel = { default: 'Default', auto: 'Auto', plan: 'Plan' } as const

// Three fields side by side, each an equal share; one under another on the phone.
const fields = css({ display: 'flex', gap: '16', '& > *': { flex: '1', minW: '[0]' } })
const stacked = css({ flexDirection: 'column' })

function pick<T extends string>(list: readonly T[], value: string): T | undefined {
  return list.find((v) => v === value)
}

export type ChatDefaultsSectionProps = {
  chat: ChatDefaults
  layout: Viewport
  onChange?: ((chat: Partial<ChatDefaults>) => void) | undefined
}

export function ChatDefaultsSection({ chat, layout, onChange }: ChatDefaultsSectionProps) {
  const size = layout === 'desktop' ? 'md' : 'lg'
  return (
    <Panel variant="section" title="New chat defaults">
      <div className={rows}>
        <div className={layout === 'phone' ? cx(fields, stacked) : fields}>
          <SelectField
            label="Model"
            size={size}
            options={chatModels.map((m) => ({ value: m, label: modelLabel[m] }))}
            value={chat.model}
            onValueChange={(value) => {
              const model = pick(chatModels, value)
              if (model !== undefined) onChange?.({ model })
            }}
          />
          <SelectField
            label="Effort"
            size={size}
            options={chatEfforts.map((e) => ({ value: e, label: e }))}
            value={chat.effort}
            onValueChange={(value) => {
              const effort = pick(chatEfforts, value)
              if (effort !== undefined) onChange?.({ effort })
            }}
          />
          <SelectField
            label="Permission mode"
            size={size}
            options={chatPermissions.map((p) => ({ value: p, label: permissionLabel[p] }))}
            value={chat.permission}
            onValueChange={(value) => {
              const permission = pick(chatPermissions, value)
              if (permission !== undefined) onChange?.({ permission })
            }}
          />
        </div>
        <span className={note}>Saved on this device. Chats do not use these yet.</span>
      </div>
    </Panel>
  )
}
