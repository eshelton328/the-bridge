// Settings' Appearance (d-119): Mode (Light, Dark or System; it applies at
// once, and System follows the device), Theme with its one choice, and Text
// size, disabled with "Coming soon" until the library's text size sets are
// in use (step D). Props only.
import { Panel, SelectField, ViewSwitch } from '@eshelton328/component-library-1701'
import { type Mode, modes, textSizes } from '../../../lib/deviceSettings.ts'
import type { Viewport } from '../../../lib/screenState.ts'
import type { SettingsValues } from '../types.ts'
import { note, row, rowLabel, rows } from './settingsParts.ts'

const modeLabel = { light: 'Light', dark: 'Dark', system: 'System' } as const
const sizeLabel = { small: 'Small', default: 'Default', large: 'Large' } as const
const isMode = (value: string): value is Mode => modes.some((m) => m === value)

export type AppearanceSectionProps = {
  settings: SettingsValues
  layout: Viewport
  onModeChange?: ((mode: Mode) => void) | undefined
}

export function AppearanceSection({ settings, layout, onModeChange }: AppearanceSectionProps) {
  const full = layout === 'phone'
  return (
    <Panel variant="section" title="Appearance">
      <div className={rows}>
        <div className={row}>
          <span className={rowLabel}>Mode</span>
          <ViewSwitch
            label="Mode"
            fullWidth={full}
            items={modes.map((mode) => ({ value: mode, label: modeLabel[mode] }))}
            value={settings.mode}
            onValueChange={(value) => {
              if (isMode(value)) onModeChange?.(value)
            }}
          />
          <span className={note}>System follows this device's light or dark setting.</span>
        </div>
        <div className={row}>
          <SelectField label="Theme" options={[{ value: 'ncc-1701', label: 'NCC-1701 default' }]} value="ncc-1701" />
          <span className={note}>More themes later.</span>
        </div>
        <div className={row}>
          <span className={rowLabel}>Text size</span>
          <ViewSwitch
            label="Text size"
            fullWidth={full}
            items={textSizes.map((size) => ({ value: size, label: sizeLabel[size] }))}
            value={settings.textSize}
            disabled
          />
          <span className={note}>Coming soon</span>
        </div>
      </div>
    </Panel>
  )
}
