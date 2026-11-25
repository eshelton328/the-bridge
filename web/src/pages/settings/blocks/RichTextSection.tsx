// Settings' Rich text (bridge-coord, 2026-11-25, from the owner's "I want to be
// able to toggle each feature on/off"): one switch per rich text feature of a
// message, all on by default. A feature that is off draws its plain Markdown
// and hides no text (blocks/markdownFeatures.ts). Chat links are the chat
// mentions, which the owner calls chat bubbles, so the hint says so. Props only.
import { Panel, Switch } from '@eshelton328/component-library-1701'
import { type RichTextFeature, type RichTextFeatures, richTextFeatures } from '../../../lib/deviceSettings.ts'
import { note, rows } from './settingsParts.ts'

const featureLabel = {
  callouts: 'Callouts',
  code: 'Code highlighting',
  chatLinks: 'Chat links',
  mermaid: 'Mermaid diagrams',
  math: 'Math',
  images: 'Images',
} as const satisfies Record<RichTextFeature, string>

const featureHint: Partial<Record<RichTextFeature, string>> = { chatLinks: 'Chat bubbles in messages' }

export type RichTextSectionProps = {
  richText: RichTextFeatures
  onChange?: ((feature: RichTextFeature, on: boolean) => void) | undefined
}

export function RichTextSection({ richText, onChange }: RichTextSectionProps) {
  return (
    <Panel variant="section" title="Rich text">
      <div className={rows}>
        <span className={note}>Off shows the plain Markdown. No text is hidden.</span>
        {richTextFeatures.map((feature) => (
          <Switch
            key={feature}
            label={featureLabel[feature]}
            hint={featureHint[feature]}
            checked={richText[feature]}
            onCheckedChange={(on) => {
              onChange?.(feature, on)
            }}
            layout="inline"
          />
        ))}
      </div>
    </Panel>
  )
}
