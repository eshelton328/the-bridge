// The header of the chat shown alone while the page waits for its first list (R58, the loading standard): ChatHead's
// two rows (D2 105:785) with skeletons in their place, so the loaded header lands where this one is. The first row is
// the kind mark and the title over the workspace, in their text styles; the second the model chip's box, as high as
// the chip, with a skeleton in its text. The status and the actions are left out: they are lower than the titles, so
// the row keeps its height. Props only.
import { Inline, Skeleton } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// As ChatHead's two-row header: 12 over the first row, the rows 4 apart and 8 over the rule.
const head = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  pt: '12',
  pb: '8',
  px: '16',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
})
const titles = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]' })
const title = css({ textStyle: 'subtitle' })
const where = css({ textStyle: 'monoSm' })
// The model chip's box (the library's modelChip recipe): its text style, padding and border, so the row is as high.
const chip = css({
  alignSelf: 'flex-start',
  textStyle: 'pill',
  py: '4',
  px: '8',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'transparent',
})

export function ChatHeadSkeleton() {
  return (
    <header className={head} aria-hidden="true" data-fit="chatHead">
      <Inline gap="8" align="center">
        <Skeleton shape="circle" size="icon20" />
        <div className={titles}>
          <div className={title}>
            <Skeleton width="half" />
          </div>
          <div className={where}>
            <Skeleton width="short" />
          </div>
        </div>
      </Inline>
      <div className={chip}>
        <Skeleton width="word" />
      </div>
    </header>
  )
}
