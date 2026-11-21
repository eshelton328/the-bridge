import { createFakeUploads } from './fakeUploads.ts'
import { describeUploadStore } from './uploadStoreContract.ts'

describeUploadStore('fake', () => {
  const store = createFakeUploads(4)
  return Promise.resolve({ store, file: (upload) => Promise.resolve(store.file(upload)) })
})
