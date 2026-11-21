// A chat's body: the transcript, then the composer at the bottom, with the
// skill list over it after "/" (D1 105:209). Only what the owner types opens the
// list: a message that starts with "/" opens it, and the focus stays in the
// box; a word that starts with "/" at the caret opens it too, as "/wri" at
// the end of M10's message does, and the list keeps the skills that start
// with that word, under `matching`. A skill the owner picks (a click or tap on its
// row, or Enter on the highlighted row, which the arrow keys move) takes the
// place of that word with a space after it, closes the list and leaves the
// focus and caret in the box after it. `size="pane"` is a pane of the
// split, `size="full"` the chat alone beside the sidebar (D2 105:868) and
// `size="side"` the side chat's body (D2 105:933 to 105:948). An overlay,
// such as the side chat in a pane (D5 158:518), sits over the body's right
// side. The composer stays at the bottom of its pane and only the transcript
// above it scrolls (d-107, `ScrollFrame`). `size="phone"` is the chat on the
// phone (M3 105:2784), with the skill list as wide as the composer,
// `size="tablet"` the same chat at a tablet's width (T2 105:1894) and
// `size="sheet"` the side chat's body in the phone's sheet (M5 105:3106).
// With `header` the ScrollFrame is the root, so the phone's chat puts it
// straight in the AppShell detail, which docks the composer on the keyboard
// (library beta.61, screen review R20). Send goes through `onSend` (library
// beta.90). The entries are
// memoised (TranscriptEntries, review R28), so a keystroke renders the composer
// and not the transcript. Send and Stop
// (W1, `useComposerActions`): one send and one stop in flight, and a miss
// shows one quiet line under the composer, with Retry when it may work
// later; a text over the server's limit is not sent and the line says so. A send that found text in the chat's
// terminal input offers to clear it (`ComposerLine`, R28 part B). A live chat
// (`liveChat`, slice 3b) asks `transcripts` to read its transcript while it
// shows, draws the earlier line over the entries, the empty line when it has
// none and the problem line with Retry under them; it opens at the newest entry
// and stays there as entries come in, unless the reader scrolled up
// (`usePinnedEnd`); more than a screen up, a button over the composer scrolls
// back to the newest entry (`NewestButton`). A live Claude chat's files (W1b, `files`): the
// paperclip opens the device's file picker (a hidden input with no type
// filter and no capture, so a phone offers Photos, Camera and Files), and a
// drop on the composer or a paste of files adds them too; Send is off while
// a file uploads or failed, and with every file ready the composer sends
// with no text (library beta.95). A
// live Codex chat's composer has no paperclip. The box empties as a send
// starts, and a miss puts the text back; meanwhile a live Claude chat draws
// its pending send after the entries (`pending`, `PendingEntry`), until the
// entry the stream brings takes its place. Props only.
import {
  Composer,
  type ComposerAttachment,
  Inline,
  ModelChip,
  PlusIcon,
  ScrollFrame,
} from '@eshelton328/component-library-1701'
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import { pickSkill, skillQuery } from '../../../lib/skillQuery.ts'
import type { ChatEntry, ComposerState, Skill } from '../types.ts'
import type { CopyReply } from './ChatEntryView.tsx'
import { ComposerLine } from './ComposerLine.tsx'
import { type DraftBook, restoredDraft, useDraft } from './draftBook.ts'
import { NewestButton } from './NewestButton.tsx'
import { NotLive } from './NotLive.tsx'
import { PendingEntry } from './PendingEntry.tsx'
import { frameRegion } from './frameRegion.ts'
import { SkillPicker } from './SkillPicker.tsx'
import { TranscriptEntries } from './TranscriptEntries.tsx'
import { TranscriptProblem } from './TranscriptProblem.tsx'
import { type ComposerAnswer, useComposerActions } from './useComposerActions.ts'
import { useKeyboardFirst } from './useKeyboardFirst.ts'
import { usePinnedEnd } from './usePinnedEnd.ts'
import { useSendKeepsFocus } from './useSendKeepsFocus.ts'

