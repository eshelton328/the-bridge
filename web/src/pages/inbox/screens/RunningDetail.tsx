// The detail of a started item: a header with where it runs and its state,
// the chat streaming below it and a reply box at the bottom. Props only.
import {
  Button,
  ChevronRightIcon,
  Composer,
  Container,
  ExternalLinkIcon,
  Inline,
  KindMark,
  ModelChip,
  Panel,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { ChatEntry } from '../blocks/ChatEntry.tsx'
import { InboxStatus } from '../blocks/InboxStatus.tsx'
import type { InboxRunning } from '../types.ts'

const fill = css({ flex: '1' })
const title = css({ textStyle: 'subtitle', m: '0', flex: '1' })
const meta = css({ textStyle: 'mono', color: 'fg.muted', flex: '1' })

export function RunningDetail({ detail }: { detail: InboxRunning }) {
  return (
    <Container size="desktop" className={fill}>
      <Stack gap="16" className={fill}>
        <div data-figma="started task">
          <Panel>
            <Stack gap="6">
              <Inline gap="10" align="center">
                <h1 className={title}>{detail.title}</h1>
                <Button size="sm">
                  View task
                  <ChevronRightIcon />
                </Button>
                <Button size="sm">
                  <ExternalLinkIcon />
                  Open in Workspaces
                </Button>
              </Inline>
              <Inline gap="6" align="center">
                <KindMark kind={detail.agent} size="16" />
                <span className={meta}>{detail.meta}</span>
                <InboxStatus pill={detail.status} />
              </Inline>
            </Stack>
          </Panel>
        </div>
        <Stack gap="16" className={fill}>
          {detail.chat.map((entry, i) => (
            <ChatEntry key={`${String(i)}:${entry.type}`} entry={entry} />
          ))}
        </Stack>
        <Composer
          label="Reply"
          placeholder={detail.reply}
          running
          onAttach={() => undefined}
          model={<ModelChip model={detail.model} options={[{ value: detail.model, label: detail.model }]} />}
        />
      </Stack>
    </Container>
  )
}
