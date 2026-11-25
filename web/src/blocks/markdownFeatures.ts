// The rich text features a Markdown text draws (Settings → Rich text, the
// owner's request of 2026-11-25). Each is on by default. A feature that is
// off draws its plain Markdown and hides no text: a callout is a quote,
// code is a code block with no colours, a chat mention is its name, a
// Mermaid diagram is its source, math is its TeX and an image is a link
// (`markdownComponents.ts`, `markdownPlugins.ts`). The app root gives the
// owner's settings; with no provider, as on the canvas, every feature is on.
// It is read with its Consumer, never `use`: the canvas runs React 18.
import { createContext } from 'react'
import { allRichText, type RichTextFeatures, richTextFeatures } from '../lib/deviceSettings.ts'

export const MarkdownFeaturesContext = createContext<RichTextFeatures>(allRichText)

/** One key for each set of features, such as "101111", for the caches of the plugins and the element maps. */
export const featuresKey = (features: RichTextFeatures): string =>
  richTextFeatures.map((feature) => (features[feature] ? '1' : '0')).join('')