/** What a live chat's composer shows of its files now. */
export type ChatFilesView = {
  readonly chips: readonly ComposerAttachment[]
  /** A file uploads or failed: Send is off. */
  readonly blocked: boolean
  /** How many files are ready to send. */
  readonly ready: number
  /** The line under the composer about the files, such as "Not attached — too large"; none when not set. */
  readonly line: string | undefined
}

/**
 * A live chat's attached files (W1b): the page uploads them, and the composer shows them as chips. The pane reads its
 * own chat's view, so an upload's progress renders only this composer, never the page, a header or a transcript.
 */
export type ChatFiles = {
  /** Calls `listener` after each change of this chat's files; the result stops it. */
  readonly subscribe: (listener: () => void) => () => void
  /** This chat's files now; one object until they change. */
  readonly view: () => ChatFilesView
  readonly add: (files: File[]) => void
  readonly remove: (id: string) => void
  readonly retry: (id: string) => void
}

/** What a pane draws of its chat's pending send: the text, the file names and whether "Sending…" shows. */
export type PendingSendView = {
  /** This send's key among the chat's pending sends. */
  readonly key: string
  readonly text: string
  readonly files: readonly string[]
  readonly sending: boolean
}

/**
 * A live chat's pending send (the page's livePending.ts): the pane reads it itself, so the bubble renders only this
 * pane, never the page or another transcript entry.
 */
export type ChatPending = {
  /** Calls `listener` after each change of the pending send or of the chat's transcript; the result stops it. */
  readonly subscribe: (listener: () => void) => () => void
  /** The pending sends to draw now, in the order sent: those whose entry the transcript does not show yet. */
  readonly view: () => readonly PendingSendView[]
}

const noSubscribe = () => () => undefined
const noView = () => undefined
const noPending: readonly PendingSendView[] = []
const noPendingView = () => noPending

/** `pending`'s sends now; none without it. */
function usePendingViews(pending: ChatPending | undefined): readonly PendingSendView[] {
  return useSyncExternalStore(pending?.subscribe ?? noSubscribe, pending?.view ?? noPendingView)
}

/** `files`' view now, or none; the caller renders again only when this chat's files change. */
function useFilesView(files: ChatFiles | undefined): ChatFilesView | undefined {
  return useSyncExternalStore(files?.subscribe ?? noSubscribe, files?.view ?? noView)
}

/** Reads a live chat's transcript while its pane shows (the page's liveTranscript.ts). */
export type TranscriptWatch = {
  /** Starts reading `chat`'s transcript into the pane's entries; the result stops it. */
  readonly watch: (chat: string) => () => void
  /** Reads `chat`'s transcript again now: the problem line's Retry. */
  readonly retry: (chat: string) => void
}

