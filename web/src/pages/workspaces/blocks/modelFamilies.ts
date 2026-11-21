// The Claude model families a live chat's model chip offers (W10), as `claude --model` takes them
// (the contract's `ModelAlias`), and how the app writes each: "sonnet" is "Sonnet".
import { ModelAlias } from '@bridge/contract'

export const modelFamilies = {
  fable: 'Fable',
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
} as const satisfies Record<ModelAlias, string>

/** The families in the contract's order, as the chip's menu lists them. */
export const modelChoices: readonly ModelAlias[] = ModelAlias.options
