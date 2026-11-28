// The Open questions panel of an idea's page (d-135, D09): the items of
// the record's "## Open questions" list (ideaBody.ts), with their count.
// With none it draws nothing. Props only.
import { Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const list = css({
  listStyleType: 'disc',
  pl: '20',
  textStyle: 'body',
  color: 'fg.default',
  '& > li + li': { mt: '4' },
  '& > li::marker': { color: 'fg.muted' },
})

export type IdeaQuestionsProps = {
  /** The panel's title, such as "Open questions". */
  title: string
  questions: readonly string[]
}

export function IdeaQuestions({ title, questions }: IdeaQuestionsProps) {
  if (questions.length === 0) return null
  return (
    <Panel title={title} meta={questions.length}>
      <ul className={list}>
        {questions.map((question, index) => (
          <li key={`${String(index)}-${question}`}>{question}</li>
        ))}
      </ul>
    </Panel>
  )
}