const body = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  p: '12',
  minH: '[0]',
})
// D2 105:868: the transcript and composer sit 22 in from the chat's sides and 16 from its top and bottom.
const sizes = {
  pane: undefined,
  full: css({ px: '24', py: '16' }),
  // D2 105:920: 17 in from the side chat's edges, 12 under its note.
  side: css({ px: '16', pt: '12', pb: '16' }),
  // D5 158:518: the side chat in a pane pads its parts itself, and fills the panel under its title row.
  inset: css({ px: '0', pt: '0', pb: '0' }),
  // M3 105:2784: 16 in from the screen's sides and 14 under the header's rule (12 on the grid). The composer ends 10
  // over Figma's 21 px home indicator band, 31 from the screen's end; `AppShell` keeps a 34 px safe area there with no
  // tab bar, so the body pads nothing under the composer.
  phone: css({ px: '16', pt: '12', pb: '0' }),
  // T2 105:1894: the transcript 16 under the header's rule and 22 in from the screen's sides (24 on the grid); as on the
  // phone, `AppShell` keeps the safe area under the composer.
  tablet: css({ px: '24', pt: '16', pb: '0' }),
  // M5 105:3106: the side chat in the phone's sheet, whose panel pads the sides; the transcript 12 under the note, and
  // the sheet keeps the safe area under the composer.
  sheet: css({ px: '0', pt: '12', pb: '0' }),
}
// The space between the entries, and between the transcript, `above` and the composer: 10 in a pane of the split
// and the side chat in a pane (D1, D5), 12 in the chat alone and the side chat (D2).
const gaps = {
  pane: { body: css({ gap: '10' }), footer: css({ gap: '10', pt: '10' }) },
  full: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  side: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // M3: the entries 12 apart (105:2785 to 105:2790).
  phone: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // T2: the entries 14 apart (105:1895 to 105:1900), 12 on the grid.
  tablet: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // M5: the entries 12 apart (105:3121, 105:3123).
  sheet: { body: css({ gap: '12' }), footer: css({ gap: '12', pt: '12' }) },
  // The side chat in a pane: in a short pane its transcript keeps two 17 px lines (`control.lg`, 36, the nearest size
  // token, d-100) and scrolls with the note; the title row and the composer stay in view (d-107).
  inset: { body: css({ gap: '10', minH: 'control.lg' }), footer: css({ gap: '10', pt: '10' }) },
} satisfies Record<keyof typeof sizes, { body: string; footer: string }>
// The side chat in a pane: its one-row composer never shrinks below its own height, however short the pane. The
// library's ScrollFrame lets its footer shrink (and scroll) so a long draft leaves the transcript room; the inline
// composer caps its own draft, so here the footer keeps its height (`footerShrink={false}`, library beta.27) and the
// panel scrolls instead (SideChatPanel).
const footerShrinks = {
  pane: true,
  full: true,
  side: true,
  phone: true,
  tablet: true,
  sheet: true,
  inset: false,
} satisfies Record<keyof typeof sizes, boolean>
const footer = css({ display: 'flex', flexDirection: 'column' })
// The line over a live transcript whose older entries the server did not send: quiet, as the composer's hint.
const earlierLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })
// With `header` the frame is the root: the body's padding of `sizes` moves onto the transcript and the composer, so the
// header runs edge to edge and the parts sit where they did (M3 105:2784, T2 105:1894).
const framed = {
  phone: { body: css({ px: '16', pt: '12' }), footer: css({ px: '16' }) },
  tablet: { body: css({ px: '24', pt: '16' }), footer: css({ px: '24' }) },
}

