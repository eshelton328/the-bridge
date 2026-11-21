import { describe, expect, it } from 'vitest'
import { launchArgsOf, restartArgs } from './claudeArgs.ts'

const session = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'

describe('launchArgsOf', () => {
  it('keeps the known flags in order, in both forms, and drops the session and model flags', () => {
    expect(
      launchArgsOf(
        '/home/dev/.local/bin/claude --permission-mode=acceptEdits -n marker-5150 --model opus --resume --add-dir /home/dev/src --chrome --effort high -c',
      ),
    ).toEqual({
      kept: [
        '--permission-mode',
        'acceptEdits',
        '-n',
        'marker-5150',
        '--add-dir',
        '/home/dev/src',
        '--chrome',
        '--effort',
        'high',
      ],
      name: 'marker-5150',
    })
    expect(launchArgsOf('claude')).toEqual({ kept: [], name: undefined })
    expect(launchArgsOf(`claude -r ${session} --session-id ${session} --fork-session`)).toEqual({
      kept: [],
      name: undefined,
    })
  })

  it('refuses a flag or a mode that skips permissions', () => {
    expect(launchArgsOf('claude --dangerously-skip-permissions')).toBe('skipsPermissions')
    expect(launchArgsOf('claude -n a --allow-dangerously-skip-permissions')).toBe('skipsPermissions')
    expect(launchArgsOf('claude --permission-mode bypassPermissions')).toBe('skipsPermissions')
    expect(launchArgsOf('claude --permission-mode=bypassPermissions')).toBe('skipsPermissions')
  })

  it('refuses another program, an unknown flag or value, a prompt, a value with a space or a missing value', () => {
    for (const line of [
      'node /home/dev/cli.js',
      'claude --debug',
      'claude --permission-mode yolo',
      'claude --effort extreme',
      'claude -n Marker',
      'claude fix the bug',
      'claude --add-dir /home/dev/my folder',
      'claude --settings {"a": 1}',
      'claude --agent',
      'claude --chrome=yes',
      'claude --add-dir --chrome',
    ])
      expect(launchArgsOf(line), line).toBe('launchArgsUnknown')
  })
})

describe('restartArgs', () => {
  it('adds the herdr name only when the command line had none, then the session and the model', () => {
    expect(restartArgs({ kept: ['--chrome'], name: undefined }, 'marker-5150', session, 'sonnet')).toEqual([
      '--chrome',
      '-n',
      'marker-5150',
      '--resume',
      session,
      '--model',
      'sonnet',
    ])
    expect(restartArgs({ kept: ['-n', 'a'], name: 'a' }, 'b', session, 'opus')).toEqual([
      '-n',
      'a',
      '--resume',
      session,
      '--model',
      'opus',
    ])
    expect(restartArgs({ kept: [], name: undefined }, undefined, session, 'opus')).toEqual([
      '--resume',
      session,
      '--model',
      'opus',
    ])
  })
})
