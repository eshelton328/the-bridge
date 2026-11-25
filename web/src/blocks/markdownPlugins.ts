// The remark plugins of MarkdownText, one array for each set of inputs, so a
// render with the same inputs keeps the same array and react-markdown does
// not parse again. remark-gfm always runs. The callout plugin runs only
// with `callouts` on (off, an alert stays the quote it is written as, with
// its [!NOTE] line). Math (remark-math, a syntax extension) comes before
// the mentions, so a formula is never a mention; useMathPlugins gives no
// math plugins with `math` off. The mention plugin runs only with
// `chatLinks` on and a chat to match (off, a chat's name is its text).
import type { Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { RichTextFeatures } from '../lib/deviceSettings.ts'
import { remarkCallout } from './remarkCallout.ts'
import { remarkChatMentions } from './remarkChatMentions.ts'

export type PluginList = NonNullable<Options['remarkPlugins']>

const withCallouts: PluginList = [remarkGfm, remarkCallout]
const plain: PluginList = [remarkGfm]

/** The base plugins with the math plugins, one array per base and math list. */
const withMath = new WeakMap<PluginList, WeakMap<PluginList, PluginList>>()
/** The plugins for a chats map, one array per list and map. */
const withChats = new WeakMap<PluginList, WeakMap<ReadonlyMap<string, string>, PluginList>>()

/** The plugins for `features`, the chats a text may mention and the loaded math plugins. */
export function pluginsFor(
  features: RichTextFeatures,
  chats: ReadonlyMap<string, string>,
  math: PluginList,
): PluginList {
  let list = features.callouts ? withCallouts : plain
  if (math.length > 0) {
    const byMath = withMath.get(list) ?? new WeakMap<PluginList, PluginList>()
    withMath.set(list, byMath)
    const known = byMath.get(math) ?? [...list, ...math]
    byMath.set(math, known)
    list = known
  }
  if (!features.chatLinks || chats.size === 0) return list
  const byChats = withChats.get(list) ?? new WeakMap<ReadonlyMap<string, string>, PluginList>()
  withChats.set(list, byChats)
  const known = byChats.get(chats) ?? [...list, [remarkChatMentions, chats]]
  byChats.set(chats, known)
  return known
}
