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
import type { AgentKind, NewChatForm, Workspace } from '../types.ts'
import { FormField } from './FormField.tsx'
import { SelectField } from './SelectField.tsx'

// D3's Figma layers of the Runs in choices and of the folder chips, in order.
const runsInLayers: Record<AgentKind, string> = { claude: '105:1389', codex: '105:1393', shell: '105:1399' }
const folderLayers = ['128:8', '128:12']

const wide = css({ w: '[100%]' })

export type NewChatDialogProps = {
  form: NewChatForm
  workspaces: readonly Workspace[]
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function NewChatDialog({ form, workspaces, open, onOpenChange }: NewChatDialogProps) {
  const { labels } = form
  const messageRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog
      size="lg"
      title={form.title}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The first message has the focus, as Figma draws its cyan border (105:1427).
      initialFocus={() => messageRef.current?.querySelector('textarea') ?? null}
      data-figma="105:1379"
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm" data-figma="105:1443">
              {form.cancel}
            </Button>
          </DialogClose>
          <Button size="sm" textSize="smStrong" variant="primary" data-figma="105:1445">
            <ArrowUpIcon size="12" />
            {form.start}
          </Button>
        </>
      }
    >
      <FormField label={labels.name} hint={form.name.hint} figma="114:2">
        <TextField label={labels.name} labelHidden size="lg" placeholder={form.name.placeholder} />
      </FormField>
      <FormField label={labels.runsIn} figma="105:1404">
        <Grid columns="3" gap="6" role="group" aria-label={labels.runsIn}>
          {form.runsIn.options.map((o) => (
            <Button key={o.kind} size="lg" pressed={o.kind === form.runsIn.value} data-figma={runsInLayers[o.kind]}>
              <KindMark kind={o.kind} size="16" />
              {o.label}
            </Button>
          ))}
        </Grid>
      </FormField>
      <FormField label={labels.workspace} figma="105:1414">
        <SelectField
          label={labels.workspace}
          options={workspaces.map((w) => ({ value: w.id, label: w.label }))}
          value={form.workspace}
          figma="105:1409"
        />
      </FormField>
      <FormField label={labels.folders} figma="128:2">
        <Inline gap="6" align="center" wrap>
          {form.folders.map((path, i) =>
            i === 0 ? (
              <Button key={path} size="sm" pressed data-figma={folderLayers[i]}>
                <FolderIcon size="12" />
                {path}
              </Button>
            ) : (
              <Button key={path} size="sm" aria-label={`Remove ${path}`} data-figma={folderLayers[i]}>
                <FolderIcon size="12" />
                {path}
                <CloseIcon size="12" />
              </Button>
            ),
          )}
          <Button size="sm" textSize="xs" data-figma="128:19">
            <PlusIcon size="12" />
            {form.addFolder}
          </Button>
        </Inline>
      </FormField>
      <FormField label={labels.model} figma="105:1422">
        <SelectField label={labels.model} options={form.model.options} value={form.model.value} figma="105:1417" />
      </FormField>
      <FormField label={labels.message} figma="105:1438">
        <div ref={messageRef} data-figma="105:1427" className={wide}>
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
