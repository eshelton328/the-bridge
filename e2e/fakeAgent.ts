#!/usr/bin/env node
// The fake agent of the E2E suite (d-113): it uses no tokens. In a herdr
// pane it writes a Claude Code session file with one assistant entry,
// prints a fixed script, tells herdr it is a Claude agent with that
// session, and then waits until herdr closes the pane. The session file
// goes where Claude Code puts it: <projects>/<cwd as a folder name>/<id>.jsonl.
// With "-" for the session it writes no session file and reports none:
// herdr then takes the agent's status from pane.report_agent, so a test
// can change it (reportAgent.ts). With a session from "herdr:claude", herdr
// reads a Claude pane's status from its screen and ignores those reports
// (tried with herdr protocol 22).
//   node e2e/fakeAgent.ts <claude projects folder> <session id | -> <title>
import { mkdirSync, writeFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { join } from 'node:path'

const [projects, session, title] = process.argv.slice(2)
const socket = process.env.HERDR_SOCKET_PATH
const pane = process.env.HERDR_PANE_ID
if (!projects || !session || !title || !socket || !pane) {
  console.error('usage: node e2e/fakeAgent.ts <claude projects folder> <session id> <title>, in a herdr pane')
  process.exit(2)
}

const withSession = session !== '-'
const folder = join(projects, process.cwd().replace(/[^A-Za-z0-9]/g, '-'))
const lines = [
  { type: 'user', uuid: 'e2e-u1', message: { role: 'user', content: 'Say hello.' } },
  {
    type: 'assistant',
    uuid: 'e2e-a1',
    message: {
      role: 'assistant',
      model: 'claude-opus-5-5',
      content: [{ type: 'tool_use', id: 'e2e-t1', name: 'Bash', input: { command: 'git status --short' } }],
    },
  },
  {
    type: 'user',
    uuid: 'e2e-r1',
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'e2e-t1' }] },
  },
  {
    type: 'assistant',
    uuid: 'e2e-a2',
    message: { role: 'assistant', model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Hello.' }] },
  },
]
if (withSession) {
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, `${session}.jsonl`), `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)
}

// The terminal title, which herdr shows as the chat's title.
process.stdout.write(`\x1b]0;${title}\x07`)
console.log('fake agent: Say hello.')
console.log('fake agent: Hello.')

// The agent's state under the suite's own source, then its session as
// herdr's Claude integration reports one (herdr lists a session only from
// the source "herdr:claude"; tried with herdr protocol 22).
const reports = [
  { method: 'pane.report_agent', params: { pane_id: pane, source: 'bridge-e2e', agent: 'claude', state: 'idle' } },
  ...(withSession
    ? [
        {
          method: 'pane.report_agent_session',
          params: { pane_id: pane, source: 'herdr:claude', agent: 'claude', agent_session_id: session },
        },
      ]
    : []),
]
const send = (index: number): void => {
  const report = reports[index]
  if (!report) return
  const conn = createConnection(socket, () =>
    conn.write(`${JSON.stringify({ id: `fake-agent:${String(index)}`, ...report })}\n`),
  )
  conn.setEncoding('utf8')
  // Without this listener a socket error kills the agent with no line in its pane.
  conn.on('error', (error) => {
    console.error(`fake agent: herdr did not take ${report.method}: ${error.message}`)
    process.exit(1)
  })
  conn.on('data', (reply: string) => {
    console.log(`fake agent: herdr ${reply.includes('"error"') ? 'refused' : 'took'} ${report.method}`)
    conn.end()
    send(index + 1)
  })
}
send(0)
setInterval(() => undefined, 60_000)