type ChatPaneBase = {
  /** The Figma layers of the composer and of each entry, for the fidelity checks. */
  figma: {
    /** The composer; none when the frame does not draw it, such as under M4's sheet. */
    composer?: string | undefined
    entries?: readonly (string | undefined)[] | undefined
    /** The skill list; D1's when not set. */
    skills?: string | undefined
  }
  /** The chat the transcript belongs to; a new id resets the transcript's boundary. */
  chatId: string
  entries: readonly ChatEntry[]
  /** A live chat's text in place of its transcript, such as "Transcript not live yet" (d-117); `entries` when not set. */
  notLive?: string | undefined
  /** A live chat's server chat ID: while the pane shows, `transcripts` reads its transcript (slice 3b). */
  liveChat?: string | undefined
  transcripts?: TranscriptWatch | undefined
  /** A reply's Copy, sample or live: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /** The line over the entries, such as "Earlier entries not live yet"; none when not set. */
  earlier?: string | undefined
  /** The line in place of the entries of a read transcript with none, such as "No messages yet"; none when not set. */
  empty?: string | undefined
  /** The line under the entries, with Retry, when the transcript's read or updates failed; none when not set. */
  problem?: string | undefined
  composer: ComposerState
  /** The skills that "/" lists; a chat without them lists none. */
  skills?:
    | {
        label: string
        /** The label once the owner has typed more than the "/", with {query} for what he typed (M10); `label` when not set. */
        matching?: string | undefined
        items: readonly Skill[]
        value: string | null
        open: boolean
      }
    | undefined
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  /** The folders control, before the model in the composer's bottom row (D4 137:9). */
  folders?: ReactNode
  /** A live Claude chat's files (W1b); a sample chat shows the composer's own chips and a paperclip that does nothing. */
  files?: ChatFiles | undefined
  /** A live Claude chat's pending send, drawn after the entries; a sample chat has none. */
  pending?: ChatPending | undefined
  /** The size of Send's arrow: `12` in the side chat in a pane (D5 158:549); the library's 16 when not set. */
  sendIconSize?: '12' | '16' | undefined
  /** The composer's layout: `inline` is one row, as the side chat in a pane draws it (D5 158:545); `stacked` when not set. */
  layout?: 'stacked' | 'inline' | undefined
  /** Drawn at the top of the transcript and scrolled with it, such as the side chat's note in a pane (D5 158:530). */
  lead?: ReactNode
  /** Drawn between the transcript and the composer, such as "Open as its own pane" (D5 158:540). */
  above?: ReactNode
  /** Put the focus in the message box when the chat shows, as the phone's chat does with the skills open (M3). */
  autoFocus?: boolean | undefined
  /**
   * The page's drafts by chat (review R28): the box starts from this chat's draft (`composer.text` when it has none),
   * sets it as the owner types and follows a change made elsewhere, such as a send that went through after the pane
   * opened again. A keystroke tells only this chat's composers, so the page, the header and the transcript do not
   * render. A send that went through empties the draft only if it still holds the text sent. Not set, as in a side
   * chat, the box keeps its text itself.
   */
  drafts?: DraftBook | undefined
  /**
   * Sends the message: resolves `true` once it is sent, `false` when the send failed and the caller reported it, or
   * the line to show under the composer (`ComposerAnswer`). The box empties as the send starts, and any answer but
   * `true` puts the text back, before what the owner typed meanwhile, so a failed send keeps the draft. Not set, as in a side chat, the message counts as sent at
   * once.
   */
  onSend?: ((text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops the chat: the running composer's Stop. Its answer is a send's (`ComposerAnswer`); Stop does nothing when not set. */
  onStop?: (() => Promise<ComposerAnswer>) | undefined
}

export type ChatPaneProps = ChatPaneBase &
  (
    | {
        size?: keyof typeof sizes | undefined
        header?: undefined
        label?: undefined
        /** Drawn over the body, such as the side chat in a pane (D5 158:518); it places itself. */
        overlay?: ReactNode
      }
    | {
        size: keyof typeof framed
        /**
         * The chat's header, such as the phone's `ChatHead` (M3): the `ScrollFrame` is the root and this its header, so
         * the frame can be the AppShell detail's own child and dock the composer on the keyboard.
         */
        header: ReactNode
        /** The chat's accessible name: the frame is a region with it, as a `<section aria-label>` was. */
        label: string
        overlay?: undefined
      }
  )

export function ChatPane(props: ChatPaneProps) {
  const {
    figma,
    chatId,
    entries,
    notLive,
    liveChat,
    transcripts,
    onCopy,
    earlier,
    empty,
    problem,
    composer,
    skills,
    onSkillsOpenChange,
    size = 'pane',
    folders,
    files,
    pending,
    sendIconSize,
    layout,
    lead,
    above,
    autoFocus = false,
    drafts,
    onSend,
    onStop,
  } = props
  // Set when "/" opens the list, so the list hands the focus back to the box (SkillPicker `onListFocus`).
  const typedRef = useRef(false)
  const areaRef = useRef<HTMLDivElement>(null)
  // What the owner has typed from the "/": the list keeps the skills that start with it.
  // The chat's draft in the page's drafts, else the data's text; it changes only for this chat (draftBook.ts).
  const draft = useDraft(drafts, chatId, composer.text)
  const [query, setQuery] = useState(() => skillQuery(draft, draft.length))
  // The message box's text: a picked skill goes into it.
  const [text, setText] = useState(draft)
  // The text as typed now, for a send that ends after the owner typed on: the box empties only if it still holds what
  // was sent, as the library's own composer does with its uncontrolled text.
  const latestRef = useRef(draft)
  // A draft changed elsewhere, such as one a send emptied after this pane opened again: the box follows it.
  useEffect(() => {
    if (draft === latestRef.current) return
    latestRef.current = draft
    setText(draft)
    setQuery(skillQuery(draft, draft.length))
  }, [draft])
  // The skill the arrow keys moved the highlight to, while the list is open.
  const [moved, setMoved] = useState<string | null>(null)
  // Where the caret goes once a picked skill is in the box.
  const caretRef = useRef<number | null>(null)
  const textArea = () => areaRef.current?.querySelector('textarea') ?? null
  // A press on Send keeps the focus in the box, so the phone's keyboard stays up through the send (useSendKeepsFocus.ts).
  useSendKeepsFocus(areaRef, skills === undefined)
  const fileRef = useRef<HTMLInputElement>(null)
  // A live chat's transcript is read while the pane shows, and the stream closes when it unmounts.
  useEffect(
    () => (liveChat === undefined || transcripts === undefined ? undefined : transcripts.watch(liveChat)),
    [liveChat, transcripts],
  )
  // A live chat opens at its newest entry and follows new ones while the reader is at the end.
  const { ref: pinRef, newest } = usePinnedEnd(liveChat !== undefined, chatId)
  const label = props.label
  const footerRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (label !== undefined) frameRegion(label)(el)
      pinRef(el)
    },
    [label, pinRef],
  )
  useLayoutEffect(() => {
    const caret = caretRef.current
    const area = textArea()
    if (caret === null || !area) return
    caretRef.current = null
    area.focus()
    area.setSelectionRange(caret, caret)
  })
  useEffect(() => {
    if (!autoFocus) return
    const area = areaRef.current?.querySelector('textarea')
    // A "/" the owner types opens the list with the focus already in the box: the caret stays where he typed it.
    if (!area || area.ownerDocument.activeElement === area) return
    // Otherwise the caret goes after the text, where typing goes on.
    area.focus()
    area.setSelectionRange(area.value.length, area.value.length)
  }, [autoFocus])
  const onValueChange = (next: string) => {
    latestRef.current = next
    setText(next)
    drafts?.set(chatId, next)
    const caret = textArea()?.selectionStart ?? next.length
    const word = skillQuery(next, caret)
    setQuery(word)
    // A message that is one "/" word keeps the list open wherever the caret is; once a space follows it, as after a
    // picked skill, only a "/" word at the caret opens it.
    const open = word !== null || (next.startsWith('/') && !/\s/.test(next))
    if (skills === undefined || open === skills.open) return
    typedRef.current = open
    setMoved(null)
    onSkillsOpenChange?.(open)
  }
  const shown =
    skills === undefined ? [] : query === null ? skills.items : skills.items.filter((s) => s.name.startsWith(query))
  // The highlighted row: the one the arrow keys moved to, else the state's, else the first one listed.
  const highlighted =
    [moved, skills?.value].find((name) => name != null && shown.some((s) => s.name === name)) ?? shown[0]?.name ?? null
  const pick = (name: string) => {
    const area = textArea()
    const next = pickSkill(text, area?.selectionStart ?? text.length, name)
    // In the tap's own handler, so the phone keeps its keyboard up; the caret moves once the box holds the skill.
    area?.focus()
    caretRef.current = next.caret
    latestRef.current = next.text
    setText(next.text)
    drafts?.set(chatId, next.text)
    setQuery(null)
    setMoved(null)
    typedRef.current = false
    onSkillsOpenChange?.(false)
  }
  // While the list is open, the arrow keys move its highlight and Enter picks the highlighted skill, before the
  // composer sends the message.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (skills?.open !== true || highlighted === null || event.shiftKey || event.nativeEvent.isComposing) return
    if (!(event.target instanceof HTMLTextAreaElement)) return
    const at = shown.findIndex((s) => s.name === highlighted)
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (event.key !== 'Enter' && step === 0) return
    event.preventDefault()
    event.stopPropagation()
    if (step === 0) pick(highlighted)
    else setMoved(shown[(at + step + shown.length) % shown.length]?.name ?? highlighted)
  }
  const filesView = useFilesView(files)
  // With the folders control the attach button is Figma's add button; every other composer draws the paperclip.
  const attachLabel = folders === undefined ? 'Attach a file' : 'Add'
  // The paperclip's first tap with the phone's keyboard up only closes it, so iOS anchors its file menu at the
  // paperclip's closed-keyboard place on the next tap (R29, useKeyboardFirst.ts).
  const keyboardFirst = useKeyboardFirst(attachLabel)
  const pendingViews = usePendingViews(pending)
  // The box is controlled, so the composer never empties it: a sent message empties it here.
  const actions = useComposerActions({
    text,
    onSend,
    onStop,
    // The page's draft book holds the chat's draft even after this pane unmounts.
    draftNow: drafts === undefined ? undefined : () => drafts.get(chatId) ?? '',
    clear: (submitted) => {
      // The page keeps the draft by chat: it empties it only if it still holds what was sent, and the box follows.
      if (drafts !== undefined) drafts.clear(chatId, submitted)
      else if (latestRef.current === submitted) onValueChange('')
    },
    restore: (submitted) => {
      if (drafts !== undefined) drafts.restore(chatId, submitted)
      else onValueChange(restoredDraft(latestRef.current, submitted))
    },
    withFiles: filesView !== undefined && filesView.ready > 0,
    filesHeld: filesView?.blocked === true,
  })
  // A chat that cannot send yet (d-117, a Codex chat until W8): its disabled composer sends nothing.
  const send = (submitted: string): boolean | Promise<boolean> =>
    composer.notLive !== undefined ? false : actions.send(submitted)
  // With every file ready and no text, the composer submits '' (library beta.95).
  const sendDisabled = actions.tooLong || actions.sending || filesView?.blocked === true
  const onPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.currentTarget.files ?? [])
    // Emptied, so the same file can be picked again.
    event.currentTarget.value = ''
    if (picked.length > 0) files?.add(picked)
  }
  // A live chat's files; a sample chat's chips come from its state, and a live Codex chat has no paperclip.
  const attachProps =
    files !== undefined
      ? {
          attachments: filesView?.chips ?? [],
          onRemoveAttachment: files.remove,
          onRetryAttachment: files.retry,
          onAttach: () => {
            if (keyboardFirst.opens()) fileRef.current?.click()
          },
          onAddFiles: files.add,
        }
      : {
          attachments: composer.attachments.map((name) => ({ id: name, name })),
          onRemoveAttachment: () => undefined,
          onAttach: composer.notLive === undefined ? () => undefined : undefined,
        }
  const chip =
    composer.model === undefined ? undefined : (
      <ModelChip
        model={composer.model}
        options={[{ value: composer.model, label: composer.model }]}
        value={composer.model}
      />
    )
  const box = (
    <Composer
      label={composer.notLive ?? composer.placeholder}
      placeholder={composer.notLive ?? composer.placeholder}
      disabled={composer.notLive !== undefined}
      value={text}
      onValueChange={onValueChange}
      onSend={send}
      running={composer.running}
      onStop={actions.stop}
      sendDisabled={sendDisabled}
      {...attachProps}
      // With the folders control (D4 137:2) the attach button is Figma's add button (137:5), a + that offers Add folder
      // and attachments. Figma's plus (137:6) is 13 px and no icon size is 13, so it is 12 (d-050, d-100). Every other
      // composer of the page draws the paperclip.
      attachLabel={attachLabel}
      {...(folders === undefined ? {} : { attachIcon: <PlusIcon size="12" /> })}
      sendIconSize={sendIconSize}
      // Every running chat composer of the page draws Stop with a 12 px stop icon and a 25 × 14 Medium label (D01
      // 105:253 and 105:255, M03 105:2839, T04 105:2284, D19 417:1730): the 12 px icon and `labelXs` (12), the
      // nearest text size to Figma's 11 (d-100), in place of the 16 px icon and the 14 px `label` (library beta.80).
      stopIconSize="12"
      stopTextSize="xs"
      layout={layout}
      model={
        folders === undefined ? (
          chip
        ) : (
          <Inline gap="6" align="center">
            {folders}
            {chip}
          </Inline>
        )
      }
    />
  )
  const composerBox =
    skills === undefined ? (
      <div
        ref={areaRef}
        data-figma={figma.composer}
        data-keyboard-keep=""
        onPointerDownCapture={keyboardFirst.onPointerDownCapture}
      >
        {box}
      </div>
    ) : (
      <SkillPicker
        // The typed part keeps its case: the label is the template's text before {query}, and the query follows it.
        {...(query !== null && query.length > 1 && skills.matching !== undefined
          ? { label: skills.matching.replace('{query}', '').trim(), query }
          : { label: skills.label })}
        skills={shown}
        value={highlighted}
        open={skills.open}
        layout={size === 'phone' || size === 'tablet' ? size : 'pane'}
        figma={figma.skills}
        onPick={pick}
        onHighlight={setMoved}
        onOpenChange={(open) => {
          // The box is the popover's trigger: a click on it asks to open the list, which only "/" does.
          if (!open) onSkillsOpenChange?.(false)
        }}
        onListFocus={() => {
          if (!typedRef.current) return
          typedRef.current = false
          areaRef.current?.querySelector('textarea')?.focus()
        }}
      >
        {/* The composer is the popover's trigger: the skill list belongs to what the owner types, so the box is a combobox
            (a div cannot carry the trigger's aria-expanded). The library's Composer has no skill list (LIBRARY_GAPS.md). */}
        <div
          ref={areaRef}
          data-figma={figma.composer}
          data-keyboard-keep=""
          role="combobox"
          aria-label={skills.label}
          onKeyDownCapture={onKeyDownCapture}
          onPointerDownCapture={keyboardFirst.onPointerDownCapture}
        >
          {box}
        </div>
      </SkillPicker>
    )
  // The quiet line under the composer when a send or a stop missed, or the text is over the limit.
  const sendLine =
    actions.line !== undefined ? (
      <ComposerLine text={actions.line} onRetry={actions.retry} onClearInput={actions.clearInput} />
    ) : filesView?.line !== undefined ? (
      <ComposerLine text={filesView.line} />
    ) : null
  // The device's file picker, which the paperclip opens: any type, and no capture, so a phone offers Photos, Camera and
  // Files.
  const picker =
    files === undefined ? null : (
      <input ref={fileRef} type="file" multiple hidden tabIndex={-1} aria-label="Files to attach" onChange={onPicked} />
    )
  // One bad entry shows an inline fallback in the transcript, and the header and the composer keep working (audit P-1).
  const entryViews =
    notLive === undefined ? (
      <>
        {earlier === undefined ? null : <span className={earlierLine}>{earlier}</span>}
        {empty === undefined || pendingViews.length > 0 ? null : <span className={earlierLine}>{empty}</span>}
        <TranscriptEntries chatId={chatId} entries={entries} figma={figma.entries} onCopy={onCopy} />
        {pendingViews.map((view) => (
          <PendingEntry key={view.key} text={view.text} files={view.files} sending={view.sending} />
        ))}
        {problem === undefined ? null : (
          <TranscriptProblem
            text={problem}
            onRetry={
              liveChat === undefined || transcripts === undefined
                ? undefined
                : () => {
                    transcripts.retry(liveChat)
                  }
            }
          />
        )}
        {liveChat === undefined ? null : <NewestButton newest={newest} />}
      </>
    ) : (
      <NotLive text={notLive} />
    )
  if (props.label !== undefined) {
    const parts = framed[props.size]
    return (
      <ScrollFrame
        footerShrink={footerShrinks[size]}
        bodyClassName={cx(gaps[size].body, parts.body)}
        header={props.header}
        footer={
          <div ref={footerRef} className={cx(footer, gaps[size].footer, parts.footer)}>
            {above}
            {composerBox}
            {picker}
            {sendLine}
          </div>
        }
      >
        {lead}
        {entryViews}
      </ScrollFrame>
    )
  }
  return (
    <div className={cx(body, sizes[size])}>
      <ScrollFrame
        footerShrink={footerShrinks[size]}
        bodyClassName={gaps[size].body}
        footer={
          // The part of a pane a stacked split keeps in view (paneFloors.ts).
          <div ref={footerRef} className={cx(footer, gaps[size].footer)} data-pane-floor>
            {above}
            {composerBox}
            {picker}
            {sendLine}
          </div>
        }
      >
        {lead}
        {entryViews}
      </ScrollFrame>
      {props.overlay}
    </div>
  )
}
