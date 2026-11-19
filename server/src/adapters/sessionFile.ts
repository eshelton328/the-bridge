// The model of a Claude Code chat, from the end of its session file (a JSON
// line for each entry). Only the last 64 KB is read, and only when a request
// asks, so a long transcript costs the same as a short one.
import { open } from 'node:fs/promises'
import { z } from 'zod'

const tailBytes = 64 * 1024

const AssistantLine = z.object({ type: z.literal('assistant'), message: z.object({ model: z.string() }) })

/** The model of the last assistant entry, such as "claude-opus-5-5"; null when the file has none or cannot be read. */
export async function readClaudeModel(path: string): Promise<string | null> {
  let text: string
  try {
    const handle = await open(path, 'r')
    try {
      const { size } = await handle.stat()
      const start = Math.max(0, size - tailBytes)
      const buffer = Buffer.alloc(size - start)
      await handle.read(buffer, 0, buffer.length, start)
      text = buffer.toString('utf8')
    } finally {
      await handle.close()
    }
  } catch {
    return null
  }
  const lines = text.split('\n').reverse()
  for (const line of lines) {
    let value: unknown
    try {
      value = JSON.parse(line)
    } catch {
      continue
    }
    const entry = AssistantLine.safeParse(value)
    // Claude Code writes "<synthetic>" for an entry no model made, such as an interrupted turn.
    if (entry.success && entry.data.message.model !== '<synthetic>') return entry.data.message.model
  }
  return null
}

/** Claude Code's folder name for a working directory: each character that is not a letter or digit becomes "-". */
export function claudeProjectFolder(cwd: string): string {
  return cwd.replace(/[^A-Za-z0-9]/g, '-')
}
