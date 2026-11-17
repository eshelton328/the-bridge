// Branded ids for values that cross layers: route params, store
// references and, later, the API. A brand stops a plain string or another
// kind of id from being passed where this id is expected. The only way to
// make one is the schema's parse(), which also checks the format, because
// a cast (`'x' as InboxItemId`) is rejected by the lint.
import { z } from 'zod'

/** Lowercase words joined by hyphens, such as "write-the-tickets". */
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The id of one item in the Inbox. */
export const InboxItemId = z.string().regex(slug).brand<'InboxItemId'>()
export type InboxItemId = z.infer<typeof InboxItemId>
