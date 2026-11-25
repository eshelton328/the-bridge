import { createFakeFiles } from './fakeFiles.ts'
import { describeFileStore } from './fileStoreContract.ts'

describeFileStore('fake', ({ tracked, linkOut, fifo }) =>
  Promise.resolve({ store: createFakeFiles({ tracked, unreadable: [linkOut, fifo] }), dir: '/fake/brain' }),
)
