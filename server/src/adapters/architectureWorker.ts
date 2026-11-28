// The worker of the snapshot reader (f-008 increment two, A1b): it gets the
// bytes of the tracked package.json files from the main thread and gives back
// the diagram's model. It parses file bytes as data only: it runs no git, no
// child process and no fs, so a file in a repository cannot reach anything.
import { parentPort, workerData } from 'node:worker_threads'
import { modelOf } from '../services/architectureRules.ts'

type Input = { readonly files: readonly { readonly path: string; readonly bytes: Uint8Array }[] }

const isInput = (value: unknown): value is Input =>
  typeof value === 'object' &&
  value !== null &&
  Object.hasOwn(value, 'files') &&
  Array.isArray(Reflect.get(value, 'files'))

const decoder = new TextDecoder('utf-8')
const input: unknown = workerData
const files = isInput(input) ? input.files.map((f) => ({ path: f.path, text: decoder.decode(f.bytes) })) : []
parentPort?.postMessage({ model: modelOf(files) })
