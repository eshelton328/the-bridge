// The Vitest sequencer of vitest.config.ts: with --shard it splits the
// files by measured time (testShards.ts), not by Vitest's path hash. The
// order inside a shard is Vitest's own.
import { readFileSync } from 'node:fs'
import { relative, sep } from 'node:path'
import { BaseSequencer, type TestSpecification } from 'vitest/node'
import { z } from 'zod'
import { assignShard } from './testShards.ts'

const shardTimes = z.object({
  source: z.string(),
  defaultMs: z.number().positive(),
  files: z.record(z.string(), z.number().nonnegative()),
})

export class TimedSequencer extends BaseSequencer {
  override shard(files: TestSpecification[]): Promise<TestSpecification[]> {
    const { root, shard } = this.ctx.config
    if (shard === undefined) return Promise.resolve(files)
    const times = shardTimes.parse(JSON.parse(readFileSync(new URL('testShardTimes.json', import.meta.url), 'utf8')))
    const key = (spec: TestSpecification) => relative(root, spec.moduleId).split(sep).join('/')
    const picked = new Set(assignShard(files.map(key), times.files, times.defaultMs, shard.index, shard.count))
    return Promise.resolve(files.filter((spec) => picked.has(key(spec))))
  }
}
