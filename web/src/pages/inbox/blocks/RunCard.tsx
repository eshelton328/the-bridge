// A started next step's chat: where it runs or ran, its state, what it is
// doing or what it did, and the two ways to open it. Props only.
import {
  BubbleIcon,
  Button,
  ExternalLinkIcon,
  Grid,
  Inline,
  KindMark,
  Panel,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRunCard } from '../types.ts'
import { InboxStatus } from './InboxStatus.tsx'

const title = css({ textStyle: 'label', flex: '1' })
const meta = css({ textStyle: 'mono', color: 'fg.muted' })

export function RunCard({ run }: { run: InboxRunCard }) {
  // Figma names the card after the run's state: "running card" (D6) or "result card" (D7).
  const key = run.status.tone === 'done' ? 'result card' : 'running card'
  return (
    <div data-figma={key}>
      <Panel>
        <Stack gap="8">
          <Inline gap="8" align="center">
            <KindMark kind={run.agent} size="16" />
            <span className={title}>{run.title}</span>
            <InboxStatus pill={run.status} />
          </Inline>
          <span className={meta}>{run.meta}</span>
          <Grid columns="2" gap="8">
            <Button variant="primary" size="lg">
              <BubbleIcon />
              {run.open}
            </Button>
            <Button size="lg">
              <ExternalLinkIcon />
              {run.openElsewhere}
            </Button>
          </Grid>
        </Stack>
      </Panel>
    </div>
  )
}
