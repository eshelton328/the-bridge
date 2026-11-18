// The Chats and Headless runs sources of the Activity view (D15, D16, D18,
// T11, T12, T14, M13, M14, M16): the switch's pick, the list the source adds
// (the chats that used the toolkit or the sessions by skill eval), what Show
// all shows, the open chat, what each tap changes in the ui and the Figma key
// of each part. Pure, so activitySources.test.ts checks it without rendering.
import type {
  ToolkitActivityChat,
  ToolkitActivityList,
  ToolkitActivitySource,
  ToolkitActivityView,
  ToolkitChatItem,
  ToolkitEvalGroup,
  ToolkitKind,
  ToolkitUi,
} from '../types.ts'

/** A pick on the source switch (D11 to D15 or D16): its counts show, with no run or chat open and the list folded. */
export function changeSource(source: ToolkitActivitySource): Partial<ToolkitUi> {
  return { activitySource: source, run: undefined, chat: undefined, activityShowAll: undefined }
}

/**
 * The list narrowed by a kind chip: the chats that used an item of that kind, the evals of a skill of that kind.
 * Whether the state knows every row is decided before the chip narrows it: when it does (D16's seven evals), Show all
 * counts the rows the chip leaves, so it shows each of them (Skills: five, readme the fifth); when it does not (D15's
 * 8 chats, 5 known), Show all keeps the count it names and waits.
 */
export function narrowList(list: ToolkitActivityList, kind: ToolkitKind): ToolkitActivityList {
  const known = list.showAll === undefined || list.rows.length >= list.showAll.count
  const counted = <T extends ToolkitActivityList>(narrowed: T): T =>
    known && narrowed.showAll !== undefined
      ? { ...narrowed, showAll: { ...narrowed.showAll, count: narrowed.rows.length } }
      : narrowed
  if (list.type === 'chats')
    return counted({ ...list, rows: list.rows.filter((c) => c.items.some((i) => i.kind === kind)) })
  return counted({ ...list, rows: list.rows.filter((g) => g.skill?.kind === kind) })
}

/** The rows the list shows: the first `shown`, or every row once Show all was pressed (T12 shows all seven). */
export function listRows<T extends ToolkitActivityList>(list: T, showAll: boolean | undefined): T['rows'] {
  return showAll === true ? list.rows : list.rows.slice(0, list.shown)
}

/** Why Show all waits: the state knows fewer rows than the count it names. */
const showAllWaiting = (known: number, count: number) =>
  `This mock-up has ${String(known)} of the ${String(count)} rows; the others come with the frame that lists them`

/**
 * Show all (D15 `Show all 8 chats` 477:519, D16 477:1121, T11 477:1562, M14 477:2602): none when the list has no
 * Show all, it was pressed, or every row it counts shows already (T12's seven evals); `waits` when the state knows
 * fewer rows than its count, so the button is disabled with that title (8 chats, 5 known, T11 showing all five).
 */
export function showAllLink(
  list: ToolkitActivityList,
  showAll: boolean | undefined,
): { label: string; waits?: string } | null {
  if (list.showAll === undefined || showAll === true) return null
  const { label, count } = list.showAll
  if (list.rows.length >= count && list.rows.length <= list.shown) return null
  return list.rows.length < count ? { label, waits: showAllWaiting(list.rows.length, count) } : { label }
}

/** A press on Show all: every row shows. */
export function showAllRows(): Partial<ToolkitUi> {
  return { activityShowAll: true }
}

/** The chat open in the view (D18): the row of the source's chats whose id `ui.chat` names; else null. */
export function openChat(
  view: ToolkitActivityView,
  ui: Pick<ToolkitUi, 'activitySource' | 'chat'>,
): ToolkitActivityChat | null {
  if (ui.chat === undefined) return null
  const picked = ui.activitySource ?? 'all'
  const list = view.counts[picked]?.list
  if (list?.type !== 'chats') return null
  return list.rows.find((c) => c.id === ui.chat) ?? null
}

/** A tap on a chat's row (D15 to D18): the chat opens, in the open run's place. */
export function showChat(id: string): Partial<ToolkitUi> {
  return { chat: id, run: undefined }
}

/** Close on the chat's panel, or Back on its page (D18 to D15, T14 to T11): the view again. */
export function closeChat(): Partial<ToolkitUi> {
  return { chat: undefined }
}

/**
 * A tap on an eval's row (D16 `eval · writer` 477:1122): its skill opens on its Evals tab, from the list (a skill
 * with no Evals tab opens on its first tab). Its chip opens the skill's page (`openCalled`).
 */
export function openEvalGroup(path: string): Partial<ToolkitUi> {
  return { view: 'list', open: path, from: null, itemTab: 'evals', run: undefined, chat: undefined }
}

/** An item a chat used, as its chip names it: the name, and "×" and the times when more than once (D15 477:548). */
export function chatItemLabel(item: Pick<ToolkitChatItem, 'name' | 'times'>): string {
  return item.times === undefined || item.times < 2 ? item.name : `${item.name} ×${String(item.times)}`
}

/** The share of an eval's sessions that loaded an item, from 0 to 100: its bar (D16 477:1133). */
export function evalShare(group: Pick<ToolkitEvalGroup, 'sessions' | 'loaded'>): number {
  return Math.round((group.loaded / group.sessions) * 1000) / 10
}

/** The Figma key of a chat's row: `chat · ` and its title (D15 `chat · Brain NC1701 project` 477:537). */
export function chatLayer(chat: Pick<ToolkitActivityChat, 'title'>): string {
  return `chat · ${chat.title}`
}

/** The Figma key of an eval's row: `eval · ` and its name (D16 `eval · writer` 477:1122). */
export function evalLayer(group: Pick<ToolkitEvalGroup, 'name'>): string {
  return `eval · ${group.name}`
}

/** The Figma key of an item's chip: `link · ` and its name (D15 `link · project-setup` 477:527). */
export function linkLayer(item: { name: string }): string {
  return `link · ${item.name}`
}

/** The Figma key of a tool an open chat used: `tool · ` and its name (D18 `tool · Bash` 475:429). */
export function toolLayer(tool: { name: string }): string {
  return `tool · ${tool.name}`
}
