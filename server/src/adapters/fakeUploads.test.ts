import { createFakeUploads } from './fakeUploads.ts'
import { describeUploadStore } from './uploadStoreContract.ts'

describeUploadStore('fake', ({ now, heicConverts }) => {
  const store = createFakeUploads({ chunkSize: 4, now, heicConverts })
  return Promise.resolve({ store, file: (upload) => Promise.resolve(store.file(upload)) })
})
