// The New chat form over the screen (D3 105:1379): an optional name, which
// becomes a random one when left blank, what the chat runs in, its
// workspace, its folders, its model and the first message, then Cancel and
// Start chat. The library's `Dialog size="lg"` is the form's box. Props only.
import {
  ArrowUpIcon,
  Button,
  CloseIcon,
  Composer,
  Dialog,
  DialogClose,
  FolderIcon,
  Grid,
  Inline,
  KindMark,
  PlusIcon,
  TextField,
} from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { NewChatDialogLayers, NewChatForm, Workspace } from '../types.ts'
import { FormField } from './FormField.tsx'
import { SelectField } from './SelectField.tsx'

// D3's Figma layers, which a frame with its own layers (T7) replaces.
const d3Layers: NewChatDialogLayers = {
  dialog: '105:1379',
  fields: {
    name: '114:2',
    runsIn: '105:1404',
    workspace: '105:1414',
    folders: '128:2',
    model: '105:1422',
    message: '105:1438',
  },
  // D3 names no box for the name; its field stands for it.
  boxes: { workspace: '105:1409', model: '105:1417', message: '105:1427' },
  runsIn: { claude: '105:1389', codex: '105:1393', shell: '105:1399' },
  folders: ['128:8', '128:12'],
  addFolder: '128:19',
  cancel: '105:1443',
  start: '105:1445',
}

const wide = css({ w: '[100%]' })
// Figma draws Add folder's border dashed (128:19); a Button's border is solid.
const dashed = css({ borderStyle: 'dashed' })

export type NewChatDialogProps = {
  form: NewChatForm
  workspaces: readonly Workspace[]
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The frame's Figma layers; D3's when not set. */
  layers?: NewChatDialogLayers | undefined
}

export function NewChatDialog({ form, workspaces, open, onOpenChange, layers = d3Layers }: NewChatDialogProps) {
  const { labels } = form
  const messageRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog
      size="lg"
      title={form.title}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The first message has the focus, as Figma draws its cyan border (105:1427), or the name when `form.focus` says.
      initialFocus={() =>
        form.focus === 'name'
          ? (nameRef.current?.querySelector('input') ?? null)
          : (messageRef.current?.querySelector('textarea') ?? null)
      }
      data-figma={layers.dialog}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm" data-figma={layers.cancel}>
              {form.cancel}
            </Button>
          </DialogClose>
          <Button size="sm" textSize="smStrong" variant="primary" data-figma={layers.start}>
            <ArrowUpIcon size="12" />
            {form.start}
          </Button>
        </>
      }
    >
      <FormField
        label={labels.name}
        hint={form.name.value === undefined || form.name.value === '' ? form.name.hint : undefined}
        figma={layers.fields.name}
      >
        <div ref={nameRef} className={wide} data-figma={layers.boxes.name}>
          <TextField
            label={labels.name}
            labelHidden
            size="lg"
            placeholder={form.name.placeholder}
            defaultValue={form.name.value}
          />
        </div>
      </FormField>
      <FormField label={labels.runsIn} figma={layers.fields.runsIn}>
        <Grid columns="3" gap="6" role="group" aria-label={labels.runsIn}>
          {form.runsIn.options.map((o) => (
            <Button key={o.kind} size="lg" pressed={o.kind === form.runsIn.value} data-figma={layers.runsIn[o.kind]}>
              <KindMark kind={o.kind} size="16" />
              {o.label}
            </Button>
          ))}
        </Grid>
      </FormField>
      <FormField label={labels.workspace} figma={layers.fields.workspace}>
        <SelectField
          label={labels.workspace}
          options={workspaces.map((w) => ({ value: w.id, label: w.label }))}
          value={form.workspace}
          figma={layers.boxes.workspace}
        />
      </FormField>
      <FormField label={labels.folders} figma={layers.fields.folders}>
        <Inline gap="6" align="center" wrap>
          {form.folders.map((path, i) =>
            i === 0 ? (
              // 128:8 and T7 420:367 draw #5ee1ff at 0.6, border.selected's colour, not border.active.
              <Button key={path} size="sm" keepIconSize pressed pressedBorder="selected" data-figma={layers.folders[i]}>
                <FolderIcon size="12" />
                {path}
              </Button>
            ) : (
              <Button key={path} size="sm" keepIconSize aria-label={`Remove ${path}`} data-figma={layers.folders[i]}>
                <FolderIcon size="12" />
                {path}
                <CloseIcon size="12" />
              </Button>
            ),
          )}
          <Button size="sm" textSize="xs" keepIconSize className={dashed} data-figma={layers.addFolder}>
            <PlusIcon size="12" />
            {form.addFolder}
          </Button>
        </Inline>
      </FormField>
      <FormField label={labels.model} figma={layers.fields.model}>
        <SelectField
          label={labels.model}
          options={form.model.options}
          value={form.model.value}
          figma={layers.boxes.model}
        />
      </FormField>
      <FormField label={labels.message} figma={layers.fields.message}>
        <div ref={messageRef} data-figma={layers.boxes.message} className={wide}>
          <Composer
            label={labels.message}
            placeholder={form.message.placeholder}
            onAttach={() => undefined}
            model={
              <Button variant="text" size="xs" aria-label={form.message.skills}>
                /
              </Button>
            }
          />
        </div>
      </FormField>
    </Dialog>
  )
}
